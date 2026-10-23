<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { taskIsOverdue } from '@/utils/taskPresentation'
import TaskForm from '@/components/tasks/TaskForm.vue'
import TaskOverviewCard from '@/components/tasks/TaskOverviewCard.vue'
import '@/assets/css/tasks.css'

const store = useTaskStore()
const route = useRoute()
const selectedId = ref('')
const formOpen = ref(false)
const notice = ref('')

const routeProject = computed(() =>
  route.params.projectId ? Number(route.params.projectId) : null,
)

const projects = computed(() =>
  routeProject.value
    ? store.projects.filter((project) => Number(project.id) === routeProject.value)
    : store.projects,
)

const availableTasks = computed(() =>
  store.tasks.filter((task) =>
    !routeProject.value || Number(task.projeto) === routeProject.value,
  ),
)

const overdueTasks = computed(() =>
  availableTasks.value
    .filter(taskIsOverdue)
    .slice()
    .sort((a, b) =>
      String(a.prazo_efetivo || a.data_limite || '').localeCompare(
        String(b.prazo_efetivo || b.data_limite || ''),
      ),
    ),
)

const otherTasks = computed(() =>
  availableTasks.value.filter((task) => !taskIsOverdue(task)),
)

const selectedTask = computed(() =>
  availableTasks.value.find((task) => String(task.id) === selectedId.value) || null,
)

onMounted(() => store.load())

watch(routeProject, () => {
  closeForm()
  notice.value = ''
})

function closeForm() {
  formOpen.value = false
  selectedId.value = ''
}

function createTask() {
  selectedId.value = ''
  notice.value = ''
  formOpen.value = true
}

function editTask(id) {
  if (!availableTasks.value.some((task) => String(task.id) === String(id))) return
  selectedId.value = String(id)
  notice.value = ''
  formOpen.value = true
}

function savedTask({ additionalStored, additionalCount }) {
  const result = selectedId.value ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.'
  notice.value = additionalCount && !additionalStored
    ? `${result} Os responsáveis adicionais não puderam ser salvos neste navegador.`
    : result
  closeForm()
}
</script>

<template>
  <section class="tasks-page">
    <div class="tasks-container">
      <RouterLink
        v-if="routeProject"
        class="task-back-link"
        :to="{ name: 'project-details', params: { id: routeProject } }"
      >
        ← Voltar ao projeto
      </RouterLink>

      <header class="tasks-page-heading">
        <div>
          <p class="task-eyebrow">MOMENTUM / ORGANIZAÇÃO</p>
          <h1>{{ routeProject ? 'Tarefas do projeto' : 'Todas as tarefas' }}</h1>
          <p>Veja os prazos, identifique atrasos e acompanhe o que já foi concluído.</p>
        </div>
        <button
          type="button"
          class="task-button task-primary task-create-button"
          :disabled="store.loading || store.busy || !projects.length"
          @click="createTask"
        >
          + Nova tarefa
        </button>
      </header>

      <p v-if="notice" class="task-notice" role="status">{{ notice }}</p>
      <p v-if="store.loading" class="task-state" role="status">Carregando tarefas...</p>

      <template v-else>
        <div v-if="store.error" class="task-error" role="alert">
          {{ store.error }}
          <button type="button" class="task-button" @click="store.load()">Recarregar</button>
        </div>

        <div v-if="routeProject && !projects.length" class="task-state">
          Projeto não encontrado ou sem acesso.
        </div>
        <div v-else-if="!projects.length" class="task-state">
          Você precisa participar de um projeto para criar tarefas.
        </div>

        <template v-else>
          <section class="task-list-section task-list-section--late" aria-labelledby="overdue-heading">
            <div class="task-list-section__heading">
              <div>
                <h2 id="overdue-heading">Tarefas atrasadas</h2>
                <p>Prazo vencido e tarefa ainda não concluída.</p>
              </div>
              <span class="task-count task-count--late">{{ overdueTasks.length }}</span>
            </div>
            <div v-if="overdueTasks.length" class="task-card-grid">
              <TaskOverviewCard
                v-for="task in overdueTasks"
                :key="task.id"
                :task="task"
                :projects="store.projects"
                :additional-assignees-by-task="store.additionalAssigneesByTask"
                :busy="store.busy"
                @edit="editTask"
              />
            </div>
            <p v-else class="task-list-empty">Nenhuma tarefa atrasada.</p>
          </section>

          <section class="task-list-section" aria-labelledby="other-tasks-heading">
            <div class="task-list-section__heading">
              <div>
                <h2 id="other-tasks-heading">Demais tarefas</h2>
                <p>Em andamento, a fazer ou já concluídas.</p>
              </div>
              <span class="task-count">{{ otherTasks.length }}</span>
            </div>
            <div v-if="otherTasks.length" class="task-card-grid">
              <TaskOverviewCard
                v-for="task in otherTasks"
                :key="task.id"
                :task="task"
                :projects="store.projects"
                :additional-assignees-by-task="store.additionalAssigneesByTask"
                :busy="store.busy"
                @edit="editTask"
              />
            </div>
            <p v-else class="task-list-empty">Nenhuma outra tarefa neste projeto.</p>
          </section>
        </template>
      </template>

      <TaskForm
        v-if="formOpen && projects.length"
        :task="selectedTask"
        :projects="projects"
        :project-id="routeProject"
        @close="closeForm"
        @saved="savedTask"
      />
    </div>
  </section>
</template>
