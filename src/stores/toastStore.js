import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const type = ref('info')
  const duration = ref(5000)
  const toastId = ref(0)

  function show(text, variant = 'info', timeout = 5000) {
    message.value = String(text || '')
    type.value = variant
    duration.value = timeout
    toastId.value += 1
  }

  function success(text, timeout) { show(text, 'success', timeout) }
  function error(text, timeout) { show(text, 'error', timeout) }
  function info(text, timeout) { show(text, 'info', timeout) }
  function warning(text, timeout) { show(text, 'warning', timeout) }
  function close() { message.value = '' }

  return { message, type, duration, toastId, show, success, error, info, warning, close }
})
