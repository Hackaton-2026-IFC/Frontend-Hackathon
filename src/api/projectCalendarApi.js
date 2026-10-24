import api from './config'

const projectCalendarApi = {
  list: (projectId, params = {}) => api.get(`projetos/${encodeURIComponent(projectId)}/calendario/`, { params }),
  create: (projectId, data) => api.post(`projetos/${encodeURIComponent(projectId)}/calendario/`, data),
  update: (projectId, eventId, data) => api.patch(`projetos/${encodeURIComponent(projectId)}/calendario/${encodeURIComponent(eventId)}/`, data),
  remove: (projectId, eventId) => api.delete(`projetos/${encodeURIComponent(projectId)}/calendario/${encodeURIComponent(eventId)}/`),
  exportGoogle: (projectId, eventId, accessToken) => api.post(
    `projetos/${encodeURIComponent(projectId)}/google-agenda/`,
    { evento: eventId, access_token: accessToken },
  ),
}

export default projectCalendarApi
