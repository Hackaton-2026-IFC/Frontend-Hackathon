import { ref } from 'vue'

export const toasts = ref([])
let nextId = 0
const timers = new Map()

export function cleanMessage(value) {
  return String(value || '').replace(/(^|[•\n]\s*)status\s*:\s*/gi, '$1').trim()
}

export function dismissToast(id) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  toasts.value = toasts.value.filter(toast => toast.id !== id)
}

export function notify(message, type = 'success') {
  const text = cleanMessage(message)
  if (!text) return
  if (toasts.value.some(toast => toast.message === text && toast.type === type)) return
  const id = ++nextId
  toasts.value.push({ id, message: text, type })
  timers.set(id, setTimeout(() => dismissToast(id), type === 'error' ? 9000 : 5000))
}
