<script setup>
import { RouterView, useRoute } from 'vue-router'
import appFooterComponent from './components/layout/appFooterComponent.vue'
import appHeaderComponent from './components/layout/appHeaderComponent.vue'
import { useAuthStore } from './stores/authStore'
import { useTemplateStore } from './stores/templateStore'

const route = useRoute()
const authStore = useAuthStore()
const templateStore = useTemplateStore()
</script>
<template>
  <appHeaderComponent v-if="!route.meta.hideHeader"></appHeaderComponent>

  <main class="page">
    <RouterView> </RouterView>
  </main>

  <appFooterComponent v-if="!route.meta.hideFooter"></appFooterComponent>

  <p
    v-if="
      authStore.errorMessage &&
      route.name !== 'welcome' &&
      route.name !== 'register'
    "
    class="app-error"
    role="alert"
  >
    {{ authStore.errorMessage }}
  </p>

  <div
    v-if="templateStore.isLoading"
    class="loading-overlay"
    role="status"
    aria-label="Carregando"
    aria-live="polite"
  >
    <span class="loading-spinner"></span>
  </div>
</template>
<style>
@import url('/src/assets/css/global.css');
</style>
<style scoped>
.app-error {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 20;
  max-width: min(28rem, calc(100vw - 2rem));
  padding: 0.85rem 1rem;
  border: 1px solid #e4a4a4;
  border-radius: 0.5rem;
  background: #fff0f0;
  color: #8b1e1e;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
}

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgb(80 80 80 / 45%);
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 0.35rem solid rgb(255 255 255 / 60%);
  border-top-color: #555;
  border-radius: 50%;
  animation: loading-spin 0.8s linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
