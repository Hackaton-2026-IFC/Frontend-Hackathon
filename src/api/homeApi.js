import api from './config'

const homeApi = {
  async urgentTasks() {
    // Kanban retorna as tarefas de todos os projetos acessíveis e já inclui
    // os campos calculados de urgência, atraso e prazo efetivo.
    const { data } = await api.get('tarefas/kanban/')
    return Object.values(data || {}).flat().filter((task) => task && typeof task === 'object')
  },

  async smartDay(limit = 6) {
    // A pontuação é calculada no backend (FEAT-67), não na view.
    const { data } = await api.get('meu-dia/', { params: { limite: limit } })
    return data
  },

  async lastActivity(projectId) {
    const { data } = await api.get(`projetos/${encodeURIComponent(projectId)}/atividades/`, {
      params: { page_size: 1 },
    })
    return Array.isArray(data) ? data[0] || null : data?.results?.[0] || null
  },
}

export default homeApi
