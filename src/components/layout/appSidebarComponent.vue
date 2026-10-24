<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const userName = computed(() => {
  return user.value?.name?.trim() || 'Usuário'
})

const userUsername = computed(() => {
  return user.value?.username || ''
})

const userPhoto = computed(() => {
  return user.value?.profile_image?.url || null
})

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase()
})

const navigationItems = [
  {
    label: 'Início',
    to: '/home',
    symbol: 'mdi mdi-home-outline',
  },
  {
    label: 'Projetos',
    to: '/projects',
    symbol: 'mdi mdi-list-box-outline',
  },
  {
    label: 'Notas',
    to: '/notes',
    symbol: 'mdi mdi-note-multiple-outline',
  },
  {
    label: 'Configurações',
    to: '/settings',
    symbol: 'mdi mdi-cog-outline',
  },
  {
    label: 'Perfil',
    to: '/profile',
    symbol: 'mdi mdi-account-outline',
  },
]

function isActive(item) {
  if (item.to === '/projects') {
    return route.path === '/projects' ||
      route.path.startsWith('/projects/') ||
      route.name === 'task-view'
  }

  return route.path === item.to
}
</script>

<template>
  <aside class="app-sidebar">
    <!-- LOGO -->
    <RouterLink to="/home" class="sidebar-brand">
      <img
        src="/icons/momentum-192x192.png"
        alt="Logo Momentum"
        class="brand-mark"
      />

      <span class="brand-text">
        <strong>Momentum</strong>
      </span>
    </RouterLink>

    <!-- MENU -->
    <div class="sidebar-section">
      <span class="section-label">
        MENU PRINCIPAL
      </span>

      <nav
        class="sidebar-navigation"
        aria-label="Navegação principal"
      >
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="navigation-link"
          :class="{
            'navigation-link-active': isActive(item),
            'navigation-profile-link': item.to === '/profile'
          }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <!-- FOTO DE PERFIL -->
          <template v-if="item.to === '/profile'">
            <img
              v-if="userPhoto"
              :src="userPhoto"
              alt=""
              class="navigation-avatar"
            />

            <span
              v-else
              class="mdi mdi-account-outline"
              aria-hidden="true"
            ></span>
          </template>

          <!-- OUTROS ÍCONES -->
          <span
            v-else
            :class="item.symbol"
            aria-hidden="true"
          ></span>

          <span class="navigation-label">
            {{ item.label }}
          </span>
        </RouterLink>
      </nav>
    </div>

    <!-- PERFIL NO RODAPÉ -->
    <div class="sidebar-bottom">
      <RouterLink
        to="/profile"
        class="sidebar-user"
        :class="{ 'sidebar-user-active': route.path === '/profile' }"
        aria-label="Abrir meu perfil"
      >
        <div class="sidebar-user-avatar">
          <img
            v-if="userPhoto"
            :src="userPhoto"
            :alt="`Foto de ${userName}`"
          />

          <span v-else>
            {{ userInitial }}
          </span>
        </div>

        <div class="sidebar-user-info">
          <strong>{{ userName }}</strong>

          <small v-if="userUsername">
            @{{ userUsername }}
          </small>

          <small v-else>
            Meu perfil
          </small>
        </div>

        <span
          class="mdi mdi-chevron-right sidebar-user-arrow"
          aria-hidden="true"
        ></span>
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
/* SIDEBAR */

.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1100;

  display: flex;
  flex-direction: column;

  width: 250px;
  height: 100vh;
  height: 100dvh;

  padding: 0 17px 20px;

  overflow-x: hidden;
  overflow-y: auto;

  background: #171716;
  color: #f8f8f6;
}

/* LOGO ALINHADA AO HEADER */

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;

  height: 76px;
  min-height: 76px;

  padding: 0 5px;
  margin-bottom: 32px;

  color: inherit;
  text-decoration: none;
}

.brand-mark {
  display: block;
  flex-shrink: 0;

  width: 60px;
  height: 60px;

  object-fit: contain;
  border-radius: 12px;
}

.brand-text {
  display: flex;
  align-items: center;
  min-width: 0;
}

.brand-text strong {
  color: #ffffff;
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.7px;
}

/* MENU */

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
    background-color 0.2s ease,
    color 0.2s ease;
}

.navigation-link:hover {
  background: #252523;
  color: #ffffff;
}

.navigation-link-active {
  border-color: #3c3c38;
  background: #30302d;
  color: #ffffff;
}

/* ÍCONES */

.mdi {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  width: 22px;

  font-size: 22px;
  line-height: 1;
}

/* FOTO DO MENU */

.navigation-avatar {
  display: block;
  flex-shrink: 0;

  width: 24px;
  height: 24px;

  border: 1px solid #555555;
  border-radius: 50%;

  object-fit: cover;
}

/* TEXTO DOS LINKS */

.navigation-label {
  overflow: hidden;

  font-size: 13px;
  font-weight: 500;

  text-overflow: ellipsis;
  white-space: nowrap;
}

/* PERFIL DO RODAPÉ */

.sidebar-bottom {
  margin-top: auto;
  padding-top: 20px;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 11px;

  width: 100%;
  min-height: 68px;

  padding: 11px 10px;

  border: 1px solid #30302d;
  border-radius: 11px;

  background: #232321;
  color: #ffffff;
  text-decoration: none;

  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.sidebar-user:hover {
  background: #2c2c29;
  border-color: #454540;
}

.sidebar-user-active {
  background: #30302d;
  border-color: #454540;
}

.sidebar-user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 38px;
  height: 38px;
  flex-shrink: 0;

  overflow: hidden;

  border: 1px solid #454540;
  border-radius: 50%;

  background: #3a3a36;
  color: #ffffff;

  font-size: 15px;
  font-weight: 700;
}

.sidebar-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-user-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;

  min-width: 0;
}

.sidebar-user-info strong {
  overflow: hidden;

  color: #f4f4f0;
  font-size: 12px;
  font-weight: 650;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-user-info small {
  overflow: hidden;

  color: #96968f;
  font-size: 10px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-user-arrow {
  width: auto;
  flex-shrink: 0;

  color: #85857e;
  font-size: 18px;
}

/* PERFIL SOMENTE NO RODAPÉ DO DESKTOP */

@media (min-width: 701px) {
  .navigation-profile-link {
    display: none;
  }
}

/* MOBILE */

@media (max-width: 700px) {
  .app-sidebar {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;

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

  .navigation-link .mdi {
    width: auto;
    font-size: 20px;
  }

  .navigation-avatar {
    width: 24px;
    height: 24px;
  }

  .navigation-label {
    max-width: 100%;
    font-size: 10px;
    text-align: center;
  }
}

/* ACESSIBILIDADE */

@media (prefers-reduced-motion: reduce) {
  .navigation-link,
  .sidebar-user {
    transition: none;
  }
}
</style>
