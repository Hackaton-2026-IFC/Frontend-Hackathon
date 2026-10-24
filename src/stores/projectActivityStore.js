import { ref } from 'vue'
import { defineStore } from 'pinia'
import projectsApi from '@/api/projectsApi'

const PAGE_SIZE = 8

function activityError(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  return 'Não foi possível carregar as atividades do projeto.'
}

export const useProjectActivityStore = defineStore('projectActivity', () => {
  // Estado separado por projeto para não misturar feeds quando se muda de rota.
  const byProject = ref({})

  function getState(projectId) {
    const key = String(projectId)
    if (!byProject.value[key]) {
      byProject.value[key] = {
        events: [],
        count: 0,
        nextPage: null,
        loading: false,
        loaded: false,
        error: '',
      }
    }
    return byProject.value[key]
  }

  async function load(projectId, { more = false, refresh = false } = {}) {
    if (projectId == null || projectId === '') return
    const state = getState(projectId)
    if (state.loading || (!more && state.loaded && !refresh)) return
    if (more && !state.nextPage) return

    const page = more ? state.nextPage : 1
    state.loading = true
    state.error = ''

    try {
      const response = await projectsApi.activities(projectId, {
        page,
        page_size: PAGE_SIZE,
      })
      const payload = response.data
      const incoming = Array.isArray(payload) ? payload : (payload?.results || [])
      const previous = more ? state.events : []
      const knownIds = new Set(previous.map((event) => String(event.id)))

      state.events = [
        ...previous,
        ...incoming.filter((event) => !knownIds.has(String(event.id))),
      ]
      state.count = Array.isArray(payload)
        ? incoming.length
        : (payload?.count ?? state.events.length)
      state.nextPage = !Array.isArray(payload) && payload?.next ? page + 1 : null
      state.loaded = true
    } catch (error) {
      state.error = activityError(error)
    } finally {
      state.loading = false
    }
  }

  return { byProject, load }
})
