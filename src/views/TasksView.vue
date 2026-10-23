<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { TASK_PRIORITIES, TASK_STATUSES, isOverdue } from '@/api/taskApi'
import TaskBoard from '@/components/tasks/TaskBoard.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import TaskDetails from '@/components/tasks/TaskDetails.vue'
import '@/assets/css/tasks.css'
const store = useTaskStore()
const route = useRoute()
const search = ref('')
const projectFilter = ref('')
const priority = ref('')
const status = ref('')
const responsible = ref('')
const deadline = ref('')
const modal = ref(null)
const selectedId = ref(null)
const initialStatus = ref('planejado')
const notice = ref('')
const routeProject = computed(() =>
  route.params.projectId ? Number(route.params.projectId) : null,
)
const effectiveProject = computed(() => routeProject.value || Number(projectFilter.value) || null)
const scopedTasks = computed(() =>
  store.tasks.filter((task) => !effectiveProject.value || task.projeto === effectiveProject.value),
)
const members = computed(() => {
  const unique = new Map()
  for (const project of store.projects.filter(
    (item) => !effectiveProject.value || item.id === effectiveProject.value,
  )) {
    for (const member of project.participantes || []) unique.set(member.usuario, member)
  }
  return [...unique.values()]
})
const filteredTasks = computed(() =>
  scopedTasks.value.filter(
    (task) =>
      task.titulo
        .toLocaleLowerCase('pt-BR')
        .includes(search.value.trim().toLocaleLowerCase('pt-BR')) &&
      (!priority.value || task.prioridade === priority.value) &&
      (!status.value || task.status === status.value) &&
      (!responsible.value || String(task.responsavel ?? 'none') === responsible.value) &&
      (!deadline.value ||
        (deadline.value === 'overdue' ? isOverdue(task) : task.data_limite === deadline.value)),
  ),
)
const completed = computed(
  () => scopedTasks.value.filter((task) => task.status === 'concluido').length,
)
const progress = computed(() =>
  scopedTasks.value.length ? Math.round((completed.value / scopedTasks.value.length) * 100) : 0,
)
const selectedTask = computed(() => store.tasks.find((task) => task.id === selectedId.value))
const selectedProject = computed(() =>
  store.projects.find((project) => project.id === selectedTask.value?.projeto),
)
onMounted(() => store.load())
watch(routeProject, () => {
  close()
  clearFilters()
})
watch(effectiveProject, () => {
  responsible.value = ''
})
function clearFilters() {
  search.value = ''
  projectFilter.value = ''
  priority.value = ''
  status.value = ''
  responsible.value = ''
  deadline.value = ''
}
function close() {
  modal.value = null
  selectedId.value = null
}
function create(value = 'planejado') {
  selectedId.value = null
  initialStatus.value = value
  modal.value = 'form'
  notice.value = ''
}
function open(id) {
  selectedId.value = id
  modal.value = 'details'
  notice.value = ''
}
function edit(id) {
  selectedId.value = id
  modal.value = 'form'
}
function deleted() {
  close()
  notice.value = 'Tarefa excluída.'
}
function saved() {
  close()
  notice.value = 'Tarefa salva com sucesso.'
}
async function move(id, value) {
  if (store.busy) return
  notice.value = ''
  try {
    await store.update(id, { status: value })
    notice.value = 'Situação atualizada.'
  } catch {
    /* The store exposes the API validation message. */
  }
}
</script>

