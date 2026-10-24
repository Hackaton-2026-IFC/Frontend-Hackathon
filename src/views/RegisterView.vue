
<script setup>
import { computed, ref } from 'vue'
import CadastroForm from '@/components/auth/RegisterForm.vue'
import { useRegisterStore } from '@/stores/registerStore.js'
import { useAuthStore } from '@/stores/authStore.js'

const registerStore = useRegisterStore()
const authStore = useAuthStore()
const googleError = ref('')

const loading = ref(false)
const error = computed(() => googleError.value || registerStore.errorMessage)

async function handleGoogle(credential) {
  if (loading.value) return
  loading.value = true
  googleError.value = ''
  try {
    const ok = await authStore.loginWithGoogle(credential)
    if (!ok) googleError.value = authStore.errorMessage
  } catch (e) { googleError.value = e.message || 'Falha no cadastro com Google.' }
  finally { loading.value = false }
}

async function handleCadastro(data) {
  googleError.value = ''
  loading.value = true

  try {
    await registerStore.register(data)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-form-panel auth-register-panel">
    <CadastroForm
      :loading="loading"
      :error="error"
      @submit="handleCadastro"
      @google="handleGoogle"
    />
  </div>
</template>

<style scoped>
.auth-form-panel {
  position: absolute;
  inset-block: 0;
  right: 0;

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
    right: auto;
    left: 0;

    width: 100%;
    padding: 24px;
  }
}

@media (max-width: 380px) {
  .auth-form-panel {
    padding: 18px;
  }
}
</style>
