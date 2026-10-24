<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import projectsApi from '@/api/projectsApi'
import projectApi from '@/api/projectApi'
import tasksApi from '@/api/tasksApi'
import { useToastStore } from '@/stores/toastStore'

import ProjectEditModal from '@/components/project/ProjectEditModal.vue'
import ProjectHeader from '@/components/project/ProjectHeader.vue'
import ProjectProgress from '@/components/project/ProjectProgress.vue'
import ProjectMembers from '@/components/project/ProjectMembers.vue'
import ProjectDeleteDialog from '@/components/project/ProjectDeleteDialog.vue'
import ProjectTaskModal from '@/components/project/ProjectTaskModal.vue'
import ProjectTaskCard from '@/components/project/ProjectTaskCard.vue'
import ProjectResources from '@/components/project/ProjectResources.vue'

import '@/assets/css/project.css'
import '@/assets/css/project-tasks.css'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const id = computed(() => route.params.id)

// Estados

const project = ref(null)
const board = ref(null)
const resources = ref([])

const error = ref('')
const editError = ref('')
const deleteError = ref('')
const taskError = ref('')
const resourceError = ref('')

const loading = ref(false)
const saving = ref(false)
const savingProject = ref(false)
const deletingProject = ref(false)
const savingResource = ref(false)

const showEditModal = ref(false)
const showDeleteDialog = ref(false)
const showTaskForm = ref(false)

const resourceSuccessCount = ref(0)

// Colunas do kanban

const columns = [
  { key: 'planejado', label: 'Planejado' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido', label: 'Concluído' },
]

const priorities = {
  muito_baixa: 'Muito baixa',
  baixa: 'Baixa',
  neutra: 'Normal',
  media: 'Média',
  alta: 'Alta',
  muito_alta: 'Muito alta',
}

// Lista de tarefas

const allTasks = computed(() => {
  const data = board.value

  if (!data) return []

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data.results)) {
    return data.results
  }

  const kanban = data.kanban || data

  return columns.flatMap(column => {
    const tasks = kanban?.[column.key]

    return Array.isArray(tasks) ? tasks : []
  })
})

// Estatísticas

const totalTasks = computed(() => allTasks.value.length)

const completedTasks = computed(() =>
  allTasks.value.filter(task => task.status === 'concluido').length,
)

const inProgressTasks = computed(() =>
  allTasks.value.filter(task => task.status === 'em_andamento').length,
)

const plannedTasks = computed(() =>
  allTasks.value.filter(task => task.status === 'planejado').length,
)

const counts = computed(() =>
  Object.fromEntries(
    columns.map(column => [
      column.key,
      allTasks.value.filter(task => task.status === column.key).length,
    ]),
  ),
)

// Filtros das tarefas

const activeTab = ref('all')
const search = ref('')
const responsible = ref('')
const priority = ref('')
const deadline = ref('')
const overdueOnly = ref(false)
const sort = ref('default')

// Responsáveis

function getResponsibleId(task) {
  const raw = task.responsavel

  return typeof raw === 'object'
    ? raw?.id
    : raw
}

const members = computed(() => {
  const result = new Map()

  const projectMembers =
    project.value?.participantes ||
    project.value?.membros ||
    []

  for (const member of projectMembers) {
    const raw =
      member.usuario ??
      member.user ??
      member

    const user =
      member.usuario_detalhes ||
      member.user_details ||
      (typeof raw === 'object' ? raw : {})

    const userId =
      user.id ??
      (typeof raw !== 'object' ? raw : null)

    if (userId == null) continue

    result.set(String(userId), {
      id: String(userId),
      name:
        user.name ||
        user.nome ||
        user.username ||
        `Usuário #${userId}`,
    })
  }

  for (const task of allTasks.value) {
    const userId = getResponsibleId(task)

    if (
      userId == null ||
      result.has(String(userId))
    ) {
      continue
    }

    const raw = task.responsavel

    const user =
      task.responsavel_detalhes ||
      (typeof raw === 'object' ? raw : {})

    result.set(String(userId), {
      id: String(userId),
      name:
        user.name ||
        user.nome ||
        user.username ||
        `Usuário #${userId}`,
    })
  }

  return [...result.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  )
})

// Datas

function dateString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function daysFromToday(days) {
  const date = new Date()

  date.setDate(date.getDate() + days)

  return dateString(date)
}

function isOverdue(task) {
  return (
    !!task.data_limite &&
    String(task.data_limite).slice(0, 10) < dateString() &&
    task.status !== 'concluido'
  )
}

