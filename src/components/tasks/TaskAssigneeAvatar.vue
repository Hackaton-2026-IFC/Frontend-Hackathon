<script setup>
import { computed, ref } from 'vue'
import { assigneeDisplayName, assigneePhotoUrl } from '@/utils/taskPresentation'

const props = defineProps({
  member: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const failedUrl = ref('')
const name = computed(() => assigneeDisplayName(props.member))
const photo = computed(() => assigneePhotoUrl(props.member))
const initial = computed(() => name.value.charAt(0).toLocaleUpperCase('pt-BR') || '?')
</script>

<template>
  <span
    class="task-member-avatar"
    :class="{ 'task-member-avatar--compact': compact }"
    role="img"
    :aria-label="name"
    :title="name"
  >
    <img v-if="photo && failedUrl !== photo" :src="photo" alt="" loading="lazy" @error="failedUrl = photo" />
    <span v-else aria-hidden="true">{{ initial }}</span>
  </span>
</template>
