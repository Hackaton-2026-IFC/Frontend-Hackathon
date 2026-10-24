<script setup>
import { computed, ref } from 'vue'
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
            {{ result.modo === 'openai' ? 'IA ativa' : 'Modo local' }}
          </span>
          <h3>Relatório do projeto</h3>
        </div>

        <button type="button" class="copy-button" @click="copyResult">
          <span :class="copied ? 'mdi mdi-check' : 'mdi mdi-content-copy'" aria-hidden="true"></span>
          {{ copied ? 'Copiado' : 'Copiar' }}
        </button>
      </div>

      <p v-if="result.aviso" class="agent-warning">
        {{ result.aviso }}
      </p>

      <pre>{{ result.analise }}</pre>
    </div>
  </section>
</template>

<style scoped>
.agent-card{margin-top:24px;padding:26px;border:1px solid #171716;border-radius:18px;background:#f8f8f5;color:#171716}.agent-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding-bottom:20px;border-bottom:1px solid #d6d6d0}.agent-eyebrow{font-size:10px;font-weight:800;letter-spacing:1.5px}.agent-heading h2{margin:8px 0 8px;font-size:25px;letter-spacing:-.8px}.agent-heading p{max-width:680px;margin:0;color:#555;line-height:1.65;font-size:13px}.agent-icon{flex:0 0 auto;font-size:38px}.agent-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.agent-form label{display:grid;gap:7px;font-size:11px;font-weight:800}.agent-form textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid #c9c9c3;border-radius:10px;background:#fff;color:#171716;font:inherit;font-size:14px;line-height:1.5;resize:vertical}.agent-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:16px}.agent-actions small{color:#666}.agent-button,.copy-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid #171716;border-radius:999px;background:#171716;color:#fff;font:inherit;font-size:12px;font-weight:750;cursor:pointer}.agent-button{min-height:44px;padding:10px 18px}.agent-button:disabled{opacity:.55;cursor:not-allowed}.agent-error,.agent-warning{margin:18px 0 0;padding:11px 13px;border-radius:9px;font-size:12px}.agent-error{border:1px solid #c77;background:#fff0f0;color:#7d1f1f}.agent-warning{border:1px solid #c5a85f;background:#fff8df;color:#654d0a}.agent-result{margin-top:22px;padding:20px;border:1px solid #bbb;border-radius:14px;background:#fff}.agent-result-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.agent-result-heading h3{margin:5px 0 0;font-size:19px}.agent-mode{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase}.copy-button{padding:8px 12px;background:#fff;color:#171716}.agent-result pre{margin:18px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:13px;line-height:1.7}.agent-button:focus-visible,.copy-button:focus-visible,.agent-form textarea:focus-visible{outline:2px solid #171716;outline-offset:3px}@media(max-width:760px){.agent-card{padding:20px}.agent-form{grid-template-columns:1fr}.agent-actions{align-items:stretch;flex-direction:column}.agent-button{width:100%}.agent-icon{font-size:30px}.agent-result-heading{align-items:flex-start;flex-direction:column}}
</style>
