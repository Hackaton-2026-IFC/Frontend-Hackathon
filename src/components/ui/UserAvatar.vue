<script setup>
import { computed, ref } from 'vue'
import { profilePhotoUrl } from '@/utils/profilePhoto'

const props = defineProps({
  user: { type: Object, default: null },
  name: { type: String, default: '' },
  size: { type: Number, default: 32 },
})
const failedUrl = ref('')
const name = computed(() => props.name || props.user?.name || props.user?.username || 'Usuário')
const photo = computed(() => profilePhotoUrl(props.user))
const initials = computed(() => name.value.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('pt-BR') || 'U')
</script>

<template>
  <span class="person-avatar" :style="{ width: size + 'px', height: size + 'px', fontSize: Math.max(10, Math.round(size * 0.37)) + 'px' }"
    :title="name" role="img" :aria-label="'Foto de perfil de ' + name">
    <img v-if="photo && failedUrl !== photo" :src="photo" alt="" loading="lazy" @error="failedUrl = photo" />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>

<style scoped>
.person-avatar { display: inline-grid; place-items: center; flex: none; overflow: hidden; border-radius: 50%; background: #171717; color: white; font-weight: 700; line-height: 1; vertical-align: middle; }
.person-avatar img { width: 100%; height: 100%; display: block; object-fit: cover; }
</style>
