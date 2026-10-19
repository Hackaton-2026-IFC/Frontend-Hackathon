<script setup>
import { onMounted, ref } from 'vue'
import { useRegisterStore } from '@/stores/registerStore'
import { useTemplateStore } from '@/stores/templateStore'

const registerStore = useRegisterStore()
const templateStore = useTemplateStore()

const name = ref('')
const email = ref('')
const password = ref('')
const registrationComplete = ref(false)

onMounted(() => {
  registerStore.clearError()
})

async function handleRegister() {
  registrationComplete.value = await registerStore.register({
    name: name.value.trim(),
    email: email.value,
    password: password.value,
  })
}
</script>

<template>
  <h1>Cadastro</h1>

  <template v-if="registrationComplete">
    <p role="status">Cadastro realizado com sucesso.</p>
    <RouterLink :to="{ name: 'welcome' }">Voltar para o login</RouterLink>
  </template>

  <form v-else @submit.prevent="handleRegister">
    <label for="register-name">Nome completo</label>
    <input
      id="register-name"
      v-model="name"
      type="text"
      autocomplete="name"
      required
    />

    <label for="register-email">E-mail</label>
    <input
      id="register-email"
      v-model="email"
      type="email"
      autocomplete="email"
      required
    />

    <label for="register-password">Senha (mínimo de 8 caracteres)</label>
    <input
      id="register-password"
      v-model="password"
      type="password"
      autocomplete="new-password"
      minlength="8"
      required
    />

    <button type="submit" :disabled="templateStore.isLoading">
      Criar conta
    </button>
  </form>

  <p v-if="registerStore.errorMessage" role="alert">
    {{ registerStore.errorMessage }}
  </p>

  <p v-if="!registrationComplete">
    Já tem uma conta?
    <RouterLink :to="{ name: 'welcome' }">Entrar</RouterLink>
  </p>
</template>
