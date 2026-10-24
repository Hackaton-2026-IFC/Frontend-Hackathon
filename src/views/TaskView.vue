<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import tasksApi from '@/api/tasksApi'

const route = useRoute()

const taskId = computed(() => route.params.id)

const task = ref(null)
const loading = ref(true)
const error = ref('')
const updatingSteps = ref([])

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

watch(taskId, loadTask)

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

        <!-- CABEÇALHO -->

        <header class="task-page__header">
          <div class="task-page__heading">

            <span class="task-page__eyebrow">
              TAREFA #{{ task.id }}
            </span>

            <h1>{{ task.titulo }}</h1>

            <p>
              Acompanhe os detalhes e o andamento desta tarefa.
            </p>
          </div>

          <span
            class="task-page__status"
            :class="`task-page__status--${task.status}`"
          >
            {{ statuses[task.status] || task.status }}
          </span>
        </header>

        <ToastNotice v-if="error" :message="error" type="error" />

        <!-- INFORMAÇÕES -->

        <section class="task-page__summary">

          <div class="task-page__info">
            <span>Prioridade</span>

            <strong>
              {{
                priorities[task.prioridade] ||
                task.prioridade ||
                'Normal'
              }}
            </strong>
          </div>

          <div class="task-page__info">
            <span>Status</span>

            <strong>
              {{ statuses[task.status] || task.status }}
            </strong>
          </div>

          <div class="task-page__info">
            <span>Prazo</span>

            <strong>
              {{ formatDate(task.data_limite) }}
            </strong>
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
.task-page {
  min-height: 100vh;
  padding: 32px;
  background: #f8f8f8;
  color: #171717;
}

.task-page *,
.task-page *::before,
.task-page *::after {
  box-sizing: border-box;
}

.task-page__container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.task-page__back {
  display: inline-flex;
  align-items: center;
  margin-bottom: 28px;
  color: #555;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.task-page__back:hover {
  color: #111;
}

/* CABEÇALHO */

.task-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 30px;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  background: #fff;
}

.task-page__heading {
  min-width: 0;
}

.task-page__eyebrow {
  display: block;
  margin-bottom: 12px;
  color: #888;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

.task-page__heading h1 {
  margin: 0;
  color: #171717;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.task-page__heading p {
  margin: 12px 0 0;
  color: #777;
  font-size: 13px;
  line-height: 1.6;
}

.task-page__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 9px 14px;
  border-radius: 8px;
  background: #f3f3f3;
  color: #555;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.task-page__status--concluido {
  background: #ecfdf3;
  color: #16803c;
}

.task-page__status--em_andamento {
  background: #eff6ff;
  color: #2563eb;
}

.task-page__status--planejado {
  background: #f3f3f3;
  color: #555;
}

/* RESUMO */

.task-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.task-page__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 22px;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  background: #fff;
}

.task-page__info span {
  color: #888;
  font-size: 12px;
  font-weight: 500;
}

.task-page__info strong {
  color: #171717;
  font-size: 15px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

/* PAINÉIS */

.task-page__panel {
  margin-bottom: 24px;
  padding: 28px;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  background: #fff;
}

.task-page__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.task-page__section-header h2 {
  margin: 0;
  color: #171717;
  font-size: 18px;
  font-weight: 700;
}

.task-page__section-header p {
  margin: 7px 0 0;
  color: #888;
  font-size: 12px;
  line-height: 1.6;
}

/* DESCRIÇÃO */

.task-page__description {
  margin: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* CHECKLIST */

.task-page__step-count {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 8px;
  background: #f4f4f4;
  color: #555;
  font-size: 12px;
  font-weight: 700;
}

.task-page__progress {
  margin-bottom: 24px;
}

.task-page__progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #777;
  font-size: 12px;
}

.task-page__progress-info strong {
  color: #171717;
}

.task-page__progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #ededed;
}

.task-page__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #171717;
  transition: width 0.3s ease;
}

.task-page__steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-page__step {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 54px;
  padding: 14px 16px;
  border: 1px solid #ebebeb;
  border-radius: 10px;
  background: #fff;
  color: #444;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.task-page__step:hover {
  border-color: #d0d0d0;
  background: #fafafa;
}

.task-page__step input {
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  margin: 0;
  accent-color: #171717;
  cursor: pointer;
}

.task-page__step input:disabled {
  cursor: wait;
}

.task-page__step.is-completed span {
  color: #999;
  text-decoration: line-through;
}

.task-page__empty {
  padding: 28px;
  border: 1px dashed #e5e5e5;
  border-radius: 10px;
  background: #fafafa;
  color: #888;
  font-size: 13px;
  text-align: center;
}

/* ESTADOS */

.task-page__state {
  padding: 40px 24px;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  background: #fff;
  color: #666;
  text-align: center;
}

.task-page__state--error {
  border-color: #fecaca;
}

.task-page__state h2 {
  margin: 0 0 12px;
  color: #171717;
  font-size: 18px;
}

.task-page__state p {
  margin-bottom: 20px;
  font-size: 13px;
}

.task-page__state button {
  padding: 11px 20px;
  border: 0;
  border-radius: 9px;
  background: #171717;
  color: #fff;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.task-page__alert {
  padding: 14px 18px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

/* RESPONSIVIDADE */

@media (max-width: 768px) {
  .task-page {
    padding: 20px 16px;
  }

  .task-page__header {
    flex-direction: column;
    padding: 22px;
  }

  .task-page__summary {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .task-page__info {
    padding: 18px;
  }

  .task-page__panel {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .task-page {
    padding: 16px 12px;
  }

  .task-page__header {
    padding: 20px;
  }

  .task-page__heading h1 {
    font-size: 23px;
  }

  .task-page__panel {
    padding: 18px;
  }

  .task-page__section-header {
    align-items: flex-start;
  }

  .task-page__step {
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-page *,
  .task-page *::before,
  .task-page *::after {
    transition: none;
  }
}
</style>