<script setup>
import { useAuthStore } from '@/stores/authStore'
import { ref } from 'vue'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')

function handleLogin() {
  authStore.login({
    email: email.value,
    password: password.value,
  })
}
</script>
<template>
  <h1 style="text-align: center">Bem vindo site em desenvolvimento</h1>

  <form @submit.prevent="handleLogin">
    <input type="email" placeholder="E-Mail" v-model="email" required />
    <input type="password" placeholder="Password" v-model="password" required />
    <button type="submit">Log-in</button>
  </form>
</template>