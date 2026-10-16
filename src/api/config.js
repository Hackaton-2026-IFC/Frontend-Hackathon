import axios from 'axios'

const url = import.meta.env.VITE_URL_BACKEND

const api = axios.create({
  baseURL: url ?? 'http://127.0.0.1:8000/api/',
})

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

    if (error.response?.status === 401 && !originalRequest?._retry) {
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
