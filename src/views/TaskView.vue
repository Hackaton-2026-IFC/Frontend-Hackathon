<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import tasksApi from '@/api/tasksApi'
import ProjectTaskModal from '@/components/project/ProjectTaskModal.vue'

const route = useRoute()

const taskId = computed(() => route.params.id)

const task = ref(null)
const loading = ref(true)
const error = ref('')
const updatingSteps = ref([])
const showEdit = ref(false)
const savingTask = ref(false)
const editError = ref('')
const weatherLoading = ref(false)
const weather = ref(null)
const weatherError = ref('')

const priorities = {
  muito_baixa: 'Muito baixa',
  baixa: 'Baixa',
  neutra: 'Normal',
  media: 'Média',
  alta: 'Alta',
  muito_alta: 'Muito alta',
}

const statuses = {
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

const steps = computed(() =>
  Array.isArray(task.value?.microtarefas)
    ? task.value.microtarefas
    : [],
)

const completedSteps = computed(() =>
  steps.value.filter(step => step.concluida).length,
)

const progress = computed(() => {
  if (!steps.value.length) return 0

  return Math.round(
    (completedSteps.value / steps.value.length) * 100,
  )
})

const projectId = computed(() => {
  const project = task.value?.projeto

  if (project && typeof project === 'object') {
    return project.id
  }

  return project || null
})

function formatDate(value) {
  if (!value) return 'Sem prazo definido'

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  )

  return match
    ? `${match[3]}/${match[2]}/${match[1]}`
    : String(value)
}

function explain(error) {
  const data = error?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  return error?.message || 'Não foi possível concluir a operação.'
}

async function loadTask() {
  loading.value = true
  error.value = ''

  try {
    // Este método precisa existir no seu tasksApi.js.
    const response = await tasksApi.get(taskId.value)

    task.value = response.data
  } catch (err) {
    console.error('Erro ao carregar tarefa:', err)

    error.value = explain(err)
    task.value = null
  } finally {
    loading.value = false
  }
}

async function saveTask(data) {
  if (savingTask.value) return
  savingTask.value = true
  editError.value = ''
  try {
    await tasksApi.update(taskId.value, {
      titulo: data.titulo,
      descricao: data.descricao,
      prioridade: data.prioridade,
      status: data.status,
      data_limite: data.data_limite || null,
      clima_influencia: data.clima_influencia,
      localizacao: data.localizacao,
    })
    showEdit.value = false
    weather.value = null
    await loadTask()
  } catch (err) { editError.value = explain(err) }
  finally { savingTask.value = false }
}

async function loadWeather() {
  if (!task.value?.clima_influencia || weatherLoading.value) return
  weatherLoading.value = true
  weatherError.value = ''
  try { weather.value = (await tasksApi.weather(taskId.value)).data }
  catch (err) { weatherError.value = explain(err) }
  finally { weatherLoading.value = false }
}

async function toggleStep(step) {
  if (updatingSteps.value.includes(step.id)) return

  updatingSteps.value.push(step.id)
  error.value = ''

  try {
    await tasksApi.updateMicrotask(step.id, {
      concluida: !step.concluida,
    })

    await loadTask()
  } catch (err) {
    error.value = explain(err)
  } finally {
    updatingSteps.value = updatingSteps.value.filter(
      id => id !== step.id,
    )
  }
}

watch(taskId, () => { showEdit.value = false; weather.value = null; loadTask() })

onMounted(loadTask)
</script>

