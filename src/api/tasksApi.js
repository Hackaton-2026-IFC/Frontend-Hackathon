import api from './config'

const tasksApi = {
  list: (params = {}) => api.get('tarefas/', { params }),
  get: (id) => api.get(`tarefas/${id}/`),
  weather: (id) => api.get(`tarefas/${encodeURIComponent(id)}/clima/`),
  create: (data) => api.post('tarefas/', data),
  update: (id, data) => api.patch(`tarefas/${id}/`, data),
  remove: (id) => api.delete(`tarefas/${id}/`),
  microtasks: (params = {}) => api.get('microtarefas/', { params }),
  createMicrotask: (data) => api.post('microtarefas/', data),
  updateMicrotask: (id, data) => api.patch(`microtarefas/${id}/`, data),
  removeMicrotask: (id) => api.delete(`microtarefas/${id}/`),
}
export default tasksApi
