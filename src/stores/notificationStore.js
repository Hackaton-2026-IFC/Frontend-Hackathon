import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import invitesApi from '@/api/invitesApi'
import { useAuthStore } from '@/stores/authStore'

export const useNotificationStore = defineStore('notifications', () => {
  const auth = useAuthStore()
  const invites = ref([])
  const loaded = ref(false)
  const unreadCount = computed(() => invites.value.filter((invite) => {
    const status = String(invite.status ?? invite.situacao ?? 'pendente').toLowerCase()
    return status === 'pending' || status === 'pendente'
  }).length)
  let timer = null
  let lastUserId = null

  async function refresh() {
    if (!auth.isAuthenticated) {
      invites.value = []
      loaded.value = false
      lastUserId = null
      return
    }
    const userId = auth.user?.id ?? auth.user?.user_id ?? null
    if (userId !== lastUserId) {
      invites.value = []
      loaded.value = false
      lastUserId = userId
    }
    try {
      const { data } = await invitesApi.list()
      invites.value = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
      loaded.value = true
    } catch (error) {
      console.warn('Não foi possível atualizar os convites:', error)
    }
  }

  function startPolling() {
    if (timer) return
    refresh()
    timer = window.setInterval(refresh, 30000)
  }

  function stopPolling() {
    if (timer) window.clearInterval(timer)
    timer = null
  }

  return { invites, unreadCount, loaded, refresh, startPolling, stopPolling }
})
