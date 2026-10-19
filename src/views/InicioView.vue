<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'

const auth = useAuthStore()
const router = useRouter()

function sair() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="grid min-h-screen place-items-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Você está logado!</h1>
      <p class="mt-1 text-sm text-neutral-600">Página provisória, substitua pela sua página inicial.</p>
      <button class="mt-6 cursor-pointer rounded-full bg-neutral-900 px-6 py-2 text-sm text-white" @click="sair">
        Sair
      </button>
    </div>
  </main>
</template>
