<script setup>
import { computed, onMounted, onBeforeUnmount, watch, ref } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const notifications = useNotificationStore()
const auth = useAuthStore()
const ringing = ref(false)
let shakeTimeout = null
watch(() => notifications.unreadCount, (count, previous) => {
  if (!notifications.loaded || count <= (previous ?? 0)) return
  ringing.value = false
  requestAnimationFrame(() => { ringing.value = true })
  clearTimeout(shakeTimeout)
  shakeTimeout = setTimeout(() => { ringing.value = false }, 1000)
})
watch(() => auth.isAuthenticated, (active) => {
  if (active) notifications.startPolling()
  else { notifications.stopPolling(); notifications.refresh() }
})
onMounted(() => { if (auth.isAuthenticated) notifications.startPolling() })
onBeforeUnmount(() => { notifications.stopPolling(); clearTimeout(shakeTimeout) })

const pageTitle = computed(() => {
  const titles = {
    '/': 'Início',
    '/home': 'Início',
    '/projects': 'Projetos',
    '/tasks': 'Tarefas',
    '/notes': 'Notas',
    '/profile': 'Perfil',
    '/settings': 'Configurações',
    '/notifications': 'Notificações',
  }

  const path = route.path.replace(/\/+$/, '') || '/'

  if (titles[path]) {
    return titles[path]
  }

  if (route.name === 'project-tasks') {
    return 'Tarefas do projeto'
  }

  if (path.startsWith('/projects/')) {
    return 'Projetos'
  }

  if (path.startsWith('/tasks/')) {
    return 'Detalhes da tarefa'
  }

  return String(route.meta?.title || route.name || 'Página')
})
</script>

<template>
  <header class="app-header">
    <div class="header-content">

      <!-- DESKTOP -->
      <div class="desktop-header-title">
        <h1 class="header-page-title">
          {{ pageTitle }}
        </h1>
      </div>

      <!-- MOBILE -->
      <div class="mobile-header-title">
        <img
          src="/icons/momentum-192x192.png"
          alt=""
          class="mobile-logo"
        />

        <span class="mobile-brand-name">
          Momentum
        </span>

        <span class="mobile-separator" aria-hidden="true">
          /
        </span>

        <span class="mobile-page-name">
          {{ pageTitle }}
        </span>
      </div>

      <!-- SINO: ABRE DIRETAMENTE A VIEW -->
      <RouterLink
        to="/notifications"
        class="notification-button"
        :class="{ 'notification-button--ringing': ringing }"
        :aria-label="'Abrir notificações: ' + notifications.unreadCount + ' convites pendentes'"
        title="Notificações"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        <span v-if="notifications.unreadCount > 0" class="notification-badge" aria-hidden="true">{{ notifications.unreadCount > 99 ? '99+' : notifications.unreadCount }}</span>
      </RouterLink>

    </div>
  </header>
</template>

<style scoped>
/* HEADER DESKTOP */

.app-header {
  position: fixed;
  top: 0;
  left: 250px;
  right: 0;
  z-index: 1000;

  height: 76px;

  background: #ffffff;
  border-bottom: 1px solid #eaeaea;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;

  width: 100%;
  height: 100%;

  padding: 0 32px;
}

.desktop-header-title {
  display: flex;
  align-items: center;
  min-width: 0;
}

.header-page-title {
  margin: 0;

  color: #171717;
  font-size: 20px;
  font-weight: 650;
  line-height: 1.2;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* BOTÃO DE NOTIFICAÇÕES */

.notification-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 40px;
  height: 40px;

  border-radius: 10px;
  color: #555;
  text-decoration: none;

  transition:
    background 0.2s,
    color 0.2s;
}

.notification-button:hover {
  background: #f2f2f2;
  color: #171717;
}

.notification-button.router-link-active {
  background: #f0f0f0;
  color: #171717;
}

.notification-button{position:relative}
.notification-badge{position:absolute;top:-3px;right:-6px;display:grid;place-items:center;min-width:19px;height:19px;padding:0 4px;border:2px solid #fff;border-radius:999px;background:#e02020;color:#fff;font-size:10px;font-weight:800;line-height:1}
.notification-button--ringing svg{transform-origin:50% 12%;animation:bell-ring .9s ease-in-out}
@keyframes bell-ring{0%,100%{transform:rotate(0)}15%,45%{transform:rotate(17deg)}30%,60%{transform:rotate(-17deg)}75%{transform:rotate(7deg)}}
@media(max-width:700px){.notification-badge{border-color:#171716}}
@media(prefers-reduced-motion:reduce){.notification-button--ringing svg{animation:none}}
/* MOBILE OCULTO NO DESKTOP */

.mobile-header-title {
  display: none;
}

/* MOBILE */

@media (max-width: 700px) {
  .app-header {
    left: 0;
    height: 62px;

    background: #171716;
    border-bottom: 1px solid #353532;
  }

  .header-content {
    padding: 0 14px;
  }

  .desktop-header-title {
    display: none;
  }

  .mobile-header-title {
    display: flex;
    align-items: center;
    gap: 7px;

    flex: 1;
    width: auto;
    min-width: 0;

    overflow: hidden;
  }

  .mobile-logo {
    width: 44px;
    height: 44px;
    flex-shrink: 0;

    object-fit: contain;
  }

  .mobile-brand-name {
    color: #ffffff;
    font-size: 15px;
    font-weight: 750;
    letter-spacing: -0.5px;
    white-space: nowrap;
  }

  .mobile-separator {
    margin: 0 1px;

    color: #777770;
    font-size: 18px;
    font-weight: 300;
  }

  .mobile-page-name {
    min-width: 0;

    color: #c9c9c4;
    font-size: 13px;
    font-weight: 500;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notification-button {
    color: #ffffff;
  }

  .notification-button:hover,
  .notification-button.router-link-active {
    background: #353532;
    color: #ffffff;
  }
}

@media (max-width: 360px) {
  .header-content {
    padding: 0 10px;
  }

  .mobile-header-title {
    gap: 5px;
  }

  .mobile-logo {
    width: 40px;
    height: 40px;
  }

  .mobile-brand-name {
    font-size: 13px;
  }

  .mobile-page-name {
    font-size: 12px;
  }
}
</style>