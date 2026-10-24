<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NotificationBell from '@/components/layout/NotificationBell.vue'

const route = useRoute()

const pageTitle = computed(() => {
  const titles = {
    '/': 'Início',
    '/home': 'Início',
    '/projects': 'Projetos',
    '/tasks': 'Tarefas',
    '/notes': 'Notas',
    '/profile': 'Perfil',
    '/settings': 'Configurações',
  }

  const path = route.path.replace(/\/+$/, '') || '/'

  if (titles[path]) {
    return titles[path]
  }

  if (route.name === 'project-tasks') {
    return 'Tarefas do projeto'
  }

  if (route.name === 'task-view') {
    return 'Detalhes da tarefa'
  }

  if (path.startsWith('/projects/')) {
    return 'Projetos'
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

      <NotificationBell />
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
