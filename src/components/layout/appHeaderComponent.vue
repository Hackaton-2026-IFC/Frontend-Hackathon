
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => {
  return authStore.user?.name?.trim() || 'Usuário'
})

const firstName = computed(() => {
  return userName.value.split(/\s+/)[0]
})

const userPhoto = computed(() => {
  return authStore.user?.profile_image?.url || null
})

const initials = computed(() => {
  return firstName.value.charAt(0).toUpperCase()
})

const pageTitle = computed(() => {
  const titles = {
    '/': 'Início',
    '/home': 'Início',
    '/projects': 'Projetos',
    '/profile': 'Perfil',
    '/settings': 'Configurações',
    '/projetos': 'Projetos',
    '/perfil': 'Perfil',
    '/configuracoes': 'Configurações',
  }

  const path = route.path.replace(/\/+$/, '') || '/'

  if (titles[path]) {
    return titles[path]
  }

  if (path.startsWith('/projects/')) {
    return 'Projetos'
  }

  if (route.meta?.title) {
    return String(route.meta.title)
  }

  return 'Página'
})

function goToProfile() {
  router.push('/profile')
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <!-- DESKTOP -->
      <div class="header-page desktop-header-title">
        <span class="header-brand">MOMENTUM</span>
        <h1 class="header-page-title">{{ pageTitle }}</h1>
      </div>

      <!-- MOBILE -->
      <div class="mobile-header-title">
        <img
          src="/icons/momentum-192x192.png"
          alt=""
          class="mobile-logo"
        />

        <span class="mobile-brand-name">Momentum</span>

        <span class="mobile-separator" aria-hidden="true">/</span>

        <span class="mobile-page-name">
          {{ pageTitle }}
        </span>
      </div>

      <!-- PERFIL -->
      <button
        type="button"
        class="header-profile"
        aria-label="Abrir perfil"
        @click="goToProfile"
      >
        <div class="header-avatar">
          <img
            v-if="userPhoto"
            :src="userPhoto"
            :alt="`Foto de ${firstName}`"
          />

          <span v-else>{{ initials }}</span>
        </div>

        <span class="header-user-name">
          {{ firstName }}
        </span>
      </button>
    </div>
  </header>
</template>

<style scoped>
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

  width: 100%;
  height: 100%;

  padding: 0 32px;
  gap: 16px;
}

.header-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;

  min-width: 0;
}

.header-brand {
  color: #888888;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
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

.mobile-header-title {
  display: none;
}

.header-profile {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  min-width: 0;
  flex-shrink: 0;

  padding: 5px;

  border: none;
  border-radius: 10px;

  background: transparent;
  cursor: pointer;

  transition: background 0.2s ease;
}

.header-profile:hover {
  background: #f5f5f5;
}

.header-user-name {
  color: #171717;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
}

.header-avatar {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 38px;
  height: 38px;
  flex-shrink: 0;

  overflow: hidden;

  border: 1px solid #eaeaea;
  border-radius: 50%;

  background: #f0f0f0;
  color: #333333;

  font-size: 15px;
  font-weight: 700;
}

.header-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
    gap: 10px;
  }

  .desktop-header-title {
    display: none;
  }

  .mobile-header-title {
    display: flex;
    align-items: center;
    gap: 7px;

    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .mobile-logo {
    width: 32px;
    height: 32px;
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
    color: #777770;
    font-size: 18px;
    font-weight: 300;
    margin: 0 1px;
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

  .header-profile {
    gap: 0;
    padding: 2px;
  }

  .header-profile:hover {
    background: #30302d;
  }

  .header-avatar {
    width: 38px;
    height: 38px;

    border: 1px solid #454540;
    background: #30302d;
    color: #ffffff;
  }

  .header-user-name {
    display: none;
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
    width: 28px;
    height: 28px;
  }

  .mobile-brand-name {
    font-size: 13px;
  }

  .mobile-page-name {
    font-size: 12px;
  }
}
</style>