<template>
  <main class="task-page">
    <div class="task-page__container">

      <!-- VOLTAR -->

      <RouterLink
        v-if="projectId"
        :to="`/projects/${projectId}`"
        class="task-page__back"
      >
        ← Voltar ao projeto
      </RouterLink>

      <RouterLink
        v-else
        to="/projects"
        class="task-page__back"
      >
        ← Voltar aos projetos
      </RouterLink>

      <!-- CARREGAMENTO -->

      <div
        v-if="loading"
        class="task-page__state"
      >
        Carregando tarefa...
      </div>

      <!-- ERRO -->

      <div
        v-else-if="error && !task"
        class="task-page__state task-page__state--error"
      >
        <h2>Não foi possível carregar a tarefa</h2>

        <ToastNotice :message="error" type="error" />

        <button @click="loadTask">
          Tentar novamente
        </button>
      </div>

      <!-- CONTEÚDO -->

      <template v-else-if="task">
        <ProjectTaskModal
          v-if="showEdit"
          :key="task.id"
          :task="task"
          :saving="savingTask"
          :error="editError"
          @close="showEdit = false"
          @save="saveTask"
        />

        <!-- CABEÇALHO -->

        <header class="task-page__header">
          <div class="task-page__heading">
            <span class="task-page__eyebrow">DETALHES DA TAREFA · #{{ task.id }}</span>
            <h1>{{ task.titulo }}</h1>
            <p>Organize as informações e acompanhe o progresso.</p>
            <span class="task-page__status" :class="`task-page__status--${task.status}`">
              {{ statuses[task.status] || task.status || 'Sem status' }}
            </span>
          </div>
          <button type="button" class="task-page__edit-button" @click="showEdit = true">Editar tarefa</button>
        </header>

        <ToastNotice v-if="error" :message="error" type="error" />

        <!-- INFORMAÇÕES -->

        <section class="task-page__summary" aria-label="Resumo da tarefa">
          <div class="task-page__info"><span>Prioridade</span><strong>{{ priorities[task.prioridade] || task.prioridade || 'Normal' }}</strong></div>
          <div class="task-page__info"><span>Situação</span><strong>{{ statuses[task.status] || task.status || 'Não informada' }}</strong></div>
          <div class="task-page__info"><span>Prazo</span><strong>{{ formatDate(task.data_limite) }}</strong></div>
        </section>

        <section v-if="task.clima_influencia" class="task-page__panel">
          <div class="task-page__section-header">
            <div>
              <h2><span class="mdi mdi-weather-partly-cloudy" aria-hidden="true"></span> Clima e planejamento</h2>
              <p>Localização: {{ task.localizacao || 'Não informada' }}</p>
            </div>
            <button class="task-page__edit-button" type="button" :disabled="weatherLoading" @click="loadWeather">
              {{ weatherLoading ? 'Consultando...' : 'Consultar previsão' }}
            </button>
          </div>
          <p v-if="weatherError" class="task-page__alert" role="alert">{{ weatherError }}</p>
          <div v-if="weather" class="task-page__description" role="status">
            <template v-if="weather.disponivel">
              <strong>Probabilidade de chuva: {{ weather.probabilidade_chuva_pct ?? 'Indisponível' }}{{ weather.probabilidade_chuva_pct == null ? '' : '%' }}</strong>
              <p>Data: {{ formatDate(weather.data) }} · Máxima: {{ weather.temperatura_maxima_c ?? '—' }} °C · Mínima: {{ weather.temperatura_minima_c ?? '—' }} °C</p>
              <small>Fonte: Open-Meteo. Previsões podem mudar.</small>
            </template>
            <p v-else>{{ weather.motivo || 'Previsão ainda indisponível.' }}</p>
          </div>
        </section>

        <!-- DESCRIÇÃO -->

        <section class="task-page__panel">
          <div class="task-page__section-header">
            <div>
              <h2>Descrição</h2>

              <p>Informações sobre a atividade</p>
            </div>
          </div>

          <p
            v-if="task.descricao"
            class="task-page__description"
          >
            {{ task.descricao }}
          </p>

          <p
            v-else
            class="task-page__empty"
          >
            Esta tarefa ainda não possui descrição.
          </p>
        </section>

        <!-- CHECKLIST -->

        <section class="task-page__panel">

          <div class="task-page__section-header">
            <div>
              <h2>Checklist</h2>

              <p>
                Acompanhe as etapas necessárias para concluir a tarefa.
              </p>
            </div>

            <span class="task-page__step-count">
              {{ completedSteps }}/{{ steps.length }}
            </span>
          </div>

          <!-- PROGRESSO -->

          <div
            v-if="steps.length"
            class="task-page__progress"
          >
            <div class="task-page__progress-info">
              <span>Progresso</span>
              <strong>{{ progress }}%</strong>
            </div>

            <div class="task-page__progress-track">
              <div
                class="task-page__progress-fill"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>

          <!-- ETAPAS -->

          <div
            v-if="steps.length"
            class="task-page__steps"
          >
            <label
              v-for="step in steps"
              :key="step.id"
              class="task-page__step"
              :class="{ 'is-completed': step.concluida }"
            >
              <input
                type="checkbox"
                :checked="step.concluida"
                :disabled="updatingSteps.includes(step.id)"
                @change="toggleStep(step)"
              />

              <span>{{ step.titulo }}</span>
            </label>
          </div>

          <div
            v-else
            class="task-page__empty"
          >
            Nenhuma etapa cadastrada nesta tarefa.
          </div>

        </section>

      </template>

    </div>
  </main>
</template>