function matchesDeadline(task) {
  const date = String(task.data_limite || '').slice(0, 10)

  if (!deadline.value) return true

  if (deadline.value === 'none') {
    return !date
  }

  if (deadline.value === 'overdue') {
    return isOverdue(task)
  }

  if (!date) return false

  if (deadline.value === 'today') {
    return date === dateString()
  }

  if (deadline.value === 'week') {
    return date >= dateString() && date <= daysFromToday(7)
  }

  if (deadline.value === 'month') {
    return date >= dateString() && date <= daysFromToday(30)
  }

  return true
}

// Filtragem e ordenação

const filteredTasks = computed(() => {
  const query = search.value
    .trim()
    .toLocaleLowerCase('pt-BR')

  const items = allTasks.value.filter(task => {
    const userId = getResponsibleId(task)

    const matchesStatus =
      activeTab.value === 'all' ||
      task.status === activeTab.value

    const matchesSearch =
      !query ||
      String(task.titulo || '')
        .toLocaleLowerCase('pt-BR')
        .includes(query)

    const matchesResponsible =
      !responsible.value ||
      (
        responsible.value === 'none'
          ? userId == null
          : String(userId) === responsible.value
      )

    const matchesPriority =
      !priority.value ||
      task.prioridade === priority.value

    const matchesOverdue =
      !overdueOnly.value ||
      isOverdue(task)

    return (
      matchesStatus &&
      matchesSearch &&
      matchesResponsible &&
      matchesPriority &&
      matchesDeadline(task) &&
      matchesOverdue
    )
  })

  const weight = {
    muito_alta: 6,
    alta: 5,
    media: 4,
    neutra: 3,
    baixa: 2,
    muito_baixa: 1,
  }

  if (sort.value === 'az') {
    items.sort((a, b) =>
      String(a.titulo || '').localeCompare(
        String(b.titulo || ''),
        'pt-BR',
      ),
    )
  }

  if (sort.value === 'za') {
    items.sort((a, b) =>
      String(b.titulo || '').localeCompare(
        String(a.titulo || ''),
        'pt-BR',
      ),
    )
  }

  if (sort.value === 'priority') {
    items.sort(
      (a, b) =>
        (weight[b.prioridade] || 0) -
        (weight[a.prioridade] || 0),
    )
  }

  return items
})

// Contadores dos filtros

const activeFiltersCount = computed(() =>
  [
    activeTab.value !== 'all',
    search.value.trim(),
    responsible.value,
    priority.value,
    deadline.value,
    overdueOnly.value,
    sort.value !== 'default',
  ].filter(Boolean).length,
)

const overdueCount = computed(() =>
  allTasks.value.filter(isOverdue).length,
)

// Limpar filtros

function clearFilters() {
  activeTab.value = 'all'
  search.value = ''
  responsible.value = ''
  priority.value = ''
  deadline.value = ''
  overdueOnly.value = false
  sort.value = 'default'
}

// Tratamento de erros

function explain(e) {
  const data = e?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) =>
        `${key}: ${
          Array.isArray(value)
            ? value.join(', ')
            : value
        }`,
      )
      .join(' • ')
  }

  return e?.message || 'Ocorreu um erro.'
}

// Carregamento do projeto

async function load() {
  loading.value = true
  error.value = ''

  const currentId = id.value

  const [projectResult, kanbanResult, resourcesResult] =
    await Promise.allSettled([
      projectsApi.get(currentId),
      projectsApi.kanban(currentId),
      projectsApi.resources(currentId),
    ])

  if (String(currentId) !== String(id.value)) {
    loading.value = false
    return
  }

  const errors = []

  if (projectResult.status === 'fulfilled') {
    project.value = projectResult.value.data
  } else {
    console.error(
      'Erro ao carregar projeto:',
      projectResult.reason,
    )

    errors.push('projeto')
  }

  if (kanbanResult.status === 'fulfilled') {
    board.value = kanbanResult.value.data
  } else {
    console.error(
      'Erro ao carregar tarefas:',
      kanbanResult.reason,
    )

    errors.push('tarefas')
  }

  if (resourcesResult.status === 'fulfilled') {
    const data = resourcesResult.value.data

    resources.value = Array.isArray(data)
      ? data
      : (data?.results ?? [])
  } else {
    console.error(
      'Erro ao carregar materiais:',
      resourcesResult.reason,
    )

    errors.push('materiais de apoio')
  }

  if (errors.length) {
    error.value =
      `Não foi possível carregar: ${errors.join(', ')}.`
  }

  loading.value = false
}

// Editar projeto

