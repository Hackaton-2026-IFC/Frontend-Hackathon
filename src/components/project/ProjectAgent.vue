<script setup>
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
        <h2 id="agent-title">Organizar e transformar ideias.</h2>
        <p>
          O agente usa o contexto do projeto para montar relatório, ordem de execução,
          dependências, riscos e próximos passos.
        </p>
      </div>

      <span class="mdi mdi-creation-outline agent-icon" aria-hidden="true"></span>
    </div>

    <div class="agent-form">
      <label>
        <span>Objetivo</span>
        <textarea
          v-model="objective"
          rows="3"
          maxlength="1000"
          placeholder="Ex.: entregar o MVP até amanhã e priorizar o que destrava o restante."
        ></textarea>
      </label>

      <label>
        <span>Ideias — uma por linha</span>
        <textarea
          v-model="ideas"
          rows="5"
          placeholder="Adicionar onboarding&#10;Criar relatório automático&#10;Reorganizar tarefas por dependência"
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
          {{ loading ? 'Analisando...' : 'Gerar relatório' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="agent-error" role="alert">
      {{ error }}
    </p>

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

      <p v-if="result.aviso" class="agent-warning">
        {{ result.aviso }}
      </p>

      <ReportContent :markdown="result.analise || ''" />
    </div>
  </section>
</template>

<style scoped>
.agent-card{margin-top:24px;padding:26px;border:1px solid #171716;border-radius:18px;background:#f8f8f5;color:#171716}.agent-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding-bottom:20px;border-bottom:1px solid #d6d6d0}.agent-eyebrow{font-size:10px;font-weight:800;letter-spacing:1.5px}.agent-heading h2{margin:8px 0 8px;font-size:25px;letter-spacing:-.8px}.agent-heading p{max-width:680px;margin:0;color:#555;line-height:1.65;font-size:13px}.agent-icon{flex:0 0 auto;font-size:38px}.agent-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.agent-form label{display:grid;gap:7px;font-size:11px;font-weight:800}.agent-form textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid #c9c9c3;border-radius:10px;background:#fff;color:#171716;font:inherit;font-size:14px;line-height:1.5;resize:vertical}.agent-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:16px}.agent-actions small{color:#666}.agent-button,.copy-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid #171716;border-radius:999px;background:#171716;color:#fff;font:inherit;font-size:12px;font-weight:750;cursor:pointer}.agent-button{min-height:44px;padding:10px 18px}.agent-button:disabled{opacity:.55;cursor:not-allowed}.agent-error,.agent-warning{margin:18px 0 0;padding:11px 13px;border-radius:9px;font-size:12px}.agent-error{border:1px solid #c77;background:#fff0f0;color:#7d1f1f}.agent-warning{border:1px solid #c5a85f;background:#fff8df;color:#654d0a}.agent-result{margin-top:22px;padding:20px;border:1px solid #bbb;border-radius:14px;background:#fff}.agent-result-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.agent-result-heading h3{margin:5px 0 0;font-size:19px}.agent-mode{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase}.copy-button{padding:8px 12px;background:#fff;color:#171716}.agent-model{display:block;margin-top:6px;font-size:11px;color:#666}.agent-result :deep(.agent-markdown){margin-top:22px;color:#292925;font-size:14px;line-height:1.8;overflow-wrap:anywhere}.agent-result :deep(.agent-markdown > *:first-child){margin-top:0}.agent-result :deep(.agent-markdown > *:last-child){margin-bottom:0}.agent-result :deep(.agent-markdown h1){font-size:23px;line-height:1.3}.agent-result :deep(.agent-markdown h2){font-size:19px;line-height:1.4;padding-bottom:9px;border-bottom:1px solid #e5e5df}.agent-result :deep(.agent-markdown h3){font-size:16px;line-height:1.4}.agent-result :deep(.agent-markdown h4){font-size:14px;line-height:1.4}.agent-result :deep(.agent-markdown h1,.agent-markdown h2,.agent-markdown h3,.agent-markdown h4){margin:26px 0 11px;font-weight:800;letter-spacing:-.35px;color:#171716}.agent-result :deep(.agent-markdown p){margin:0 0 13px}.agent-result :deep(.agent-markdown ul,.agent-markdown ol){margin:8px 0 19px;padding-left:25px}.agent-result :deep(.agent-markdown ul){list-style:disc}.agent-result :deep(.agent-markdown ol){list-style:decimal}.agent-result :deep(.agent-markdown li){padding-left:5px;margin:7px 0}.agent-result :deep(.agent-markdown li::marker){font-weight:800;color:#555}.agent-result :deep(.agent-markdown strong){font-weight:800;color:#171716}.agent-result :deep(.agent-markdown hr){height:1px;border:0;background:#e5e5df;margin:22px 0}.agent-result :deep(.agent-markdown blockquote){border-left:3px solid #171716;padding:8px 15px;margin:16px 0;background:#f8f8f5;border-radius:0 8px 8px 0}.agent-result :deep(.agent-markdown code){padding:2px 5px;border-radius:4px;background:#f2f2ef;font-size:.9em}.agent-result :deep(.agent-markdown pre){overflow-x:auto;padding:15px;border:1px solid #e1e1dc;border-radius:9px;background:#f7f7f4;white-space:pre;font-size:12px;line-height:1.6}.agent-result :deep(.agent-markdown pre code){padding:0;background:transparent}.agent-button:focus-visible,.copy-button:focus-visible,.agent-form textarea:focus-visible{outline:2px solid #171716;outline-offset:3px}@media(max-width:760px){.agent-card{padding:20px}.agent-form{grid-template-columns:1fr}.agent-actions{align-items:stretch;flex-direction:column}.agent-button{width:100%}.agent-icon{font-size:30px}.agent-result-heading{align-items:flex-start;flex-direction:column}}
</style>
