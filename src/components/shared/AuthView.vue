<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthOverlay from '@/components/auth/AuthOverlay.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import { useAuthStore } from '@/stores/authStore.js'

const auth = useAuthStore()
const router = useRouter()
const mode = ref('login')
const loading = ref(false)
const error = ref('')
const message = ref('')

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
  message.value = ''
}

async function handleLogin(credentials) {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await auth.login(credentials)
    await router.push({ name: 'inicio' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleRegister(data) {
  loading.value = true
  error.value = ''
  try {
    await auth.register(data)
    mode.value = 'login'
    message.value = 'Conta criada! Faça login para continuar.'
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen w-full items-center justify-center bg-neutral-200 p-4">
    <!-- Card Principal com tamanho proporcional e centralizado -->
    <div class="relative h-[600px] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

      <!-- Formulário de Login (Lado Esquerdo) -->
      <LoginForm
        class="absolute inset-y-0 left-0 w-full md:w-1/2 flex flex-col justify-center p-8 transition-opacity duration-500"
        :class="mode === 'login' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'"
        :loading="loading"
        :error="mode === 'login' ? error : ''"
        :message="message"
        @submit="handleLogin"
      />

      <!-- Formulário de Cadastro (Lado Direito) -->
      <RegisterForm
        class="absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center p-8 transition-opacity duration-500"
        :class="mode === 'register' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'"
        :loading="loading"
        :error="mode === 'register' ? error : ''"
        @submit="handleRegister"
      />

      <!-- Painel Preto Deslizante (Overlay) -->
      <AuthOverlay :mode="mode" @toggle="toggleMode" />

    </div>
  </main>
</template>
