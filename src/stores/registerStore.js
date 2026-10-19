import { defineStore } from 'pinia'
import { ref } from 'vue'
import registerApi from '@/api/registerApi'
import { useAuthStore } from '@/stores/authStore'
import { useTemplateStore } from '@/stores/templateStore'

export const useRegisterStore = defineStore('register', () => {
  const authStore = useAuthStore()
  const templateStore = useTemplateStore()
  const errorMessage = ref('')

  function getErrorMessage(error) {
    const responseData = error?.response?.data
    const detail = responseData?.detail ?? responseData?.message

    if (typeof detail === 'string' && detail.trim()) return detail

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

    return 'Não foi possível criar sua conta. Verifique os dados e tente novamente.'
  }

  function clearError() {
    errorMessage.value = ''
  }

  async function register(credentials) {
    clearError()
    templateStore.startLoading()

    try {
      await registerApi.register(credentials)
      const loginSucceeded = await authStore.login(credentials)

      if (loginSucceeded === false) {
        errorMessage.value = `Sua conta foi criada, mas o login automático falhou: ${authStore.errorMessage}`
      }

      return true
    } catch (error) {
      console.error('Erro ao registrar usuário:', error)
      errorMessage.value = getErrorMessage(error)
      return false
    } finally {
      templateStore.stopLoading()
    }
  }

  return {
    errorMessage,
    clearError,
    register,
  }
})