function openEditModal() {
  editError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  if (savingProject.value) return

  showEditModal.value = false
  editError.value = ''
}

async function saveProject(dados) {
  if (savingProject.value) return

  savingProject.value = true
  editError.value = ''
  error.value = ''

  try {
    const response = await projectsApi.update(
      id.value,
      dados,
    )

    if (response.data) {
      project.value = {
        ...project.value,
        ...response.data,
      }
    }

    showEditModal.value = false

    await load()

    if (!error.value) {
      toast.success('Projeto atualizado com sucesso.')
    }
  } catch (e) {
    editError.value = explain(e)
  } finally {
    savingProject.value = false
  }
}

// Excluir projeto

function openDeleteDialog() {
  deleteError.value = ''
  showDeleteDialog.value = true
}

function closeDeleteDialog() {
  if (deletingProject.value) return

  showDeleteDialog.value = false
  deleteError.value = ''
}

async function deleteProject(projectId) {
  if (
    deletingProject.value ||
    String(projectId) !== String(id.value)
  ) {
    return
  }

  deletingProject.value = true
  deleteError.value = ''

  try {
    await projectApi.excluir(projectId)

    showDeleteDialog.value = false

    toast.success('Projeto excluído com sucesso.')
    await router.push('/projects')
  } catch (e) {
    deleteError.value = explain(e)
  } finally {
    deletingProject.value = false
  }
}

// Modal de tarefas

function openTaskModal() {
  taskError.value = ''
  showTaskForm.value = true
}

function closeTaskModal() {
  if (saving.value) return

  showTaskForm.value = false
  taskError.value = ''
}

// Criar tarefa

async function addTask(dados) {
  if (saving.value) return

  saving.value = true
  taskError.value = ''
  error.value = ''

  try {
    await tasksApi.create({
      projeto: Number(id.value),
      titulo: dados.titulo.trim(),
      descricao: dados.descricao,
      prioridade: dados.prioridade,
      status: dados.status,
      ...(dados.data_limite
        ? { data_limite: dados.data_limite }
        : {}),
    })

    await load()

    if (error.value) {
      taskError.value = error.value
      return
    }

    showTaskForm.value = false
    toast.success('Tarefa criada com sucesso.')
  } catch (e) {
    taskError.value = explain(e)
  } finally {
    saving.value = false
  }
}


// Materiais de apoio

async function addResource(dados) {
  if (savingResource.value) return

  savingResource.value = true
  resourceError.value = ''
  error.value = ''

  try {
    await projectsApi.addResource(id.value, {
      titulo: dados.titulo.trim(),
      url: dados.url.trim(),
      tipo: dados.tipo || 'link',
    })

    const response = await projectsApi.resources(id.value)

    resources.value = Array.isArray(response.data)
      ? response.data
      : (response.data?.results ?? [])

    resourceSuccessCount.value += 1

    toast.success('Material adicionado com sucesso.')
  } catch (e) {
    resourceError.value = explain(e)
  } finally {
    savingResource.value = false
  }
}

// Convites

async function onInviteSent() {
  await load()
}

// Alteração de rota

watch(id, (newId, oldId) => {
  if (newId !== oldId) {
    showEditModal.value = false
    showDeleteDialog.value = false
    showTaskForm.value = false

    editError.value = ''
    deleteError.value = ''
    taskError.value = ''
    resourceError.value = ''

    project.value = null
    board.value = null
    resources.value = []

    clearFilters()
    load()
  }
})

