import api from './config'
import axios from 'axios'

const authApi = {
  login(credentials) {
    const payload = {
      email: credentials?.email ?? credentials?.username ?? '',
      password: credentials?.password ?? '',
    }

    return api.post('token/', payload)
  },

  refresh(payload) {
    return axios.post(`${api.defaults.baseURL}token/refresh/`, payload, {
      headers: {
        Authorization: undefined,
      },
    })
  },

  googleLogin(credential) {
    return api.post('auth/google/', { credential })
  },

  googleLink(credential) {
    return api.post('auth/google/vincular/', { credential })
  },

  googleLinkStatus() {
    return api.get('auth/google/vincular/')
  },

  me() {
    return api.get('usuarios/me/')
  },
}

export default authApi
