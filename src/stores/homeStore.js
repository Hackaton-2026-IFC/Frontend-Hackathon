import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useProjectStore } from '@/stores/project'
import homeApi from '@/api/homeApi'
import notesApi from '@/api/notesApi'
import { lastActiveProject, newestNotes, topUrgentTasks } from '@/utils/homePresentation'

function readableError(err, fallback) {
  if (typeof err?.response?.data?.detail === 'string') return err.response.data.detail
  return err?.message || fallback
}

export const useHomeStore = defineStore('home', () => {
  const projectStore = useProjectStore()
  const tasks = ref([])
  const smartDay = ref(null)
  const recentProject = ref(null)
  const projectNotes = ref([])
  const loadingPriorities = ref(false)
  const loadingDay = ref(false)
  const loadingProject = ref(false)
  const priorityError = ref('')
  const dayError = ref('')
  const projectError = ref('')
  const notesError = ref('')
  const activityIncomplete = ref(false)

  const priorityTasks = computed(() => topUrgentTasks(tasks.value, 4))
  const recommendations = computed(() =>
    Array.isArray(smartDay.value?.recomendacoes) ? smartDay.value.recomendacoes : [],
  )
  const recentNotes = computed(() => newestNotes(projectNotes.value, 3))
  const projectsById = computed(() =>
    Object.fromEntries(projectStore.projects.map((project) => [String(project.id), project])),
  )

  async function loadPriorities() {
    if (loadingPriorities.value) return
    loadingPriorities.value = true
    priorityError.value = ''
    try {
      tasks.value = await homeApi.urgentTasks()
    } catch (err) {
      tasks.value = []
      priorityError.value = readableError(err, 'Não foi possível carregar as tarefas urgentes.')
    } finally {
      loadingPriorities.value = false
    }
  }

  async function loadDay() {
    if (loadingDay.value) return
    loadingDay.value = true
    dayError.value = ''
    try {
      smartDay.value = await homeApi.smartDay(6)
    } catch (err) {
      smartDay.value = null
      dayError.value = readableError(err, 'Não foi possível gerar as recomendações de hoje.')
    } finally {
      loadingDay.value = false
    }
  }

  async function loadRecentProject() {
    if (loadingProject.value) return
    loadingProject.value = true
    projectError.value = ''
    notesError.value = ''
    activityIncomplete.value = false
    projectNotes.value = []
    recentProject.value = null

    try {
      // Reutiliza a paginação e a normalização já existentes na store de projetos.
      const projects = await projectStore.fetchProjects()
      if (!projects.length) return

      const lastActivityByProject = {}
      let nextIndex = 0
      const workers = Array.from({ length: Math.min(4, projects.length) }, async () => {
        while (nextIndex < projects.length) {
          const project = projects[nextIndex++]
          try {
            lastActivityByProject[String(project.id)] = await homeApi.lastActivity(project.id)
          } catch {
            // Em versões sem histórico de atividades, ainda mostramos
            // o projeto mais recente pela data de criação.
            activityIncomplete.value = true
          }
        }
      })
      await Promise.all(workers)

      recentProject.value = lastActiveProject(projects, lastActivityByProject)
      if (!recentProject.value) return
      try {
        projectNotes.value = await notesApi.listAll({
          projeto: recentProject.value.project.id,
          arquivada: false,
        })
      } catch (err) {
        notesError.value = readableError(err, 'Não foi possível carregar as notas deste projeto.')
      }
    } catch (err) {
      projectError.value = readableError(err, 'Não foi possível encontrar seus projetos.')
    } finally {
      loadingProject.value = false
    }
  }

  async function load() {
    await Promise.all([loadPriorities(), loadDay(), loadRecentProject()])
  }

  return {
    priorityTasks,
    recommendations,
    smartDay,
    recentProject,
    recentNotes,
    projectsById,
    loadingPriorities,
    loadingDay,
    loadingProject,
    priorityError,
    dayError,
    projectError,
    notesError,
    activityIncomplete,
    loadPriorities,
    loadDay,
    loadRecentProject,
    load,
  }
})
