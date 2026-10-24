<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, defineComponent, h, ref } from 'vue'
import agentApi from '@/api/agentApi'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const objective = ref('')
const ideas = ref('')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const copied = ref(false)

const ideaList = computed(() =>
  ideas.value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean),
)

// Renderização segura de Markdown: todo conteúdo da IA vira nós de texto Vue,
// sem v-html, scripts ou dependências externas.
function renderInline(text) {
  const nodes = []
  const pattern = /(\*\*([^*\n]+)\*\*|__([^_\n]+)__|`([^`\n]+)`|\*([^*\n]+)\*|_([^_\n]+)_)/g
  let cursor = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index
    if (index > cursor) nodes.push(text.slice(cursor, index))
    const strong = match[2] || match[3]
    const code = match[4]
    const italic = match[5] || match[6]
    if (strong) nodes.push(h('strong', strong))
    else if (code) nodes.push(h('code', code))
    else if (italic) nodes.push(h('em', italic))
    cursor = index + match[0].length
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function parseReport(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) { index++; continue }

    if (/^\s*```/.test(line)) {
      const language = line.trim().slice(3).trim()
      const content = []
      index++
      while (index < lines.length && !/^\s*```/.test(lines[index])) content.push(lines[index++])
      if (index < lines.length) index++
      blocks.push({ type: 'code', text: content.join('\n'), language })
      continue
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: Math.min(heading[1].length, 4), text: heading[2].replace(/\s+#+\s*$/, '') })
      index++
      continue
    }

    if (/^\s{0,3}(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ type: 'divider' }); index++; continue
    }

    const listMatch = line.match(/^\s{0,3}([-*+]\s+|\d+[.)]\s+)(.*)$/)
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1])
      const start = ordered ? Number.parseInt(listMatch[1], 10) : undefined
      const items = []
      while (index < lines.length) {
        const item = lines[index].match(/^\s{0,3}([-*+]\s+|\d+[.)]\s+)(.*)$/)
        if (!item || /^\d/.test(item[1]) !== ordered) break
        items.push(item[2])
        index++
        while (index < lines.length && /^\s{2,}\S/.test(lines[index]) && !/^\s*([-*+]\s+|\d+[.)]\s+)/.test(lines[index])) {
          items[items.length - 1] += ' ' + lines[index].trim()
          index++
        }
      }
      blocks.push({ type: ordered ? 'ordered' : 'unordered', items, start })
      continue
    }

    if (/^\s{0,3}>\s?/.test(line)) {
      const quote = []
      while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) {
        quote.push(lines[index++].replace(/^\s{0,3}>\s?/, ''))
      }
      blocks.push({ type: 'quote', text: quote.join(' ') })
      continue
    }

    const paragraph = []
    while (index < lines.length && lines[index].trim()
      && !/^\s{0,3}(#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?|---+\s*$|\*\*\*+\s*$|___+\s*$|```)/.test(lines[index])) {
      paragraph.push(lines[index++].trim())
    }
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
    else index++ // Garante avanço caso haja um marcador não reconhecido.
  }
  return blocks
}

const ReportContent = defineComponent({
  name: 'ReportContent',
  props: { markdown: { type: String, default: '' } },
  setup(props) {
    return () => h('div', { class: 'agent-markdown' }, parseReport(props.markdown).map((block, index) => {
      const key = index
      if (block.type === 'heading') return h('h' + block.level, { key }, renderInline(block.text))
      if (block.type === 'divider') return h('hr', { key })
      if (block.type === 'code') return h('pre', { key }, [h('code', block.text)])
      if (block.type === 'quote') return h('blockquote', { key }, renderInline(block.text))
      if (block.type === 'ordered' || block.type === 'unordered') {
        const tag = block.type === 'ordered' ? 'ol' : 'ul'
        return h(tag, { key, ...(block.start ? { start: block.start } : {}) }, block.items.map((item, i) =>
          h('li', { key: i }, renderInline(item))
        ))
      }
      return h('p', { key }, renderInline(block.text))
    }))
  },
})

