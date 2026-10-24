<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/api/taskApi'
import { automaticPriority, taskIsOverdue, taskDueDate } from '@/utils/taskPresentation'
import TaskForm from '@/components/tasks/TaskForm.vue'
import TaskWorkspace from '@/components/tasks/TaskWorkspace.vue'
import '@/assets/css/tasks.css'

const store = useTaskStore()
const route = useRoute()
const router = useRouter()
const formOpen = ref(false)
const editingId = ref('')
const notice = ref('')
const searchText = ref('')
const statusFilter = ref('todas')
const projectFilter = ref('todos')

const routeProject = computed(() =>
  route.params.projectId ? Number(route.params.projectId) : null,
)

const availableProjects = computed(() =>
  routeProject.value
    ? store.projects.filter((project) => Number(project.id) === routeProject.value)
    : store.projects,
)

const availableTasks = computed(() =>
  store.tasks.filter((task) =>
    (!routeProject.value || Number(task.projeto) === routeProject.value) &&
    (routeProject.value || projectFilter.value === 'todos' ||
      String(task.projeto) === projectFilter.value),
  ),
)

const filteredTasks = computed(() => {
  const query = searchText.value.trim().toLocaleLowerCase('pt-BR')
  return availableTasks.value
    .filter((task) => !query || String(task.titulo).toLocaleLowerCase('pt-BR').includes(query))
    .filter((task) => {
      if (statusFilter.value === 'atrasadas') return taskIsOverdue(task)
      if (statusFilter.value === 'pendentes') return task.status !== 'concluido'
      if (statusFilter.value === 'concluidas') return task.status === 'concluido'
      return true
    })
    .slice()
    .sort((a, b) =>
      Number(taskIsOverdue(b)) - Number(taskIsOverdue(a)) ||
      String(a.prazo_efetivo || a.data_limite || '9999').localeCompare(
        String(b.prazo_efetivo || b.data_limite || '9999'),
      ) || Number(b.id) - Number(a.id),
    )
})

const requestedTaskId = computed(() => String(route.params.id || route.query.task || ''))
const mobileDetailActive = computed(() => Boolean(requestedTaskId.value))

const selectedTask = computed(() => {
  if (requestedTaskId.value) {
    // Um link direto nunca deve abrir outra tarefa por engano.
    return filteredTasks.value.find((task) => String(task.id) === requestedTaskId.value) || null
  }
  return filteredTasks.value[0] || null
})

const backProjectId = computed(() =>
  routeProject.value || (route.name === 'task-view' ? selectedTask.value?.projeto : null),
)

const editingTask = computed(() =>
  store.tasks.find((task) => String(task.id) === editingId.value) || null,
)

onMounted(() => store.load())

watch(routeProject, () => {
  closeForm()
  notice.value = ''
  projectFilter.value = 'todos'
  statusFilter.value = 'todas'
  searchText.value = ''
})

function selectTask(id) {
  notice.value = ''
  if (route.name === 'task-view') {
    // Links /tasks/:id dos cards de projeto preservam sua URL.
    return router.replace({ name: 'task-view', params: { id: String(id) }, query: route.query })
  }
  return router.replace({ query: { ...route.query, task: String(id) } })
}

function backToTaskList() {
  if (route.name === 'task-view') {
    const projectId = selectedTask.value?.projeto
    return router.push(projectId
      ? { name: 'project-tasks', params: { projectId } }
      : { name: 'tasks' })
  }
  const query = { ...route.query }
  delete query.task
  return router.push({ query })
}

function closeForm() {
  formOpen.value = false
  editingId.value = ''
}

function createTask() {
  editingId.value = ''
  notice.value = ''
  formOpen.value = true
}

function editTask(id) {
  if (!store.tasks.some((task) => String(task.id) === String(id))) return
  editingId.value = String(id)
  notice.value = ''
  formOpen.value = true
}

function savedTask({ task, additionalStored, additionalCount }) {
  const message = editingId.value ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.'
  notice.value = additionalCount && !additionalStored
    ? `${message} Os responsáveis adicionais não puderam ser salvos neste navegador.`
    : message

  searchText.value = ''
  statusFilter.value = 'todas'
  if (!routeProject.value) projectFilter.value = 'todos'
  closeForm()
  if (task?.id) selectTask(task.id)
  // selectTask clears notices; keep the success message after updating the selection.
  notice.value = additionalCount && !additionalStored
    ? `${message} Os responsáveis adicionais não puderam ser salvos neste navegador.`
    : message
}

function removedTask() {
  notice.value = 'Tarefa excluída com sucesso.'
  if (route.name === 'task-view') {
    router.replace({ name: 'tasks' })
    return
  }
  const nextQuery = { ...route.query }
  delete nextQuery.task
  router.replace({ query: nextQuery })
}
</script>

<template>
  <section class="tasks-page">
    <div class="tasks-container">
      <RouterLink
        v-if="backProjectId"
        class="task-back-link"
        :to="{ name: 'project-details', params: { id: backProjectId } }"
      >← Voltar ao projeto</RouterLink>

      <header class="tasks-page-heading">
        <div>
          <p class="task-eyebrow">MOMENTUM / ORGANIZAÇÃO</p>
          <h1>{{ routeProject ? 'Tarefas do projeto' : 'Painel de tarefas' }}</h1>
          <p>Detalhes, responsáveis e evolução de cada atividade em um só lugar.</p>
        </div>
        <button
          type="button"
          class="task-button task-primary task-create-button"
          :disabled="store.loading || store.busy || !availableProjects.length"
          @click="createTask"
        >+ Nova tarefa</button>
      </header>

      <ToastNotice v-if="notice" :message="notice" type="success" />
      <p v-if="store.loading" class="task-state" role="status">Carregando tarefas...</p>

      <template v-else>
        <template v-if="store.error">
        <ToastNotice :message="store.error" type="error" />
