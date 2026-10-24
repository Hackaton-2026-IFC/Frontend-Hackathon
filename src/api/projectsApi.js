import api from './config'

const projectsApi = {
  list: (params = {}) => api.get('projetos/', { params }),
  get: (id) => api.get(`projetos/${id}/`),
  create: (data) => api.post('projetos/', data),
  update: (id, data) => api.patch(`projetos/${id}/`, data),
  remove: (id) => api.delete(`projetos/${id}/`),
  pin: (id) => api.post(`projetos/${id}/fixar/`),
  unpin: (id) => api.delete(`projetos/${id}/fixar/`),
  kanban: (id) => api.get(`projetos/${id}/kanban/`),
  dashboard: (id) => api.get(`projetos/${id}/dashboard/`),
  activities: (id, params = {}) => api.get(`projetos/${encodeURIComponent(id)}/atividades/`, { params }),
  resources: (id) => api.get(`projetos/${id}/recursos/`),
  addResource: (id, data) => api.post(`projetos/${id}/recursos/`, data),
  members: (id) => api.get(`projetos/${id}/membros/`),
}
export default projectsApi
