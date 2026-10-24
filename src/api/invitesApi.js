import api from './config'

const invitesApi = {
  create: (projectId, userId, role = 'member') =>
    api.post('convites/', {
      projeto: Number(projectId),
      usuario: Number(userId),
      cargo: role,
    }),

  list: (params = {}) =>
    api.get('convites/', { params }),

  accept: (inviteId) =>
    api.post(`convites/${inviteId}/responder/`, {
      acao: 'aceitar',
    }),

  reject: (inviteId) =>
    api.post(`convites/${inviteId}/responder/`, {
      acao: 'recusar',
    }),
}

export default invitesApi