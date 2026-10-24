import api from './config'

const agentApi = {
  analyze(projectId, payload = {}) {
    return api.post(
      `projetos/${encodeURIComponent(projectId)}/agente/`,
      payload,
      { timeout: 45000 },
    )
  },
}

export default agentApi