function errorMessage(err) {
  const data = err?.response?.data
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flatMap((value) =>
      Array.isArray(value) ? value : [value],
    )
    const text = messages.filter((value) => typeof value === 'string').join(' ')
    if (text) return text
  }
  return err?.message || 'Não foi possível gerar a análise.'
}

async function analyze() {
  if (loading.value) return

  loading.value = true
  error.value = ''
  result.value = null
  copied.value = false

  try {
    const { data } = await agentApi.analyze(props.project.id, {
      objetivo: objective.value.trim(),
      ideias: ideaList.value,
    })

    result.value = data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}

async function copyResult() {
  if (!result.value?.analise) return
  try {
    await navigator.clipboard.writeText(result.value.analise)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <section class="agent-card" aria-labelledby="agent-title">
    <div class="agent-heading">
      <div>
        <span class="agent-eyebrow">AGENTE DE IA</span>
        <h2 id="agent-title">Transforme ideias em um plano.</h2>
        <p>
          Descreva seu objetivo e reúna suas ideias. A IA ajuda a organizar os próximos passos.
        </p>
      </div>

      <span class="mdi mdi-creation-outline agent-icon" aria-hidden="true"></span>
    </div>

    <div class="agent-form">
      <label>
        <span>Qual é o objetivo?</span>
        <textarea
          v-model="objective"
          rows="3"
          maxlength="1000"
          placeholder="Ex.: finalizar a primeira versão do projeto até sexta-feira."
        ></textarea>
      </label>

      <label>
        <span>Ideias e tarefas <small>Uma por linha</small></span>
        <textarea
          v-model="ideas"
          rows="5"
          placeholder="Criar página inicial&#10;Organizar as tarefas da equipe&#10;Preparar a apresentação"
        ></textarea>
      </label>

      <div class="agent-actions">
        <small>{{ ideaList.length }} ideia(s) informada(s)</small>

        <button
          type="button"
          class="agent-button"
          :disabled="loading"
          @click="analyze"
        >
          <span class="mdi mdi-auto-fix" aria-hidden="true"></span>
          {{ loading ? 'Organizando...' : 'Gerar plano' }}
        </button>
      </div>
    </div>

    <ToastNotice v-if="error" :message="error" type="error" />

    <div v-if="result" class="agent-result">
      <div class="agent-result-heading">
        <div>
          <span class="agent-mode">
            {{ result.modo === 'gemini' ? 'Gemini ativo' : result.modo === 'openai' ? 'IA ativa' : 'Modo local' }}
          </span>
          <h3>Relatório do projeto</h3>
          <small v-if="result.modo === 'gemini' && result.modelo" class="agent-model">{{ result.modelo }}</small>
        </div>

        <button type="button" class="copy-button" @click="copyResult">
          <span :class="copied ? 'mdi mdi-check' : 'mdi mdi-content-copy'" aria-hidden="true"></span>
          {{ copied ? 'Copiado' : 'Copiar' }}
        </button>
      </div>

      <ToastNotice v-if="result.aviso" :message="result.aviso" type="info" />

      <ReportContent :markdown="result.analise || ''" />
    </div>
  </section>
</template>

<style scoped>
/* Formulário leve, sem cartões aninhados ou divisórias desnecessárias. */
.agent-card{margin:0;padding:0;border:0;border-radius:0;background:transparent;color:#171717}
.agent-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:26px}
.agent-eyebrow{display:block;margin-bottom:9px;color:#777;font-size:10px;font-weight:700;letter-spacing:.13em}
.agent-heading h2{margin:0;font-size:clamp(22px,3vw,28px);font-weight:700;letter-spacing:-.045em;line-height:1.2}
.agent-heading p{max-width:520px;margin:10px 0 0;color:#777;font-size:13px;line-height:1.65}
.agent-icon{flex:0 0 auto;display:grid;place-items:center;width:42px;height:42px;border:1px solid #e8e8e8;border-radius:12px;background:#f7f7f7;color:#333;font-size:23px}
.agent-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px 16px}
.agent-form label{display:grid;align-content:start;gap:9px;min-width:0;color:#242424;font-size:12px;font-weight:650}
.agent-form label small{margin-left:5px;color:#999;font-size:11px;font-weight:400}
.agent-form textarea{width:100%;min-height:145px;box-sizing:border-box;padding:14px 15px;border:1px solid #dedede;border-radius:11px;background:#fff;color:#171717;font:inherit;font-size:13px;font-weight:400;line-height:1.6;resize:vertical;transition:border-color .15s,box-shadow .15s}
.agent-form textarea::placeholder{color:#a1a1a1}
.agent-form textarea:hover{border-color:#b9b9b9}
.agent-form textarea:focus{outline:none;border-color:#171717;box-shadow:0 0 0 3px rgb(23 23 23 / 8%)}
.agent-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:4px}
.agent-actions small{color:#8b8b8b;font-size:11px}
.agent-button,.copy-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:44px;padding:11px 19px;border:1px solid #171717;border-radius:10px;background:#171717;color:#fff;font:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:background-color .15s}
.agent-button:hover:not(:disabled){background:#333}
.agent-button:disabled{opacity:.55;cursor:not-allowed}
.agent-result{margin-top:28px;padding:24px;border:1px solid #e5e5e5;border-radius:12px;background:#fafafa}
.agent-result-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:17px;border-bottom:1px solid #e5e5e5}
.agent-result-heading h3{margin:7px 0 0;font-size:19px;letter-spacing:-.03em}
.agent-mode{color:#777;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.agent-model{display:block;margin-top:5px;color:#888;font-size:11px}
.copy-button{min-height:38px;padding:8px 13px;border-color:#dedede;background:#fff;color:#171717}
.copy-button:hover{background:#f0f0f0}
.agent-result :deep(.agent-markdown){margin-top:20px;color:#303030;font-size:13px;line-height:1.8;overflow-wrap:anywhere}
.agent-result :deep(.agent-markdown > *:first-child){margin-top:0}
.agent-result :deep(.agent-markdown h1){font-size:22px}
.agent-result :deep(.agent-markdown h2){font-size:18px}
.agent-result :deep(.agent-markdown h3){font-size:15px}
.agent-result :deep(.agent-markdown h1,.agent-markdown h2,.agent-markdown h3,.agent-markdown h4){margin:22px 0 10px;color:#171717;line-height:1.4}
.agent-result :deep(.agent-markdown p){margin:0 0 12px}
.agent-result :deep(.agent-markdown ul,.agent-markdown ol){margin:10px 0 16px;padding-left:23px}
.agent-result :deep(.agent-markdown li){margin:5px 0}
.agent-result :deep(.agent-markdown hr){height:1px;margin:20px 0;border:0;background:#e5e5e5}
.agent-result :deep(.agent-markdown blockquote){margin:14px 0;padding:8px 14px;border-left:3px solid #171717;background:#fff}
.agent-result :deep(.agent-markdown code){padding:2px 5px;border-radius:4px;background:#eee}
.agent-result :deep(.agent-markdown pre){overflow-x:auto;padding:14px;border-radius:8px;background:#eee}
.agent-result :deep(.agent-markdown pre code){padding:0}
.agent-button:focus-visible,.copy-button:focus-visible{outline:3px solid #888;outline-offset:3px}
@media(max-width:650px){
 .agent-heading{gap:12px;margin-bottom:22px}
 .agent-icon{width:36px;height:36px;font-size:19px}
 .agent-form{grid-template-columns:minmax(0,1fr);gap:16px}
 .agent-form textarea{min-height:108px}
 .agent-actions{align-items:stretch;flex-direction:column;gap:12px}
 .agent-actions small{text-align:left}
 .agent-button{width:100%}
 .agent-result{padding:16px}
 .agent-result-heading{align-items:flex-start;flex-wrap:wrap}
}
@media(prefers-reduced-motion:reduce){.agent-form textarea,.agent-button{transition:none}}
</style>