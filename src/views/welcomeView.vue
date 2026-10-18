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
  <p v-if="authStore.errorMessage" class="login-error" role="alert">
    {{ authStore.errorMessage }}
  </p>
</template>
<style scoped>
.login-error {
  margin-top: 1rem;
  color: #8b1e1e;
  text-align: center;
}
</style>