<template>
  <section class="tasks-page">
    <header class="tasks-heading">
      <div>
        <p class="task-eyebrow">MOMENTUM / ORGANIZAÇÃO</p>
        <h1>
          {{
            routeProject
              ? store.projects.find((project) => project.id === routeProject)?.nome ||
                'Tarefas do projeto'
              : 'Todas as tarefas'
          }}
        </h1>
        <p>Acompanhe cada etapa dos seus projetos.</p>
      </div>
      <button
        class="task-button task-primary"
        :disabled="
          store.loading ||
          store.busy ||
          !store.projects.length ||
          (!!routeProject && !store.projects.some((project) => project.id === routeProject))
        "
        @click="create()"
      >
        + Nova tarefa
      </button>
    </header>
    <div class="task-progress">
      <strong>{{ effectiveProject ? 'Progresso do projeto' : 'Progresso geral' }}</strong
      ><progress :value="progress" max="100" :aria-label="`Progresso: ${progress}%`"></progress
      ><span>{{ completed }} de {{ scopedTasks.length }} concluídas · {{ progress }}%</span>
    </div>
    <div class="task-toolbar">
      <label class="task-search"
        >Pesquisar<input v-model="search" type="search" placeholder="Buscar pelo título..."
      /></label>
      <label v-if="!routeProject"
        >Projeto<select v-model="projectFilter">
          <option value="">Todos</option>
          <option v-for="project in store.projects" :key="project.id" :value="project.id">
            {{ project.nome }}
          </option>
        </select></label
      >
      <label
        >Responsável<select v-model="responsible">
          <option value="">Todos</option>
          <option value="none">Sem responsável</option>
          <option v-for="member in members" :key="member.usuario" :value="String(member.usuario)">
            {{ member.usuario_detalhes?.name || member.usuario_detalhes?.username }}
          </option>
        </select></label
      >
      <label
        >Prioridade<select v-model="priority">
          <option value="">Todas</option>
          <option v-for="(label, value) in TASK_PRIORITIES" :key="value" :value="value">
            {{ label }}
          </option>
        </select></label
      >
      <label
        >Situação<select v-model="status">
          <option value="">Todas</option>
          <option v-for="(label, value) in TASK_STATUSES" :key="value" :value="value">
            {{ label }}
          </option>
        </select></label
      >
      <label
        >Prazo<input
          :value="deadline === 'overdue' ? '' : deadline"
          type="date"
          @input="deadline = $event.target.value"
      /></label>
      <button
        class="task-button"
        :aria-pressed="deadline === 'overdue'"
        @click="deadline = deadline === 'overdue' ? '' : 'overdue'"
      >
        Atrasadas</button
      ><button class="task-button" @click="clearFilters">Limpar</button>
    </div>
    <p v-if="notice" class="task-notice" role="status">{{ notice }}</p>
    <div v-if="store.error" class="task-error" role="alert">
      {{ store.error }}
      <button class="task-button" :disabled="store.busy || store.loading" @click="store.load">
        Recarregar
      </button>
    </div>
    <p v-if="store.loading" class="task-empty" role="status">
      Carregando seus projetos e tarefas...
    </p>
    <p
      v-else-if="routeProject && !store.projects.some((project) => project.id === routeProject)"
      class="task-empty"
    >
      Projeto não encontrado ou sem acesso.
    </p>
    <p v-else-if="!store.projects.length && !store.error" class="task-empty">
      Você ainda não participa de um projeto. Entre em um projeto para criar tarefas.
    </p>
    <template v-else-if="store.projects.length">
      <p class="task-muted" aria-live="polite">{{ filteredTasks.length }} tarefas encontradas</p>
      <p v-if="!filteredTasks.length" class="task-empty">
        {{
          store.tasks.length
            ? 'Nenhuma tarefa corresponde aos filtros.'
            : 'Crie sua primeira tarefa para começar.'
        }}
      </p>
      <TaskBoard
        :tasks="filteredTasks"
        :projects="store.projects"
        :busy="store.busy"
        @open="open"
        @move="move"
        @create="create"
      />
    </template>
    <TaskForm
      v-if="modal === 'form'"
      :task="selectedTask"
      :projects="store.projects"
      :project-id="effectiveProject"
      :initial-status="initialStatus"
      @close="close"
      @saved="saved"
    />
    <TaskDetails
      v-if="modal === 'details' && selectedTask"
      :task="selectedTask"
      :project="selectedProject"
      @close="close"
      @edit="edit"
      @deleted="deleted"
    />
  </section>
</template>
