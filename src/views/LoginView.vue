
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoginForm from '@/components/auth/LoginForm.vue'
import { useAuthStore } from '@/stores/authStore.js'

const auth = useAuthStore()
const route = useRoute()

const loading = ref(false)
const error = ref('')

const message = computed(() =>
  route.query.cadastro === 'ok'
    ? 'Conta criada! Faça login para continuar.'
    : '',
)

async function handleLogin(credentials) {
  loading.value = true
  error.value = ''

  try {
    const success = await auth.login(credentials)
    if (!success) error.value = auth.errorMessage
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-form-panel auth-login-panel">
    <LoginForm
      :loading="loading"
      :error="error"
      :message="message"
      @submit="handleLogin"
    />
  </div>
</template>

<style scoped>
.auth-form-panel {
  position: absolute;
  inset-block: 0;
  left: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 50%;
  min-width: 0;
  padding: clamp(24px, 4vw, 56px);
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .auth-form-panel {
    inset-block: 0 150px;
    width: 100%;
    padding: 24px;
  }
}

@media (max-width: 380px) {
  .auth-form-panel {
    padding: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-form-panel {
    scroll-behavior: auto;
  }
}
</style>
