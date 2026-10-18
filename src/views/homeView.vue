<script setup>
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore()
</script>
<template>
<h1>Bem vindo {{ authStore.user.name }}</h1>

<button @click="authStore.logout()">Log-out</button>
</template>