<style scoped>
.task-page { padding: 28px 24px 64px; background: #f8f8f8; color: #171717; }
.task-page *, .task-page *::before, .task-page *::after { box-sizing: border-box; }
.task-page__container { width: 100%; max-width: 1100px; margin: auto; }
.task-page__back { display: inline-flex; align-items: center; margin-bottom: 20px; color: #444; text-decoration: none; font-size: 12px; font-weight: 650; }
.task-page__back:hover { color: #000; }
.task-page__header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 16px; padding: 26px 28px; border: 1px solid #e6e6e6; border-radius: 16px; background: white; }
.task-page__heading { min-width: 0; }
.task-page__eyebrow { display: block; margin-bottom: 10px; color: #888; font-size: 10px; font-weight: 750; letter-spacing: 1.1px; }
.task-page__heading h1 { margin: 0; font-size: clamp(23px, 3vw, 30px); font-weight: 750; line-height: 1.25; overflow-wrap: anywhere; }
.task-page__heading p { margin: 8px 0 14px; color: #888; font-size: 12px; }
.task-page__status { display: inline-flex; align-items: center; padding: 6px 11px; border-radius: 999px; background: #f3f3f3; color: #555; font-size: 11px; font-weight: 650; }
.task-page__status--concluido { background: #eaf8ee; color: #16803c; }
.task-page__status--em_andamento { background: #eaf2ff; color: #2563eb; }
.task-page__summary { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-bottom: 16px; }
.task-page__info { min-width: 0; display: flex; flex-direction: column; gap: 7px; padding: 16px 20px; border: 1px solid #e6e6e6; border-radius: 12px; background: #fff; }
.task-page__info span { font-size: 11px; color: #888; }
.task-page__info strong { font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
.task-page__panel { margin-bottom: 16px; padding: 24px 28px; border: 1px solid #e6e6e6; border-radius: 14px; background: white; }
.task-page__section-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.task-page__section-header h2 { margin: 0; font-size: 16px; font-weight: 700; }
.task-page__section-header p { margin: 5px 0 0; color: #999; font-size: 12px; }
.task-page__description { margin: 0; color: #555; font-size: 13px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
.task-page__step-count { padding: 6px 10px; border-radius: 8px; background: #f5f5f5; color: #555; font-size: 12px; font-weight: 700; }
.task-page__progress { margin-bottom: 20px; }
.task-page__progress-info { display: flex; justify-content: space-between; margin-bottom: 9px; color: #888; font-size: 12px; }
.task-page__progress-info strong { color: #111; }
.task-page__progress-track { height: 6px; overflow: hidden; border-radius: 999px; background: #eee; }
.task-page__progress-fill { height: 100%; border-radius: inherit; background: #111; transition: width .25s; }
.task-page__steps { display: grid; gap: 8px; }
.task-page__step { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 12px 14px; border: 1px solid #eee; border-radius: 10px; font-size: 13px; cursor: pointer; }
.task-page__step:hover { background: #fafafa; }
.task-page__step input { width: 17px; height: 17px; accent-color: #111; }
.task-page__step.is-completed span { color: #999; text-decoration: line-through; }
.task-page__empty { padding: 22px; border: 1px dashed #e7e7e7; border-radius: 10px; color: #999; font-size: 12px; text-align: center; }
.task-page__state { padding: 35px 20px; border: 1px solid #eee; border-radius: 14px; background: white; text-align: center; }
.task-page__state--error { border-color: #fecaca; }
.task-page__state button { padding: 10px 16px; border: 0; border-radius: 9px; background: #111; color: white; cursor: pointer; }
.task-page__alert { padding: 12px; border-radius: 9px; background: #fff0f0; color: #b91c1c; font-size: 12px; }
.task-page__edit-button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 38px; padding: 9px 16px; border: 1px solid #111; border-radius: 9px; background: #111; color: white; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; }
.task-page__edit-button:hover { background: #333; }
.task-page__edit-button:disabled { opacity: .5; cursor: wait; }
@media(max-width: 640px) {
  .task-page { padding: 16px 12px 85px; }
  .task-page__header { flex-direction: column; align-items: stretch; padding: 20px; }
  .task-page__header .task-page__edit-button { width: 100%; }
  .task-page__summary { grid-template-columns: 1fr; gap: 8px; }
  .task-page__info { padding: 12px 16px; }
  .task-page__panel { padding: 20px 16px; }
  .task-page__section-header { align-items: flex-start; }
}
@media(prefers-reduced-motion:reduce) { .task-page * { transition: none !important; } }
</style>