onMounted(load)
</script>
<template>
  <main class="workspace">
    <RouterLink
      to="/projects"
      class="back-link"
    >
      ← Voltar aos projetos
    </RouterLink>

    <p
      v-if="loading && !project"
      role="status"
    >
      Carregando projeto...
    </p>

    <p
      v-if="error"
      class="message-error"
      role="alert"
    >
      {{ error }}
    </p>


    <template v-if="project">
      <ProjectEditModal
        v-if="showEditModal"
        :project="project"
        mode="edit"
        :saving="savingProject"
        :error="editError"
        @close="closeEditModal"
        @save="saveProject"
      />

      <ProjectDeleteDialog
        v-if="showDeleteDialog"
        :project="project"
        :deleting="deletingProject"
        :error="deleteError"
        @close="closeDeleteDialog"
        @confirm="deleteProject"
      />

      <ProjectTaskModal
        v-if="showTaskForm"
        :saving="saving"
        :error="taskError"
        @close="closeTaskModal"
        @save="addTask"
      />

      <ProjectHeader
        :project="project"
        @edit="openEditModal"
        @delete="openDeleteDialog"
      />

      <ProjectProgress
        :project="project"
        :total="totalTasks"
        :completed="completedTasks"
        :in-progress="inProgressTasks"
        :planned="plannedTasks"
      />

      <ProjectMembers
        :project="project"
        @invite-sent="onInviteSent"
      />

      <section class="panel tasks-section project-tasks">
        <div class="section-heading">
          <div>
            <h2>Tarefas</h2>

            <p class="muted">
              Organize e acompanhe as atividades
            </p>
          </div>

          <button
            type="button"
            @click="openTaskModal"
          >
            + Nova tarefa
          </button>
        </div>

        <!-- Abas de status -->

        <div
          class="project-tasks__tabs"
          role="group"
          aria-label="Situação das tarefas"
        >
          <button
            type="button"
            :class="{ active: activeTab === 'all' }"
            :aria-pressed="activeTab === 'all'"
            @click="activeTab = 'all'"
          >
            Todas
            <span>{{ allTasks.length }}</span>
          </button>

          <button
            v-for="col in columns"
            :key="col.key"
            type="button"
            :class="{ active: activeTab === col.key }"
            :aria-pressed="activeTab === col.key"
            @click="activeTab = col.key"
          >
            {{ col.label }}
            <span>{{ counts[col.key] }}</span>
          </button>
        </div>

        <!-- Filtros -->

        <div class="project-tasks__filters">
          <label class="project-tasks__search">
            Pesquisar por nome

            <input
              v-model="search"
              type="search"
              placeholder="Nome da tarefa..."
            />
          </label>

          <label>
            Responsável

            <select v-model="responsible">
              <option value="">
                Todos
              </option>

              <option value="none">
                Sem responsável
              </option>

              <option
                v-for="member in members"
                :key="member.id"
                :value="member.id"
              >
                {{ member.name }}
              </option>
            </select>
          </label>

          <label>
            Prioridade

            <select v-model="priority">
              <option value="">
                Todas
              </option>

              <option
                v-for="(label, value) in priorities"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </label>

          <label>
            Situação

            <select v-model="activeTab">
              <option value="all">
                Todas
              </option>

              <option
                v-for="col in columns"
                :key="col.key"
                :value="col.key"
              >
                {{ col.label }}
              </option>
            </select>
          </label>

          <label>
            Prazo

            <select v-model="deadline">
              <option value="">
                Todos
              </option>

              <option value="today">
                Vencem hoje
              </option>

              <option value="week">
                Próximos 7 dias
              </option>

              <option value="month">
                Próximos 30 dias
              </option>

              <option value="overdue">
                Atrasadas
              </option>

              <option value="none">
                Sem prazo
              </option>
            </select>
          </label>

          <label>
            Ordenar

            <select v-model="sort">
              <option value="default">
                Ordem padrão
              </option>

              <option value="az">
                Nome: A a Z
              </option>

              <option value="za">
                Nome: Z a A
              </option>

              <option value="priority">
                Maior prioridade
              </option>
            </select>
          </label>
        </div>

        <!-- Filtros adicionais -->

        <div class="project-tasks__bottom">
          <label class="project-tasks__overdue">
            <input
              v-model="overdueOnly"
              type="checkbox"
            />

            Somente atrasadas

            <span>{{ overdueCount }}</span>
          </label>

          <button
            type="button"
            class="project-tasks__clear"
            :disabled="!activeFiltersCount"
            @click="clearFilters"
          >
            Limpar filtros

            <span v-if="activeFiltersCount">
              ({{ activeFiltersCount }})
            </span>
          </button>
        </div>

        <!-- Contador -->

        <p
          class="project-tasks__count"
          aria-live="polite"
        >
          {{ filteredTasks.length }}

          {{
            filteredTasks.length === 1
              ? 'tarefa encontrada'
              : 'tarefas encontradas'
          }}
        </p>

        <!-- Lista de tarefas -->

<div class="project-tasks__list momentum-tasks-grid">
  <ProjectTaskCard
    v-for="task in filteredTasks"
    :key="task.id"
    :task="task"
  />

  <p
    v-if="!filteredTasks.length"
    class="project-tasks__empty"
  >
    Nenhuma tarefa corresponde aos filtros selecionados.
  </p>
</div>
      </section>

      <!-- Materiais de apoio -->

      <ProjectResources
        :resources="resources"
        :saving="savingResource"
        :error="resourceError"
        :success-count="resourceSuccessCount"
        @add-resource="addResource"
      />
    </template>
  </main>
</template>