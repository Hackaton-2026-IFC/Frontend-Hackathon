
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import ProfileEditModal from '@/components/ui/ProfileEditModal.vue'
import AppToast from '@/components/ui/AppToast.vue'

const authStore = useAuthStore()

const modalAberto = ref(false)
const salvando = ref(false)

const mensagemFoto = ref('')
const tipoMensagem = ref('success')

const userName = computed(() =>
  authStore.user?.name?.trim() || 'Usuário'
)

const username = computed(() =>
  authStore.user?.username || 'Não informado'
)

const userEmail = computed(() =>
  authStore.user?.email || 'E-mail não informado'
)

const fotoExibida = computed(() =>
  authStore.user?.profile_image?.url || null
)

const initials = computed(() =>
  userName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join('')
)

function fecharModal() {
  if (!salvando.value) {
    modalAberto.value = false
  }
}

function mostrarNotificacao(message, type = 'success') {
  mensagemFoto.value = ''
  tipoMensagem.value = type

  setTimeout(() => {
    mensagemFoto.value = message
  }, 0)
}

async function confirmarMudancas({
  name,
  username: newUsername,
  file,
  removePhoto,
}) {
  salvando.value = true

  try {
    const userId = authStore.user?.id ?? authStore.user?.user_id

    if (!userId) {
      throw new Error('Não foi possível identificar o usuário.')
    }

    const changes = {}

    if (name !== null && name !== undefined) {
      changes.name = name
    }

    if (newUsername !== null && newUsername !== undefined) {
      changes.username = newUsername
    }

    const changedName = 'name' in changes
    const changedUsername = 'username' in changes
    const changedPhoto = !!file || removePhoto

    if (Object.keys(changes).length > 0) {
      await authStore.updateUserAccount(userId, changes)
    }

    if (removePhoto) {
      await authStore.updateUserAccount(userId, {
        profile_image_attachment_key: null,
      })
    } else if (file) {
      await authStore.uploadProfileImage(file)
    }

    await authStore.loadCurrentUser()

    modalAberto.value = false

    const changedCount =
      Number(changedName) +
      Number(changedUsername) +
      Number(changedPhoto)

    if (changedCount > 1) {
      mostrarNotificacao('Perfil atualizado com sucesso!')
    } else if (changedName) {
      mostrarNotificacao('Nome completo atualizado com sucesso!')
    } else if (changedUsername) {
      mostrarNotificacao('Nome de usuário atualizado com sucesso!')
    } else if (removePhoto) {
      mostrarNotificacao('Foto de perfil removida com sucesso!')
    } else if (file) {
      mostrarNotificacao('Foto de perfil atualizada com sucesso!')
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)

    mostrarNotificacao(
      authStore.errorMessage ||
        error?.message ||
        'Não foi possível salvar as alterações.',
      'error'
    )
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  try {
    await authStore.loadCurrentUser()
  } catch (error) {
    console.error('Erro ao carregar perfil:', error)
  }
})

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <main class="profile-page">
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

    <section class="profile-identity">
      <div class="profile-photo-wrapper">
        <div class="profile-avatar">
          <img
            v-if="fotoExibida"
            class="profile-image"
            :src="fotoExibida"
            :alt="userName"
          />

          <span v-else>{{ initials || 'U' }}</span>
        </div>
      </div>

      <div class="profile-identity-info">
        <span class="profile-section-label">SUA CONTA</span>
        <h2>{{ userName }}</h2>
        <p>@{{ username }}</p>
      </div>
    </section>

    <div class="profile-divider"></div>

    <section class="profile-details">
      <div class="profile-section-heading">
        <div>
          <span class="profile-section-label">
            INFORMAÇÕES DA CONTA
          </span>
          <h2>Dados pessoais</h2>
        </div>

        <button
          class="profile-edit-button"
          type="button"
          @click="modalAberto = true"
        >
          <span
            class="mdi mdi-pencil-outline"
            aria-hidden="true"
          ></span>
          Editar perfil
        </button>
      </div>

      <div class="profile-details-grid">
        <div class="profile-detail-item">
          <span class="profile-detail-label">Nome completo</span>
          <p class="profile-detail-value">{{ userName }}</p>
        </div>

        <div class="profile-detail-item">
          <span class="profile-detail-label">Nome de usuário</span>
          <p class="profile-detail-value">{{ username }}</p>
        </div>

        <div class="profile-detail-item">
          <span class="profile-detail-label">Endereço de e-mail</span>
          <p class="profile-detail-value">{{ userEmail }}</p>
        </div>
      </div>
    </section>

    <div class="profile-divider"></div>

    <section class="profile-account">
      <div class="profile-account-info">
        <span class="profile-section-label">ACESSO</span>
        <h2>Sessão</h2>
        <p>Encerre sua sessão neste dispositivo quando quiser.</p>
      </div>

      <button
        class="profile-logout-button"
        type="button"
        @click="handleLogout"
      >
        <span>Sair da conta</span>

        <span class="profile-logout-icon" aria-hidden="true">
          <span class="mdi mdi-arrow-top-right"></span>
        </span>
      </button>
    </section>

    <ProfileEditModal
      :open="modalAberto"
      :loading="salvando"
      :current-photo="fotoExibida"
      :current-name="authStore.user?.name || ''"
      :current-username="authStore.user?.username || ''"
      @close="fecharModal"
      @confirm="confirmarMudancas"
    />

    <AppToast
      :message="mensagemFoto"
      :type="tipoMensagem"
      :duration="5000"
      @close="mensagemFoto = ''"
    />
  </main>
</template>

<style src="@/assets/css/profile.css"></style>
