import api from './config'

const notificationsApi = {
  list: (params = {}) => api.get('notificacoes/', { params }),
  unread: () => api.get('notificacoes/nao-lidas/'),
  read: (id) => api.post(`notificacoes/${encodeURIComponent(id)}/ler/`),
  readAll: () => api.post('notificacoes/ler-todas/'),
}

export default notificationsApi
