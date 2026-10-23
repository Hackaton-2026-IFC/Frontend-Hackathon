import api from './config'

const collaborationApi = {
  users: (params = {}) => api.get('usuarios/', { params }),
  invites: (params = {}) => api.get('convites/', { params }),
  createInvite: (data) => api.post('convites/', data),
  resources: (params = {}) => api.get('recursos/', { params }),
  removeResource: (id) => api.delete(`recursos/${id}/`),
}
export default collaborationApi
