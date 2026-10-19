import api from './config'

const registerApi = {
  register(credentials) {
    const payload = {
      name: credentials?.name ?? '',
      email: credentials?.email ?? '',
      password: credentials?.password ?? '',
    }

    return api.post('registro/', payload)
  },
}

export default registerApi
