
import { defineStore } from 'pinia'
import authApi from '@/api/authApi'
import api from '@/api/config'
import { computed, ref } from 'vue'
import { jwtDecode } from 'jwt-decode'
import router from '@/router'
import { useTemplateStore } from '@/stores/templateStore'

export const useAuthStore = defineStore('auth', () => {
  const templateStore = useTemplateStore()
  const accessToken = ref(localStorage.getItem('access_token') || null)
  const refreshToken = ref(localStorage.getItem('refresh_token') || null)
  const user = ref(null)
  const errorMessage = ref('')

  const isAuthenticated = computed(() => !!accessToken.value)

  function translateErrorMessage(message) {
    const normalized = message.trim().replace(/[.!?]+$/, '')
    const translations = {
      'No active account found with the given credentials':
        'Não foi encontrada uma conta ativa com as credenciais informadas.',
    }

    return translations[normalized] ?? message
  }

  function getErrorMessage(error, fallbackMessage) {
    const responseData = error?.response?.data
    const responseMessage =
      responseData?.detail ??
      responseData?.message ??
      responseData?.non_field_errors

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return translateErrorMessage(responseMessage)
    }

    if (Array.isArray(responseMessage) && responseMessage.length) {
      return responseMessage
        .map((message) =>
          typeof message === 'string'
            ? translateErrorMessage(message)
            : String(message),
        )
        .join(' ')
    }

    if (responseData && typeof responseData === 'object') {
      const fieldErrors = Object.entries(responseData)
        .flatMap(([field, messages]) => {
          const values = Array.isArray(messages) ? messages : [messages]
          return values
            .filter((message) => typeof message === 'string')
            .map((message) => `${field}: ${message}`)
        })
        .join(' ')

      if (fieldErrors) return fieldErrors
    }

    return typeof error?.message === 'string' && error.message.trim()
      ? translateErrorMessage(error.message)
      : fallbackMessage
  }

  function setUserFromToken(token) {
    try {
      const payload = jwtDecode(token)
      user.value = {
        id: payload.user_id ?? payload.id ?? null,
        user_id: payload.user_id ?? null,
        name: payload.name ?? null,
        email: payload.email ?? null,
      }
    } catch (error) {
      user.value = null
      errorMessage.value = getErrorMessage(
        error,
        'Não foi possível ler os dados da sessão.',
      )
    }
  }

  async function loadCurrentUser() {
    errorMessage.value = ''
    templateStore.startLoading()

    try {
      const response = await authApi.me()
      const profile = response.data

      user.value = profile
      localStorage.setItem('user_profile_cache', JSON.stringify(profile))

      return profile
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error)
      errorMessage.value = getErrorMessage(
        error,
        'Não foi possível carregar os dados do usuário.',
      )
      throw error
    } finally {
      templateStore.stopLoading()
    }
  }

  if (accessToken.value) {
    setUserFromToken(accessToken.value)

    const cache = localStorage.getItem('user_profile_cache')
    if (cache && user.value) {
      try {
        user.value = { ...user.value, ...JSON.parse(cache) }
      } catch (error) {
        console.error('Erro ao ler o cache do usuário:', error)
        errorMessage.value = getErrorMessage(
          error,
          'Não foi possível carregar os dados salvos do usuário.',
        )
      }
    }
  }

  async function login(credentials) {
    errorMessage.value = ''
    templateStore.startLoading()

    try {
      const response = await authApi.login(credentials)
      const { access, refresh } = response.data

      accessToken.value = access
      refreshToken.value = refresh

      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)

      setUserFromToken(access)
      await loadCurrentUser()
      await router.push('/home')

      return true
    } catch (error) {
      console.error('Login failed:', error)
      const message = getErrorMessage(
        error,
        'Não foi possível realizar o login. Verifique seus dados e tente novamente.',
      )
      if (accessToken.value) logout()
      errorMessage.value = message
      return false
    } finally {
      templateStore.stopLoading()
    }
  }

  async function refreshAccessToken() {
    errorMessage.value = ''
    templateStore.startLoading()

    try {
      const rToken = localStorage.getItem('refresh_token')

      if (!rToken) {
        console.warn('Nenhum refresh token encontrado no localStorage')
        throw new Error('Não há uma sessão válida. Entre novamente.')
      }

      const response = await authApi.refresh({ refresh: rToken })
      const { access } = response.data

      accessToken.value = access
      localStorage.setItem('access_token', access)
      setUserFromToken(access)

      return access
    } catch (error) {
      console.error(
        'Erro ao atualizar token:',
        error.response?.data || error.message,
      )
      const message = getErrorMessage(
        error,
        'Não foi possível renovar sua sessão. Entre novamente.',
      )
      logout()
      errorMessage.value = message
      throw error
    } finally {
      templateStore.stopLoading()
    }
  }

  function refreshUserSession() {
    return refreshAccessToken()
  }

  async function updateUserAccount(userId, data) {
    errorMessage.value = ''
    templateStore.startLoading()

    try {
      const response = await api.patch(`/usuarios/${userId}/`, data, {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      })

      return response.data
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      errorMessage.value = getErrorMessage(
        error,
        'Não foi possível atualizar os dados da conta.',
      )
      throw error
    } finally {
      templateStore.stopLoading()
    }
  }

  function updateUserData(newData) {
    if (user.value) {
      user.value = { ...user.value, ...newData }
      localStorage.setItem('user_profile_cache', JSON.stringify(user.value))
    }
  }

  async function uploadProfileImage(file) {
    errorMessage.value = ''
    templateStore.startLoading()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await api.post('/media/images/', formData)
      const image = uploadResponse.data

      if (!image?.attachment_key) {
        throw new Error('O servidor não retornou o identificador da imagem.')
      }

      const userId = user.value?.id ?? user.value?.user_id

      if (!userId) {
        throw new Error('Não foi possível identificar o usuário.')
      }

      const updatedUser = await updateUserAccount(userId, {
        profile_image_attachment_key: image.attachment_key,
      })

      // Busca novamente os dados para confirmar a alteração.
      await loadCurrentUser()

      return updatedUser
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error)
      errorMessage.value = getErrorMessage(
        error,
        'Não foi possível atualizar a foto de perfil.',
      )
      throw error
    } finally {
      templateStore.stopLoading()
    }
  }

  function logout() {
    errorMessage.value = ''
    accessToken.value = null
    refreshToken.value = null
    user.value = null

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_profile_cache')

    router.push('/')
  }

  return {
    accessToken,
    refreshToken,
    isAuthenticated,
    user,
    errorMessage,
    login,
    logout,
    loadCurrentUser,
    refreshAccessToken,
    refreshUserSession,
    updateUserAccount,
    updateUserData,
    uploadProfileImage,
  }
})
