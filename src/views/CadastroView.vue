
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CadastroForm from '@/components/cadastro/CadastroForm.vue'
import { useAuthStore } from '@/stores/authStore.js'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')

async function handleCadastro(data) {
  loading.value = true
  error.value = ''

  try {
    await auth.register(data)
    await router.push({
      name: 'login',
      query: { cadastro: 'ok' },
    })
  } catch (e) {
    error.value = e.message
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
