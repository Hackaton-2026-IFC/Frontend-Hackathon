
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import CadastroForm from '@/components/cadastro/CadastroForm.vue'
import { useRegisterStore } from '@/stores/registerStore.js'

const registerStore = useRegisterStore()
const router = useRouter()

const loading = ref(false)
const error = computed(() => registerStore.errorMessage)

async function handleCadastro(data) {
  loading.value = true

  try {
    const registered = await registerStore.register(data)
    if (!registered || registerStore.errorMessage) return

    await router.push({ name: 'inicio' })
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
