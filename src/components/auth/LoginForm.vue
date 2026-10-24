
<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { reactive } from 'vue'
import AuthInput from '@/components/shared/AuthInput.vue'

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  message: { type: String, default: '' },
})

const emit = defineEmits(['submit'])

const form = reactive({
  email: '',
  password: '',
})

function onSubmit() {
  emit('submit', { ...form })
}
</script>

<template>
  <section class="form-content">
    <header class="form-header">
      <h1>Bem-vindo de volta!</h1>
      <p>Acesse sua conta agora mesmo.</p>
    </header>

    <form class="form-fields" @submit.prevent="onSubmit">
      <AuthInput
        v-model="form.email"
        icon="mail"
        type="email"
        placeholder="Email"
        autocomplete="email"
        required
      />

      <AuthInput
        v-model="form.password"
        icon="lock"
        type="password"
        placeholder="Senha"
        autocomplete="current-password"
        required
      />

      <ToastNotice v-if="error" :message="error" type="error" />

      <ToastNotice v-else-if="message" :message="message" type="success" />

      <button type="submit" :disabled="loading" class="submit-button">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.form-content {
  width: 100%;
  max-width: 440px;
  min-width: 0;
  box-sizing: border-box;
}

.form-header {
  margin-bottom: 28px;
  text-align: center;
}

.form-header h1 {
  margin: 0;
  color: #111;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
}

.form-header p {
  margin: 8px 0 0;
  color: #555;
  font-size: 14px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.form-error,
.form-message {
  margin: 0;
  font-size: 13px;
  text-align: center;
  overflow-wrap: anywhere;
}

.form-error {
  color: #dc2626;
}

.form-message {
  color: #15803d;
}

.submit-button {
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
  border: 0;
  border-radius: 999px;
  background: #171717;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-button:hover {
  background: #383838;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-height: 760px) and (min-width: 768px) {
  .form-header {
    margin-bottom: 18px;
  }

  .form-header h1 {
    font-size: 25px;
  }

  .form-fields {
    gap: 14px;
  }
}
</style>
