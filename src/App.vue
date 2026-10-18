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
    v-if="authStore.errorMessage && route.name !== 'welcome'"
    class="app-error"
    role="alert"
  >
    {{ authStore.errorMessage }}
  </p>

  <div v-if="templateStore.isLoading" class="loading-overlay" role="status" aria-live="polite">
    <span class="loading-dots" aria-label="Carregando">
      <span></span>
      <span></span>
      <span></span>
    </span>
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

.loading-dots {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 1rem 1.25rem;
  border-radius: 999px;
  background: rgb(235 235 235 / 88%);
}

.loading-dots span {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #555;
  animation: dot-bounce 0.7s ease-in-out infinite alternate;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes dot-bounce {
  to {
    transform: translateY(-0.65rem);
  }
}
</style>
