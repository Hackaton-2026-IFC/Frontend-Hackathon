
<script setup>
import { computed, reactive, ref } from 'vue'
import AuthInput from '@/components/shared/AuthInput.vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['submit'])

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const localError = ref('')

const shownError = computed(() => localError.value || props.error)

function onSubmit() {
  if (form.password !== form.confirmPassword) {
    localError.value = 'As senhas não coincidem.'
    return
  }

  localError.value = ''

  emit('submit', {
    name: form.name,
    email: form.email,
    password: form.password,
  })
}
</script>

<template>
  <section class="form-content">
    <header class="form-header">
      <h1>Crie sua conta!</h1>
      <p>Preencha seus dados</p>
    </header>

    <form class="form-fields" @submit.prevent="onSubmit">
      <AuthInput
        v-model="form.name"
        icon="user"
        placeholder="Nome"
        autocomplete="name"
        required
      />

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
        autocomplete="new-password"
        required
      />

      <AuthInput
        v-model="form.confirmPassword"
        icon="lock"
        type="password"
        placeholder="Confirmar senha"
        autocomplete="new-password"
        required
      />

      <p v-if="shownError" class="form-error" role="alert">
        {{ shownError }}
      </p>

      <button type="submit" :disabled="loading" class="submit-button">
        {{ loading ? 'Cadastrando...' : 'Cadastrar' }}
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
  text-align: center;
  margin-bottom: 28px;
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

.form-error {
  margin: 0;
  color: #dc2626;
  font-size: 13px;
  text-align: center;
  overflow-wrap: anywhere;
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
    gap: 12px;
  }
}
</style>
