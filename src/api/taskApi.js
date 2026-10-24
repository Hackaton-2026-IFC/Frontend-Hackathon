import api from './config'

export const TASK_STATUSES = {
  planejado: 'A fazer',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}
export const TASK_PRIORITIES = {
  muito_baixa: 'Muito baixa',
  baixa: 'Baixa',
  neutra: 'Neutra',
  alta: 'Alta',
  muito_alta: 'Muito alta',
}

export function taskError(error) {
  const data = error?.response?.data
  if (typeof data === 'string') return 'Não foi possível concluir a operação. Tente novamente.'
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(
        ([key, value]) =>
          `${key === 'detail' ? '' : key + ': '}${Array.isArray(value) ? value.join(' ') : String(value)}`,
      )
      .join(' ')
  }
  return error?.message || 'Não foi possível conectar ao servidor.'
}

export function isOverdue(task, today = new Date()) {
  if (!task.data_limite || task.status === 'concluido') return false
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return task.data_limite < localDate
}

export function formatDeadline(value) {
  if (!value) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))
}

export function safeResourceUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

async function allProjects() {
  const projects = []
  let page = 1
  while (true) {
    const { data } = await api.get('projetos/', { params: { page } })
    if (Array.isArray(data)) return data
    projects.push(...data.results)
    if (data.total_pages != null ? page >= data.total_pages : !data.next) return projects
    page += 1
  }
}

export default {
  async list() {
    const { data } = await api.get('tarefas/kanban/')
    return Object.values(data).flat()
  },
  projects: allProjects,
  async create(payload) {
    return (await api.post('tarefas/', payload)).data
  },
  async update(id, payload) {
    return (await api.patch(`tarefas/${id}/`, payload)).data
  },
  async remove(id) {
    await api.delete(`tarefas/${id}/`)
  },
  async get(id) {
    return (await api.get(`tarefas/${id}/`)).data
  },
  async addChecklist(payload) {
    return (await api.post('microtarefas/', payload)).data
  },
  async updateChecklist(id, payload) {
    return (await api.patch(`microtarefas/${id}/`, payload)).data
  },
  async resources(id) {
    return (await api.get(`tarefas/${id}/recursos/`)).data
  },
  async addResource(id, payload) {
    return (await api.post(`tarefas/${id}/recursos/`, payload)).data
  },
}
