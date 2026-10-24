import axios from 'axios'

const BACKEND_URL = (
  import.meta.env.VITE_URL_BACKEND?.trim() ||
  'http://127.0.0.1:8000/api/'
).replace(/\/+$/, '') + '/'

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 20000,
  headers: {
    'Accept-Language': 'pt-br',
  },
})

let refreshPromise = null

function encerrarSessao() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_profile_cache')

  window.location.assign('/')
}

async function renovarToken() {
  const refreshToken = localStorage.getItem('refresh_token')

  if (!refreshToken) {
    throw new Error('Sua sessão expirou. Faça login novamente.')
  }

  const { data } = await axios.post(
    `${BACKEND_URL}token/refresh/`,
    {
      refresh: refreshToken,
    },
    {
      timeout: 20000,
      headers: {
        'Accept-Language': 'pt-br',
      },
    },
  )

  if (!data.access) {
    throw new Error('O servidor não retornou um token de acesso.')
  }

  localStorage.setItem('access_token', data.access)

  if (data.refresh) {
    localStorage.setItem('refresh_token', data.refresh)
  }

  return data.access
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const requestUrl = originalRequest.url || ''

    const isTokenEndpoint =
      /(?:^|\/)token(?:\/|$)/.test(requestUrl)

    const deveRenovar =
      error.response?.status === 401 &&
      !isTokenEndpoint &&
      !originalRequest._retry

    if (!deveRenovar) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    let novoToken

    try {
      if (!refreshPromise) {
        refreshPromise = renovarToken().finally(() => {
          refreshPromise = null
        })
      }

      novoToken = await refreshPromise
    } catch (refreshError) {
      // Encerra a sessão quando não há refresh token
      // ou quando o backend rejeita sua validade.
      const status = refreshError.response?.status

      if (
        !localStorage.getItem('refresh_token') ||
        status === 400 ||
        status === 401
      ) {
        encerrarSessao()
      }

      return Promise.reject(refreshError)
    }

    originalRequest.headers.Authorization = `Bearer ${novoToken}`

    return api(originalRequest)
  },
)

export default api
