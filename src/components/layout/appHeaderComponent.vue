
<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const route = useRoute()

const userName = computed(() => {
  return authStore.user?.name?.trim() || 'Usuário'
})

const profileImage = computed(() => {
  return authStore.user?.profile_image?.url
})

const pageTitle = computed(() => {
  const titles = {
    home: 'Área de trabalho',
    projects: 'Projetos',
    profile: 'Meu perfil',
    settings: 'Configurações',
  }

  return titles[route.name] || 'Área de trabalho'
})
</script>

<template>
  <header class="app-header">
    <div class="header-title">
      <span class="header-label">HACKATHON WORKSPACE</span>
      <h1>{{ pageTitle }}</h1>
    </div>

    <RouterLink
      to="/profile"
      class="profile-link"
      aria-label="Abrir meu perfil"
      title="Meu perfil"
    >
    <span v-if="profileImage" class="profile-avatar">
      <img :src="profileImage" :alt="userName">
    </span>
      <span v-else class="profile-avatar" aria-hidden="true">
        {{ userName.charAt(0).toUpperCase() }}
      </span>

      <span class="profile-name">
        {{ userName }}
      </span>
    </RouterLink>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 76px;
  padding: 12px 32px;
  border-bottom: 1px solid #e9e9e7;
  background: #fff;
}

.header-title {
  min-width: 0;
}

.header-label {
  display: block;
  margin-bottom: 4px;
  color: #85857e;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.4px;
}

.header-title h1 {
  overflow: hidden;
  margin: 0;
  color: #252523;
  font-size: 18px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Perfil no header */

.profile-link {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 240px;
  padding: 6px 10px 6px 6px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #252523;
  text-decoration: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.profile-link:hover {
  border-color: #e8e8e5;
  background: #f7f7f5;
}

/* Avatar sempre circular */

.profile-avatar {
  display: grid;
  flex: 0 0 36px;
  place-items: center;
  width: 36px;
  height: 36px;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 50%;
  background: #252523;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

/* Nome */

.profile-name {
  display: block;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #252523;
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Tablet e celular */

@media (max-width: 700px) {
  .app-header {
    min-height: 66px;
    padding: 10px 15px;
    gap: 10px;
  }

  .header-label {
    font-size: 9px;
    letter-spacing: 1px;
  }

  .header-title h1 {
    font-size: 15px;
  }

  .profile-link {
    gap: 7px;
    max-width: 45%;
    padding: 4px;
  }

  .profile-avatar {
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    aspect-ratio: 1 / 1;
    font-size: 12px;
  }

  .profile-name {
    font-size: 11px;
  }
}

/* Telas muito estreitas */

@media (max-width: 380px) {
  .app-header {
    gap: 6px;
    padding-right: 10px;
    padding-left: 10px;
  }

  .header-label {
    font-size: 8px;
    letter-spacing: 0.7px;
  }

  .header-title h1 {
    font-size: 14px;
  }

  .profile-link {
    gap: 5px;
    max-width: 44%;
  }

  .profile-avatar {
    flex-basis: 30px;
    width: 30px;
    height: 30px;
  }

  .profile-name {
    font-size: 10px;
  }
}

/* Acessibilidade */

@media (prefers-reduced-motion: reduce) {
  .profile-link {
    transition: none;
  }
}
</style>
