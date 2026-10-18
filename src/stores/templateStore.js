import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useTemplateStore = defineStore('template', () => {
  const loadingCount = ref(0)
  const isLoading = computed(() => loadingCount.value > 0)

  function startLoading() {
    loadingCount.value += 1
  }

  function stopLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
  }
})