<button type="button" class="task-button" :disabled="store.busy" @click="store.load()">Recarregar</button>
      </template>

        <div v-if="routeProject && !availableProjects.length" class="task-state">
          Projeto não encontrado ou sem acesso.
        </div>
        <div v-else-if="!store.projects.length" class="task-state">
          Você precisa participar de um projeto para acompanhar e criar tarefas.
        </div>

        <template v-else>
          <div v-if="mobileDetailActive" class="task-mobile-back">
            <button type="button" class="task-mobile-back__button" @click="backToTaskList">
              ← Voltar às tarefas
            </button>
          </div>

          <div class="task-dashboard" :class="{ 'task-dashboard--mobile-detail': mobileDetailActive }">
            <aside v-if="!mobileDetailActive" class="task-browser" aria-label="Lista de tarefas">
              <div class="task-browser__heading">
                <h2>Tarefas</h2>
                <span>{{ filteredTasks.length }}</span>
              </div>

              <div class="task-browser__filters">
                <label for="tasks-search">Pesquisar tarefa</label>
                <input
                  id="tasks-search"
                  v-model="searchText"
                  type="search"
                  placeholder="Buscar pelo título..."
                />

                <label v-if="!routeProject" for="tasks-project">Projeto</label>
                <select v-if="!routeProject" id="tasks-project" v-model="projectFilter">
                  <option value="todos">Todos os projetos</option>
                  <option v-for="project in store.projects" :key="project.id" :value="String(project.id)">
                    {{ project.nome }}
                  </option>
                </select>

                <label for="tasks-status">Exibir</label>
                <select id="tasks-status" v-model="statusFilter">
                  <option value="todas">Todas as tarefas</option>
                  <option value="atrasadas">Atrasadas</option>
                  <option value="pendentes">Em aberto</option>
                  <option value="concluidas">Concluídas</option>
                </select>
              </div>

              <ul v-if="filteredTasks.length" class="task-browser__list">
                <li v-for="task in filteredTasks" :key="task.id">
                  <button
                    type="button"
                    class="task-browser__item"
                    :class="{
                      'task-browser__item--selected': requestedTaskId && selectedTask?.id === task.id,
                      'task-browser__item--late': taskIsOverdue(task),
                    }"
                    :aria-current="selectedTask?.id === task.id ? 'true' : undefined"
                    @click="selectTask(task.id)"
                  >
                    <span class="task-browser__item-heading">
                      <span class="task-browser__item-name">{{ task.titulo }}</span>
                      <span
                        class="task-browser__priority"
                        :class="{ 'task-browser__priority--high': ['alta', 'muito_alta'].includes(automaticPriority(task)) }"
                      >
                        {{ TASK_PRIORITIES[automaticPriority(task)] || 'Concluída' }}
                      </span>
                    </span>
                    <span class="task-browser__item-meta">
                      <span class="task-browser__status" :class="{ 'task-browser__status--late': taskIsOverdue(task),
                          'task-browser__status--active': task.status === 'em_andamento' && !taskIsOverdue(task),
                          'task-browser__status--done': task.status === 'concluido' }">
                        <span class="task-browser__status-dot" aria-hidden="true"></span>
                        {{ taskIsOverdue(task) ? 'Atrasada' : TASK_STATUSES[task.status] || 'A fazer' }}
                      </span>
                      <span class="task-browser__deadline">◷ {{ taskDueDate(task) }}</span>
                      <span v-if="task.microtarefas?.length" class="task-browser__steps">
                        ✓ {{ task.microtarefas.filter((step) => step.concluida).length }}/{{ task.microtarefas.length }} etapas
                      </span>
                    </span>
                  </button>
                </li>
              </ul>
              <p v-else class="workspace-empty">Nenhuma tarefa corresponde aos filtros.</p>
            </aside>

            <TaskWorkspace
              v-if="mobileDetailActive && selectedTask"
              :key="selectedTask.id"
              :task="selectedTask"
              :tasks="store.tasks"
              :projects="store.projects"
              :additional-assignees-by-task="store.additionalAssigneesByTask"
              @edit="editTask"
              @removed="removedTask"
            />
            <div v-else-if="mobileDetailActive" class="task-dashboard__empty">
              <h2>{{ requestedTaskId ? 'Tarefa não encontrada' : 'Nenhuma tarefa selecionada' }}</h2>
              <p>{{ requestedTaskId
                ? 'Esta tarefa não está disponível ou não corresponde aos filtros.'
                : 'Altere os filtros ou crie uma tarefa para começar a acompanhar o roadmap.' }}</p>
              <button class="task-button task-primary" type="button" @click="createTask">+ Nova tarefa</button>
            </div>
          </div>
        </template>
      </template>

      <TaskForm
        v-if="formOpen && availableProjects.length"
        :task="editingTask"
        :projects="availableProjects"
        :project-id="routeProject"
        @close="closeForm"
        @saved="savedTask"
      />
    </div>
  </section>
</template>
