
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
  return authStore.user?.profile_image?.url || null
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
      <span class="header-label">MOMENTUM</span>
      <h1>{{ pageTitle }}</h1>
    </div>

    <RouterLink
      to="/profile"
      class="profile-link"
      aria-label="Abrir meu perfil"
      title="Meu perfil"
    >
      <span class="profile-avatar">
        <img
          v-if="profileImage"
          :src="profileImage"
          :alt="userName"
        />

        <span v-else>
          {{ userName.charAt(0).toUpperCase() }}
        </span>
      </span>

      <span class="profile-name">
        {{ userName }}
      </span>
    </RouterLink>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 250px;
  right: 0;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  height: 76px;
  padding: 12px 32px;

  border-bottom: 1px solid #e9e9e9;
  background: #fff;
}

.header-title {
  min-width: 0;
}

.header-label {
  display: block;
  margin-bottom: 4px;

  color: #737373;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 1.6px;
}

.header-title h1 {
  overflow: hidden;
  margin: 0;

  color: #171717;
  font-size: 18px;
  font-weight: 650;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-link {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 10px;

  min-width: 0;
  max-width: 240px;

  padding: 6px 10px 6px 6px;

  border: 1px solid transparent;
  border-radius: 10px;

  color: #171717;
  text-decoration: none;

  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.profile-link:hover {
  border-color: #e5e5e5;
  background: #f5f5f5;
}

.profile-avatar {
  display: flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;

  width: 36px;
  height: 36px;

  overflow: hidden;

  border-radius: 50%;
  background: #171717;
  color: #fff;

  font-size: 14px;
  font-weight: 700;
}

.profile-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.profile-avatar > span {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.profile-name {
  display: block;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;

  color: #171717;
  font-size: 12px;
  font-weight: 650;

  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .app-header {
    left: 0;
    right: 0;

    height: 66px;
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
    flex-basis: 32px;
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .profile-name {
    font-size: 11px;
  }
}

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

@media (prefers-reduced-motion: reduce) {
  .profile-link {
    transition: none;
  }
}
</style>
