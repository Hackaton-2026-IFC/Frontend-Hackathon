<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { taskIsOverdue } from '@/utils/taskPresentation'
import TaskForm from '@/components/tasks/TaskForm.vue'
import TaskOverviewCard from '@/components/tasks/TaskOverviewCard.vue'
import '@/assets/css/tasks.css'

const store = useTaskStore()
const route = useRoute()
const selectedId = ref('')
const formVersion = ref(0)
const notice = ref('')
const editor = ref(null)

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
  selectedId.value = ''
  notice.value = ''
  formVersion.value += 1
})

function reset() {
  selectedId.value = ''
  notice.value = ''
  formVersion.value += 1
}

async function selectForEdit(id) {
  selectedId.value = String(id)
  notice.value = ''
  await nextTick()
  editor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function saved(task) {
  notice.value = selectedId.value ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.'

  if (!selectedId.value) {
    formVersion.value += 1
  } else if (task) {
    selectedId.value = String(task.id)
    formVersion.value += 1
  }
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
        <p class="task-eyebrow">MOMENTUM / ORGANIZAÇÃO</p>
        <h1>{{ routeProject ? 'Tarefas do projeto' : 'Todas as tarefas' }}</h1>
        <p>Veja os prazos, identifique atrasos e acompanhe o que já foi concluído.</p>
      </header>

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
                :busy="store.busy"
                @edit="selectForEdit"
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
                :busy="store.busy"
                @edit="selectForEdit"
              />
            </div>
            <p v-else class="task-list-empty">Nenhuma outra tarefa neste projeto.</p>
          </section>

          <div ref="editor" class="task-editor-area">
            <div class="task-mode">
              <label for="task-to-edit">Criar ou editar</label>
              <select
                id="task-to-edit"
                v-model="selectedId"
                :disabled="store.busy"
                @change="notice = ''"
              >
                <option value="">Criar nova tarefa</option>
                <option v-for="task in availableTasks" :key="task.id" :value="String(task.id)">
                  Editar — {{ task.titulo }}
                </option>
              </select>
            </div>

            <p v-if="notice" class="task-notice" role="status">{{ notice }}</p>

            <TaskForm
              :key="`${routeProject || 'all'}-${selectedId}-${formVersion}`"
              :task="selectedTask"
              :projects="projects"
              :project-id="routeProject"
              @cancel="reset"
              @saved="saved"
            />
          </div>
        </template>
      </template>
    </div>
  </section>
</template>
