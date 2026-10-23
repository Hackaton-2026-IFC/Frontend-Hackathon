<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import TaskForm from '@/components/tasks/TaskForm.vue'
import '@/assets/css/tasks.css'

const store = useTaskStore()
const route = useRoute()
const selectedId = ref('')
const formVersion = ref(0)
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

function saved(task) {
  notice.value = selectedId.value ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.'

  if (!selectedId.value) {
    // Monta um formulário vazio depois de criar, sem recarregar os dados.
    formVersion.value += 1
  } else if (task) {
    selectedId.value = String(task.id)
    formVersion.value += 1
  }
}
</script>

<template>
  <main class="tasks-page">
    <div class="tasks-container">
      <RouterLink
        v-if="routeProject"
        class="task-back-link"
        :to="{ name: 'project-details', params: { id: routeProject } }"
      >
        ← Voltar ao projeto
      </RouterLink>

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
          <div class="task-mode">
            <label for="task-to-edit">Criar ou editar</label>
            <select id="task-to-edit" v-model="selectedId" :disabled="store.busy" @change="notice = ''">
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
        </template>
      </template>
    </div>
  </main>
</template>
