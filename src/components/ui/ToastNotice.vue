<script setup>
import { watch } from 'vue'
import { notify } from '@/composables/useToasts'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'success' },
})
watch(() => [props.message, props.type], ([message, type]) => notify(message, type), { immediate: true })
</script>

<template></template>
