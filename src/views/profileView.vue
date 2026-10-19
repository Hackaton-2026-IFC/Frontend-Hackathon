
<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const userName = computed(() => {
  return authStore.user?.name?.trim() || 'Usuário'
})

const userEmail = computed(() => {
  return authStore.user?.email || 'E-mail não informado'
})

const initials = computed(() => {
  return userName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join('')
})

onMounted(async () => {
  if (!authStore.user?.name || !authStore.user?.email) {
    try {
      await authStore.loadCurrentUser()
    } catch (error) {
      console.error(
        'Não foi possível carregar os dados do perfil.',
        error,
      )
    }
  }
})

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <main class="profile-page">
    <!-- Banner -->
    <section class="profile-banner">
      <div class="profile-banner-decoration" aria-hidden="true">
        <span></span>
        <span></span>
      </div>

      <div class="profile-banner-content">
        <p class="profile-eyebrow">ESPAÇO PESSOAL</p>

        <h1>Seu espaço.</h1>

        <p class="profile-subtitle">
          Gerencie suas informações de forma simples.
        </p>
      </div>
    </section>

    <!-- Identidade: totalmente abaixo do banner -->
    <section class="profile-identity">
      <div
        class="profile-avatar"
        role="img"
        :aria-label="`Avatar de ${userName}`"
      >
        <span>{{ initials || 'U' }}</span>
      </div>

      <div class="profile-identity-info">
        <span class="profile-section-label">SUA CONTA</span>

        <h2>{{ userName }}</h2>

        <p>{{ userEmail }}</p>
      </div>
    </section>

    <div class="profile-divider"></div>

    <!-- Dados pessoais -->
    <section class="profile-details">
      <div class="profile-section-heading">
        <div>
          <span class="profile-section-label">
            INFORMAÇÕES DA CONTA
          </span>

          <h2>Dados pessoais</h2>
        </div>
      </div>

      <div class="profile-details-grid">
        <div class="profile-detail-item">
          <span class="profile-detail-label">Nome completo</span>
          <p class="profile-detail-value">{{ userName }}</p>
        </div>

        <div class="profile-detail-item">
          <span class="profile-detail-label">Endereço de e-mail</span>
          <p class="profile-detail-value">{{ userEmail }}</p>
        </div>
      </div>
    </section>

    <div class="profile-divider"></div>

    <!-- Sessão -->
    <section class="profile-account">
      <div class="profile-account-info">
        <span class="profile-section-label">ACESSO</span>

        <h2>Sessão</h2>

        <p>
          Encerre sua sessão neste dispositivo quando quiser.
        </p>
      </div>

      <button
        class="profile-logout-button"
        type="button"
        @click="handleLogout"
      >
        <span>Sair da conta</span>
        <span class="profile-logout-icon" aria-hidden="true">↗</span>
      </button>
    </section>
  </main>
</template>

<style src="@/assets/css/profile.css"></style>
