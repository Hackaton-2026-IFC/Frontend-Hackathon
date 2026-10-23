<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

const navigationItems = [
  { label: 'Tarefas', to: '/tasks', symbol: 'mdi mdi-checkbox-marked-outline' },
  { label: 'Início', to: '/home', symbol: 'mdi mdi-home-outline' },
  { label: 'Projetos', to: '/projects', symbol: 'mdi mdi-list-box-outline' },
  { label: 'Perfil', to: '/profile', symbol: 'mdi mdi-account-outline' },
  { label: 'Configurações', to: '/settings', symbol: 'mdi mdi-cog-outline' },
]

function isActive(item) {
  if (item.to === '/projects') {
    return route.path === '/projects' || route.path.startsWith('/projects/')
  }

  return route.path === item.to
}
</script>

<template>
  <aside class="app-sidebar">
    <RouterLink to="/home" class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">H</span>

      <span class="brand-text">
        <strong>Hackathon</strong>
        <small>Workspace</small>
      </span>
    </RouterLink>

    <div class="sidebar-section">
      <span class="section-label">MENU PRINCIPAL</span>

      <nav class="sidebar-navigation" aria-label="Navegação principal">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="navigation-link"
          :class="{ 'navigation-link-active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <span :class="item.symbol" aria-hidden="true"> </span>

          <span class="navigation-label">
            {{ item.label }}
          </span>
        </RouterLink>
      </nav>
    </div>

    <div class="sidebar-bottom">
      <div class="sidebar-status">
        <span class="status-dot" aria-hidden="true"></span>

        <div>
          <strong>Seu espaço de trabalho</strong>
          <small>Organize suas ideias</small>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 250px;
  height: 100vh;
  height: 100dvh;
  padding: 27px 17px 20px;
  overflow-x: hidden;
  overflow-y: auto;
  background: #171716;
  color: #f8f8f6;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 9px 32px;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: #fff;
  color: #171716;
  font-size: 22px;
  font-weight: 800;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand-text strong {
  font-size: 17px;
  letter-spacing: -0.5px;
}

.brand-text small {
  color: #92928c;
  font-size: 11px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.section-label {
  padding: 0 12px;
  color: #85857e;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.1px;
}

.sidebar-navigation {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.navigation-link {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: #b7b7b0;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.navigation-link:hover {
  background: #252523;
  color: #fff;
}

.navigation-link-active {
  border-color: #3c3c38;
  background: #30302d;
  color: #fff;
}

.mdi {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  font-size: 22px;
  line-height: 1;
}

.navigation-label {
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-bottom {
  margin-top: auto;
  padding-top: 20px;
}

.sidebar-status {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 10px;
  border: 1px solid #30302d;
  border-radius: 11px;
  background: #232321;
}

.status-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 4px;
  border-radius: 50%;
  background: #8dba8b;
}

.sidebar-status div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sidebar-status strong {
  color: #e5e5e0;
  font-size: 11px;
  font-weight: 600;
}

.sidebar-status small {
  color: #96968f;
  font-size: 10px;
}

@media (max-width: 700px) {
  .app-sidebar {
    inset: auto 0 0;
    width: 100%;
    height: auto;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    overflow: visible;
    border-top: 1px solid #353532;
  }

  .sidebar-brand,
  .section-label,
  .sidebar-bottom {
    display: none;
  }

  .sidebar-section {
    width: 100%;
    gap: 0;
  }

  .sidebar-navigation {
    flex-direction: row;
    justify-content: space-around;
    gap: 3px;
    width: 100%;
  }

  .navigation-link {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    min-width: 0;
    min-height: 50px;
    padding: 5px 2px;
    border-radius: 9px;
  }

  .navigation-symbol {
    width: auto;
    font-size: 20px;
  }

  .navigation-label {
    max-width: 100%;
    font-size: 10px;
    text-align: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .navigation-link {
    transition: none;
  }
}
</style>
