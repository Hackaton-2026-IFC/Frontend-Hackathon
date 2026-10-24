
<script setup>
import ToastHost from '@/components/ui/ToastHost.vue'
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { RouterView, useRoute } from 'vue-router'

import appHeaderComponent from '@/components/layout/appHeaderComponent.vue'
import appSidebarComponent from '@/components/layout/appSidebarComponent.vue'

import { useAuthStore } from '@/stores/authStore'
import { useTemplateStore } from '@/stores/templateStore'
import { useToastStore } from '@/stores/toastStore'
import AppToast from '@/components/ui/AppToast.vue'

const route = useRoute()
const authStore = useAuthStore()
const templateStore = useTemplateStore()
const toastStore = useToastStore()
</script>

<template>
  <div class="app-shell">
    <ToastHost />
    <AppToast :message="toastStore.message" :type="toastStore.type" :duration="toastStore.duration" :toast-id="toastStore.toastId" @close="toastStore.close()" />
    <RouterView v-if="route.meta.hideHeader" />

    <template v-else>
      <appHeaderComponent />

      <div class="app-layout">
        <appSidebarComponent />

        <main class="page-content">
          <RouterView />
        </main>
      </div>
    </template>

    <ToastNotice
      v-if="authStore.errorMessage && !['login', 'cadastro', 'welcome', 'register'].includes(route.name)"
      :message="authStore.errorMessage"
      type="error"
    />

    <div
      v-if="templateStore.isLoading"
      class="loading-overlay"
      role="status"
      aria-label="Carregando"
      aria-live="polite"
    >
      <span class="loading-spinner"></span>
    </div>
  </div>
</template>

<style>
@import url('/src/assets/css/global.css');
</style>

<style scoped>
/* ========================================
   ESTRUTURA PRINCIPAL
======================================== */

.app-shell {
  --header-height: 76px;

  min-height: 100vh;
  min-height: 100dvh;
}

.app-layout {
  display: flex;
  align-items: stretch;

  min-height: calc(100vh - var(--header-height));
  min-height: calc(100dvh - var(--header-height));

  padding-top: var(--header-height);
}

.page-content {
  flex: 1;
  min-width: 0;

  min-height: calc(100vh - var(--header-height));
  min-height: calc(100dvh - var(--header-height));

  margin-left: 250px;
}

/* ========================================
   MENSAGENS DE ERRO
======================================== */

.app-error {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1100;

  width: max-content;
  max-width: calc(100vw - 32px);

  padding: 12px 16px;

  border: 1px solid #e4a4a4;
  border-radius: 8px;

  background: #fff0f0;
  color: #8b1e1e;

  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
  overflow-wrap: anywhere;
}

/* ========================================
   CARREGAMENTO
======================================== */

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;

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

/* ========================================
   RESPONSIVIDADE
======================================== */

@media (max-width: 700px) {
  .app-shell {
    --header-height: 66px;
  }

  .page-content {
    margin-left: 0;
    padding-bottom: 76px;
  }

  /* A tela de projeto não precisa preencher artificialmente a altura
     disponível: o espaço para a navegação já está no padding inferior. */
  .page-content:has(> .workspace) {
    min-height: 0;
  }

  .app-error {
    right: 12px;
    bottom: 76px;
    left: 12px;

    width: auto;
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
}
</style>
