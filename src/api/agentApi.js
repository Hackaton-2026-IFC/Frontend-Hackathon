import api from './config'

const agentApi = {
  analyze(projectId, payload = {}) {
    return api.post(
      `projetos/${encodeURIComponent(projectId)}/agente/`,
      payload,
    )
  },
}

export default agentApi
