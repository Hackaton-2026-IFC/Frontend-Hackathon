import axios from 'axios'

const configuredUrl = import.meta.env.VITE_URL_BACKEND?.trim()
const url = configuredUrl ? `${configuredUrl.replace(/\/+$/, '')}/` : undefined

const api = axios.create({
  baseURL: url || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api/' : undefined),
  headers: {
    'Accept-Language': 'pt-br',
  },
})

api.interceptors.request.use(
  (config) => {
    if (!url && import.meta.env.PROD) {
      return Promise.reject(
        new Error(
          'A API não está configurada. Defina VITE_URL_BACKEND nas variáveis de ambiente da Vercel.',
        ),
      )
    }

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
    const requestUrl = originalRequest?.url ?? ''
    const isTokenEndpoint = /(?:^|\/)token(?:\/|$)/.test(requestUrl)

    if (
      error.response?.status === 401 &&
      !isTokenEndpoint &&
      !originalRequest?._retry
    ) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_profile_cache')
        window.location.href = '/'
        return Promise.reject(error)
      }

      try {
        originalRequest._retry = true

        const response = await axios.post(
          `${api.defaults.baseURL}token/refresh/`,
          {
            refresh: refreshToken,
          },
          {
            headers: {
              Authorization: undefined,
              'Accept-Language': 'pt-br',
            },
          },
        )

        const newAccessToken = response.data.access
        localStorage.setItem('access_token', newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_profile_cache')
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
