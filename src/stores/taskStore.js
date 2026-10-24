import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import taskApi, { taskError } from '@/api/taskApi'
import usersApi from '@/api/usersApi'
import invitesApi from '@/api/invitesApi'

export const useTaskStore = defineStore('tasks', () => {
  const authStore = useAuthStore()
  const tasks = ref([])
  const projects = ref([])
  const loading = ref(false)
  const error = ref('')
  const busy = ref(false)
  const inviting = ref(false)
  const resourcesByTask = ref({})
  const resourcesLoading = ref({})
  const resourceErrors = ref({})
  const commentsByTask = ref({})
  const commentsLoading = ref({})
  const commentsErrors = ref({})
  const commentsBusy = ref(false)
  const commentsCountByTask = ref({})
  const commentsNextPageByTask = ref({})

  // The backend supports only one official assignee per task. Extra selections
  // are local to this browser and scoped by authenticated user ID.
  const additionalAssigneesByTask = ref({})
  const localAssigneesStorageKey = computed(() => {
    const userId = authStore.user?.id ?? authStore.user?.user_id
    return userId == null ? null : `momentum:task-extra-assignees:v1:${userId}`
  })

  function hydrateAdditionalAssignees() {
    additionalAssigneesByTask.value = {}
    if (!localAssigneesStorageKey.value || typeof localStorage === 'undefined') return

    try {
      const value = JSON.parse(localStorage.getItem(localAssigneesStorageKey.value) || '{}')
      if (!value || typeof value !== 'object' || Array.isArray(value)) return
      additionalAssigneesByTask.value = Object.fromEntries(
        Object.entries(value)
          .filter(([, ids]) => Array.isArray(ids))
          .map(([taskId, ids]) => [taskId, [...new Set(ids.map(String).filter(Boolean))]]),
      )
    } catch {
      // Storage might be disabled or contain invalid older data.
      additionalAssigneesByTask.value = {}
    }
  }

  watch(localAssigneesStorageKey, hydrateAdditionalAssignees, { immediate: true })

  function persistAdditionalAssignees() {
    if (!localAssigneesStorageKey.value || typeof localStorage === 'undefined') return false
    try {
      localStorage.setItem(localAssigneesStorageKey.value, JSON.stringify(additionalAssigneesByTask.value))
      return true
    } catch {
      return false
    }
  }

  function setAdditionalAssignees(taskId, userIds) {
    const ids = [...new Set(userIds.map(String).filter(Boolean))]
    const key = String(taskId)
    const next = { ...additionalAssigneesByTask.value }
    if (ids.length) next[key] = ids
    else delete next[key]
    additionalAssigneesByTask.value = next
    return persistAdditionalAssignees()
  }

  function replace(task) {
    const index = tasks.value.findIndex((item) => item.id === task.id)
    if (index >= 0) tasks.value[index] = task
    else tasks.value.unshift(task)
    return task
  }

  async function load() {
    if (loading.value) return
    loading.value = true
    error.value = ''
    tasks.value = []
    projects.value = []
    resourcesByTask.value = {}
    resourcesLoading.value = {}
    resourceErrors.value = {}
    commentsByTask.value = {}
    commentsLoading.value = {}
    commentsErrors.value = {}
    commentsCountByTask.value = {}
    commentsNextPageByTask.value = {}
    try {
      const [allTasks, allProjects] = await Promise.all([taskApi.list(), taskApi.projects()])
      tasks.value = allTasks
      projects.value = allProjects
    } catch (err) {
      error.value = taskError(err)
    } finally {
      loading.value = false
    }
  }

  async function mutate(operation) {
    if (busy.value) throw new Error('Aguarde a operação atual terminar.')
    busy.value = true
    error.value = ''
    try {
      return await operation()
    } catch (err) {
      error.value = taskError(err)
      throw err
    } finally {
      busy.value = false
    }
  }

  const create = (payload) => mutate(async () => replace(await taskApi.create(payload)))
  const update = (id, payload) => mutate(async () => replace(await taskApi.update(id, payload)))
  const remove = (id) =>
    mutate(async () => {
      await taskApi.remove(id)
      tasks.value = tasks.value.filter((item) => item.id !== id)
      delete resourcesByTask.value[id]
      delete resourcesLoading.value[id]
      delete resourceErrors.value[id]
      delete commentsByTask.value[id]
      delete commentsLoading.value[id]
      delete commentsErrors.value[id]
      delete commentsCountByTask.value[id]
      delete commentsNextPageByTask.value[id]
      if (additionalAssigneesByTask.value[String(id)]) {
        const next = { ...additionalAssigneesByTask.value }
        delete next[String(id)]
        additionalAssigneesByTask.value = next
        persistAdditionalAssignees()
      }
    })
  async function updateChecklistStep(taskId, stepId, title) {
    const trimmed = title?.trim()
    if (!trimmed) throw new Error('Informe o nome da etapa.')
    return mutate(async () => {
      await taskApi.updateChecklist(stepId, { titulo: trimmed })
      return replace(await taskApi.get(taskId))
    })
  }

  async function removeChecklistStep(taskId, stepId) {
    return mutate(async () => {
      await taskApi.removeChecklist(stepId)
      return replace(await taskApi.get(taskId))
    })
  }

  async function searchUsers(term) {
    const query = String(term || '').trim()
    if (query.length < 2) return []
    const response = await usersApi.search(query)
    const data = response.data
    return Array.isArray(data) ? data : (data?.results || [])
  }

  async function inviteProjectMember(projectId, userId) {
    if (inviting.value || busy.value) throw new Error('Aguarde a operação atual terminar.')
    inviting.value = true
    try {
      return (await invitesApi.create(projectId, userId, 'member')).data
    } finally {
      inviting.value = false
    }
  }

  async function checklist(taskId, item, title) {
    return mutate(async () => {
      if (item) await taskApi.updateChecklist(item.id, { concluida: !item.concluida })
      else {
        const task = tasks.value.find((entry) => entry.id === taskId)
        const ordem = Math.max(0, ...(task?.microtarefas || []).map((entry) => entry.ordem)) + 1
        await taskApi.addChecklist({ tarefa: taskId, titulo: title, ordem, concluida: false })
      }
      // The backend recalculates task status after checklist changes.
      return replace(await taskApi.get(taskId))
    })
  }

  async function loadResources(taskId) {
    if (resourcesLoading.value[taskId]) return
    resourcesLoading.value[taskId] = true
    resourceErrors.value[taskId] = ''
    try {
      const resources = await taskApi.resources(taskId)
      resourcesByTask.value[taskId] = resources
      return resources
    } catch (err) {
      resourceErrors.value[taskId] = taskError(err)
      throw err
    } finally {
      resourcesLoading.value[taskId] = false
    }
  }

  const addResource = (taskId, payload) =>
    mutate(async () => {
      resourceErrors.value[taskId] = ''
      try {
        const resource = await taskApi.addResource(taskId, payload)
        resourcesByTask.value[taskId] = [resource, ...(resourcesByTask.value[taskId] || [])]
        return resource
      } catch (err) {
        resourceErrors.value[taskId] = taskError(err)
        throw err
      }
    })

  async function loadComments(taskId, { more = false } = {}) {
    const key = String(taskId)
    if (commentsLoading.value[key]) return
    const page = more ? commentsNextPageByTask.value[key] : 1
    if (more && !page) return

    commentsLoading.value[key] = true
    commentsErrors.value[key] = ''
    try {
      const data = await taskApi.comments(taskId, page)
      const incoming = Array.isArray(data) ? data : (data.results || [])
      const previous = more ? (commentsByTask.value[key] || []) : []
      const existingIds = new Set(previous.map((comment) => String(comment.id)))
      commentsByTask.value[key] = [
        ...previous,
        ...incoming.filter((comment) => !existingIds.has(String(comment.id))),
      ]
      commentsCountByTask.value[key] = Array.isArray(data) ? incoming.length : (data.count ?? incoming.length)
      commentsNextPageByTask.value[key] = !Array.isArray(data) && data.next ? page + 1 : null
      return commentsByTask.value[key]
    } catch (err) {
      commentsErrors.value[key] = taskError(err)
      throw err
    } finally {
      commentsLoading.value[key] = false
    }
  }

  async function withCommentMutation(taskId, operation) {
    if (commentsBusy.value) throw new Error('Aguarde a operação anterior terminar.')
    commentsBusy.value = true
    commentsErrors.value[String(taskId)] = ''
    try {
      return await operation()
    } catch (err) {
      commentsErrors.value[String(taskId)] = taskError(err)
      throw err
    } finally {
      commentsBusy.value = false
    }
  }

  const addComment = (taskId, content) =>
    withCommentMutation(taskId, async () => {
      const key = String(taskId)
      const comment = await taskApi.addComment(taskId, content)
      const previous = commentsByTask.value[key] || []
      if (!previous.some((item) => String(item.id) === String(comment.id))) {
        commentsByTask.value[key] = [...previous, comment]
        commentsCountByTask.value[key] = (commentsCountByTask.value[key] ?? previous.length) + 1
      }
      return comment
    })

  const updateComment = (taskId, commentId, content) =>
    withCommentMutation(taskId, async () => {
      const comment = await taskApi.updateComment(taskId, commentId, content)
      const key = String(taskId)
      commentsByTask.value[key] = (commentsByTask.value[key] || []).map(
        (item) => String(item.id) === String(commentId) ? comment : item,
      )
      return comment
    })

  const removeComment = (taskId, commentId) =>
    withCommentMutation(taskId, async () => {
      await taskApi.removeComment(taskId, commentId)
      const key = String(taskId)
      const previous = commentsByTask.value[key] || []
      commentsByTask.value[key] = previous.filter((item) => String(item.id) !== String(commentId))
      if (previous.length !== commentsByTask.value[key].length) {
        commentsCountByTask.value[key] = Math.max(0, (commentsCountByTask.value[key] ?? previous.length) - 1)
      }
    })

  return {
    tasks,
    projects,
    loading,
    error,
    busy,
    inviting,
    resourcesByTask,
    resourcesLoading,
    resourceErrors,
    commentsByTask,
    commentsLoading,
    commentsErrors,
    commentsBusy,
    commentsCountByTask,
    commentsNextPageByTask,
    loadComments,
    addComment,
    updateComment,
    removeComment,
    additionalAssigneesByTask,
    setAdditionalAssignees,
    load,
    create,
    update,
    remove,
    checklist,
    updateChecklistStep,
    removeChecklistStep,
    searchUsers,
    inviteProjectMember,
    loadResources,
    addResource,
  }
})
