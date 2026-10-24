
<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import projectsApi from '@/api/projectsApi'
import usersApi from '@/api/usersApi'
import invitesApi from '@/api/invitesApi'
import api from '@/api/config'

const props = defineProps({
  project: { type: Object, required: true },
})

const emit = defineEmits(['invite-sent'])
const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()

const currentUserId = computed(
  () => authStore.user?.id ?? authStore.user?.user_id ?? null,
)

const members = ref([])
const loadingMembers = ref(false)
const savingRoleId = ref(null)
const removingMemberId = ref(null)

const roleOptions = [
  { value: 'member', label: 'Membro' },
  { value: 'admin', label: 'Administrador' },
]

function getErrorMessage(error, fallback) {
  const data = error?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data && typeof data === 'object') {
    const messages = Object.values(data)
      .flat(Infinity)
      .filter(item => item !== null && item !== undefined)
      .map(item =>
        typeof item === 'string' ? item : JSON.stringify(item),
      )

    if (messages.length) return messages.join(' ')
  }

  return fallback
}

function listFrom(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.membros)) return data.membros
  if (Array.isArray(data?.participantes)) return data.participantes
  return []
}

function getProfileImage(user) {
  const image = user?.profile_image

  if (typeof image === 'string') return image

  return (
    image?.url ||
    user?.profile_image_url ||
    user?.google_photo_url ||
    null
  )
}

function normalizeMember(item) {
  const raw =
    item.usuario_detalhes ||
    item.user_details ||
    item.usuario ||
    item.user ||
    {}

  const user =
    typeof raw === 'object' && raw !== null ? raw : {}

  const userId =
    user.id ??
    (typeof item.usuario === 'number' ||
    typeof item.usuario === 'string'
      ? item.usuario
      : item.usuario?.id) ??
    item.usuario_id ??
    item.user_id ??
    (typeof raw !== 'object' ? raw : null)

  return {
    ...item,
    userId,
    membershipId: item.id,
    name:
      user.name ||
      user.nome ||
      user.username ||
      item.name ||
      item.nome ||
      item.username ||
      `Usuário #${userId ?? item.id}`,
    username: user.username || item.username || '',
    role: item.cargo || item.role || 'member',
    profileImage: getProfileImage(user),
  }
}

async function loadMembers() {
  const projectId = props.project?.id

  if (!projectId) {
    members.value = []
    return
  }

  loadingMembers.value = true

  try {
    const response = await projectsApi.members(projectId)

    if (String(props.project?.id) !== String(projectId)) {
      return
    }

    members.value = listFrom(response.data).map(normalizeMember)
  } catch (error) {
    console.error('Erro ao carregar membros:', error)
    toast.error(
      getErrorMessage(error, 'Não foi possível carregar os membros.'),
    )
  } finally {
    if (String(props.project?.id) === String(projectId)) {
      loadingMembers.value = false
    }
  }
}

watch(
  () => props.project?.id,
  loadMembers,
  { immediate: true },
)

// ==========================================
// PERMISSÕES
// ==========================================

const currentMember = computed(() => {
  if (currentUserId.value == null) return null

  return members.value.find(
    member => String(member.userId) === String(currentUserId.value),
  ) || null
})

const currentRole = computed(
  () => currentMember.value?.role || null,
)

const isOwner = computed(() => currentRole.value === 'owner')
const isAdmin = computed(() => currentRole.value === 'admin')

const canLeaveProject = computed(
  () => currentMember.value !== null && !isOwner.value,
)

function getRoleLabel(role) {
  return {
    owner: 'Proprietário',
    admin: 'Administrador',
    member: 'Membro',
  }[role] || role
}

function canChangeRole(member) {
  return isOwner.value && member.role !== 'owner'
}

function canRemoveMember(member) {
  if (!currentMember.value) return false
  if (member.role === 'owner') return false

  if (String(member.userId) === String(currentUserId.value)) {
    return false
  }

  if (isOwner.value) return true

  return isAdmin.value && member.role === 'member'
}

// ==========================================
// ALTERAR CARGO
// ==========================================

async function changeRole(member, event) {
  const newRole = event.target.value
  const oldRole = member.role

  if (newRole === oldRole) return

  if (!canChangeRole(member)) {
    toast.error('Você não tem permissão para alterar este cargo.')
    event.target.value = oldRole
    return
  }

  if (member.userId == null) {
    toast.error('Não foi possível identificar o usuário.')
    event.target.value = oldRole
    return
  }

  savingRoleId.value = member.userId

  try {
    await api.patch(
      `projetos/${props.project.id}/membros/${member.userId}/cargo/`,
      { cargo: newRole },
    )

    member.role = newRole

    toast.success(
      `Cargo de ${member.name} alterado para ${getRoleLabel(newRole)}.`,
    )

    await loadMembers()
  } catch (error) {
    console.error('Erro ao alterar cargo:', error)

    toast.error(
      getErrorMessage(error, 'Não foi possível alterar o cargo.'),
    )

    member.role = oldRole
    event.target.value = oldRole
  } finally {
    savingRoleId.value = null
  }
}

// ==========================================
// REMOVER MEMBRO
// ==========================================

async function removeMember(member) {
  if (!canRemoveMember(member)) {
    toast.error('Você não tem permissão para remover este participante.')
    return
  }

  if (member.userId == null) {
    toast.error('Não foi possível identificar o usuário.')
    return
  }

  const confirmed = window.confirm(
    `Tem certeza que deseja remover ${member.name} do projeto?`,
  )

  if (!confirmed) return

  removingMemberId.value = member.userId

  try {
    await api.delete(
      `projetos/${props.project.id}/membros/${member.userId}/`,
    )

    toast.success(`${member.name} foi removido do projeto.`)
    await loadMembers()
  } catch (error) {
    console.error('Erro ao remover membro:', error)

    toast.error(
      getErrorMessage(error, 'Não foi possível remover o membro.'),
    )
  } finally {
    removingMemberId.value = null
  }
}

// ==========================================
// SAIR DO PROJETO
// ==========================================

async function leaveProject() {
  if (!canLeaveProject.value) {
    toast.error(
      'O proprietário precisa transferir a propriedade antes de sair.',
    )
    return
  }

  const confirmed = window.confirm(
    'Tem certeza que deseja sair deste projeto? Você perderá o acesso às atividades dele.',
  )

  if (!confirmed) return

  removingMemberId.value = currentUserId.value

  try {
    await api.delete(
      `projetos/${props.project.id}/membros/${currentUserId.value}/`,
    )

    toast.success('Você saiu do projeto com sucesso.')
    await router.push('/projects')
  } catch (error) {
    console.error('Erro ao sair do projeto:', error)

    toast.error(
      getErrorMessage(error, 'Não foi possível sair do projeto.'),
    )
  } finally {
    removingMemberId.value = null
  }
}

// ==========================================
// CONVITES
// ==========================================

const showModal = ref(false)
const search = ref('')
const users = ref([])
const selectedUser = ref(null)
const searching = ref(false)
const sending = ref(false)

let searchTimer = null
let searchRequest = 0

watch(search, value => {
  clearTimeout(searchTimer)
  searchRequest++

  users.value = []
  selectedUser.value = null

  const term = value.trim()

  if (term.length < 2) {
    searching.value = false
    return
  }

  searching.value = true
  const requestId = searchRequest

  searchTimer = setTimeout(async () => {
    try {
      const response = await usersApi.search(term)

      if (requestId !== searchRequest) return

      users.value = listFrom(response.data)
        .filter(user =>
          !members.value.some(
            member => String(member.userId) === String(user.id),
          ),
        )
        .map(user => ({
          ...user,
          profileImage: getProfileImage(user),
        }))
    } catch (error) {
      if (requestId !== searchRequest) return

      console.error('Erro ao pesquisar usuários:', error)

      toast.error(
        getErrorMessage(error, 'Não foi possível pesquisar os usuários.'),
      )
    } finally {
      if (requestId === searchRequest) {
        searching.value = false
      }
    }
  }, 350)
})

function openModal() {
  search.value = ''
  users.value = []
  selectedUser.value = null
  showModal.value = true
}

function resetModal() {
  clearTimeout(searchTimer)
  searchRequest++

  showModal.value = false
  search.value = ''
  users.value = []
  selectedUser.value = null
}

function closeModal() {
  if (sending.value) return
  resetModal()
}

function selectUser(user) {
  selectedUser.value = user
}

async function sendInvite() {
  if (!selectedUser.value || sending.value) return

  const projectId = props.project?.id
  const invitedUser = selectedUser.value

  if (!projectId || invitedUser.id == null) {
    toast.error('Não foi possível identificar o projeto ou usuário.')
    return
  }

  sending.value = true

  try {
    await invitesApi.create(
      projectId,
      invitedUser.id,
      'member',
    )

    resetModal()

    toast.success(
      `Convite enviado para ${
        invitedUser.name || invitedUser.username || 'o usuário'
      }!`,
    )

    emit('invite-sent')
    await loadMembers()
  } catch (error) {
    console.error('Erro ao enviar convite:', {
      status: error.response?.status,
      respostaBackend: error.response?.data,
      url: error.config?.url,
      payload: error.config?.data,
    })

    toast.error(
      getErrorMessage(error, 'Não foi possível enviar o convite.'),
    )
  } finally {
    sending.value = false
  }
}

onUnmounted(() => {
  clearTimeout(searchTimer)
  searchRequest++
})
</script>

<template>
  <section class="members" aria-labelledby="project-members-title">
    <header class="members-header">
      <div class="members-title">
        <h2 id="project-members-title">
          Membros do projeto
        </h2>

        <span class="members-count">
          {{ members.length }}
        </span>
      </div>

      <button
        v-if="isOwner || isAdmin"
        type="button"
        class="invite-button"
        @click="openModal"
      >
        <span aria-hidden="true">+</span>
        Convidar membro
      </button>
    </header>

    <p v-if="loadingMembers" class="empty">
      Carregando membros...
    </p>

    <!-- LISTA DE MEMBROS -->

    <ul v-if="members.length" class="members-list">
      <li
        v-for="member in members"
        :key="member.membershipId ?? member.userId"
        class="member-item"
      >
        <span class="avatar">
          <img
            v-if="member.profileImage"
            :src="member.profileImage"
            :alt="`Foto de perfil de ${member.name}`"
            class="avatar-image"
            @error="member.profileImage = null"
          />

          <span v-else>
            {{
              String(member.name || 'M')
                .charAt(0)
                .toUpperCase()
            }}
          </span>
        </span>

        <div class="member-info">
          <strong>{{ member.name }}</strong>

          <p>{{ getRoleLabel(member.role) }}</p>

          <small v-if="member.username">
            @{{ member.username }}
          </small>
        </div>

        <div class="member-actions">
          <label class="role-control">
            <span class="sr-only">
              Permissão de {{ member.name }}
            </span>

            <select
              :value="member.role"
              :disabled="
                !canChangeRole(member) ||
                savingRoleId !== null ||
                removingMemberId !== null
              "
              @change="changeRole(member, $event)"
            >
              <option
                v-if="member.role === 'owner'"
                value="owner"
              >
                Proprietário
              </option>

              <option
                v-for="option in roleOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <button
            v-if="canRemoveMember(member)"
            type="button"
            class="remove-button"
            :disabled="
              removingMemberId !== null ||
              savingRoleId !== null
            "
            @click="removeMember(member)"
          >
            {{
              removingMemberId === member.userId
                ? 'Removendo...'
                : 'Remover'
            }}
          </button>
        </div>
      </li>
    </ul>

    <p v-else-if="!loadingMembers" class="empty">
      Nenhum membro encontrado.
    </p>

    <!-- SAIR DO PROJETO -->

    <div v-if="canLeaveProject" class="leave-section">
      <div class="leave-info">
        <strong>Sair do projeto</strong>

        <p>
          Você deixará de participar deste projeto
          e perderá acesso às suas atividades.
        </p>
      </div>

      <button
        type="button"
        class="leave-button"
        :disabled="removingMemberId !== null"
        @click="leaveProject"
      >
        {{
          removingMemberId === currentUserId
            ? 'Saindo...'
            : 'Sair do projeto'
        }}
      </button>
    </div>

    <!-- AVISO AO PROPRIETÁRIO -->

    <div v-if="isOwner" class="owner-notice">
      <strong>Você é o proprietário deste projeto.</strong>

      <p>
        Para sair, primeiro transfira a propriedade
        para outro participante.
      </p>
    </div>

    <!-- MODAL DE CONVITE -->

    <Teleport to="body">
      <div
        v-if="showModal"
        class="invite-overlay"
        @click.self="closeModal"
      >
        <section
          class="invite-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
        >
          <div class="invite-modal-header">
            <div>
              <h2 id="invite-title">Convidar membro</h2>

              <p>
                Pesquise pelo nome ou username do perfil.
              </p>
            </div>

            <button
              type="button"
              class="close-button"
              aria-label="Fechar"
              :disabled="sending"
              @click="closeModal"
            >
              &times;
            </button>
          </div>

          <div class="search-field">
            <label for="member-search">
              Buscar usuário
            </label>

            <input
              id="member-search"
              v-model="search"
              type="search"
              placeholder="Digite o nome da pessoa..."
              autocomplete="off"
            />
          </div>

          <div class="search-results">
            <p v-if="searching" class="search-feedback">
              Pesquisando usuários...
            </p>

            <p
              v-else-if="search.trim().length < 2"
              class="search-feedback"
            >
              Digite pelo menos 2 caracteres para pesquisar.
            </p>

            <p
              v-else-if="!users.length"
              class="search-feedback"
            >
              Nenhum usuário encontrado.
            </p>

            <button
              v-for="user in users"
              :key="user.id"
              type="button"
              class="user-result"
              :class="{ selected: selectedUser?.id === user.id }"
              @click="selectUser(user)"
            >
              <span class="user-avatar">
                <img
                  v-if="user.profileImage"
                  :src="user.profileImage"
                  :alt="`Foto de perfil de ${user.name || user.username}`"
                  class="avatar-image"
                  @error="user.profileImage = null"
                />

                <span v-else>
                  {{
                    (user.name || user.username || 'U')
                      .charAt(0)
                      .toUpperCase()
                  }}
                </span>
              </span>

              <span class="user-details">
                <strong>
                  {{ user.name || user.username }}
                </strong>

                <small v-if="user.username">
                  @{{ user.username }}
                </small>
              </span>

              <span
                v-if="selectedUser?.id === user.id"
                class="selected-indicator"
              >
                ✓
              </span>
            </button>
          </div>

          <div class="invite-actions">
            <button
              type="button"
              class="cancel-button"
              :disabled="sending"
              @click="closeModal"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="send-button"
              :disabled="!selectedUser || sending"
              @click="sendInvite"
            >
              {{
                sending ? 'Enviando...' : 'Enviar convite'
              }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.members {
  padding: 24px;
  border: 1px solid #e6e4e4;
  border-radius: 18px;
  background: #fff;
  color: #111;
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.members-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.members-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.members-count {
  padding: 4px 9px;
  border-radius: 8px;
  background: #f2f2f2;
  font-size: 12px;
  font-weight: 600;
}

.invite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border: none;
  border-radius: 10px;
  background: #000;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.invite-button:hover {
  background: #333;
}

.members-list {
  display: grid;
  gap: 16px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f1f1;
}

.member-item:last-child {
  border-bottom: none;
}

/* AVATARES */

.avatar,
.user-avatar {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: #111;
  color: #fff;
  font-weight: 700;
}

.avatar {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
}

.user-avatar {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  font-size: 15px;
}

.avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.member-info {
  min-width: 0;
  overflow-wrap: anywhere;
  flex: 1;
}

.member-info strong {
  font-size: 14px;
}

.member-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #777;
}

.member-info small {
  display: block;
  margin-top: 3px;
  color: #999;
  font-size: 11px;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-control select {
  max-width: 155px;
  padding: 9px 10px;
  border: 1px solid #ddd;
  border-radius: 9px;
  background: #fff;
  color: #111;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.role-control select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.remove-button {
  padding: 9px 13px;
  border: 1px solid #fecaca;
  border-radius: 9px;
  background: #fff5f5;
  color: #dc2626;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.remove-button:hover {
  background: #fee2e2;
  border-color: #f87171;
}

.remove-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.leave-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fffafa;
}

.leave-info {
  flex: 1;
}

.leave-info strong {
  color: #991b1b;
  font-size: 14px;
}

.leave-info p {
  margin: 6px 0 0;
  color: #777;
  font-size: 12px;
  line-height: 1.5;
}

.leave-button {
  flex-shrink: 0;
  padding: 11px 16px;
  border: 1px solid #dc2626;
  border-radius: 9px;
  background: #dc2626;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.leave-button:hover {
  background: #b91c1c;
}

.leave-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.owner-notice {
  margin-top: 25px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
}

.owner-notice strong {
  font-size: 13px;
}

.owner-notice p {
  margin: 6px 0 0;
  color: #777;
  font-size: 12px;
}

.empty {
  margin-top: 20px;
  color: #777;
  font-size: 13px;
}

/* MODAL DE CONVITE */

.invite-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.55);
}

.invite-modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
  box-sizing: border-box;
  border-radius: 18px;
  background: #fff;
  color: #111;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.invite-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}

.invite-modal-header h2 {
  margin: 0;
  font-size: 21px;
}

.invite-modal-header p {
  margin: 8px 0 0;
  color: #777;
  font-size: 13px;
}

.close-button {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: 8px;
  background: #f2f2f2;
  color: #333;
  font-size: 23px;
  cursor: pointer;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.search-field label {
  font-size: 13px;
  font-weight: 600;
}

.search-field input {
  width: 100%;
  padding: 13px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
  color: #111;
  font-family: inherit;
  font-size: 14px;
  outline: none;
}

.search-field input:focus {
  border-color: #000;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  margin-top: 18px;
}

.search-feedback {
  padding: 18px 12px;
  margin: 0;
  color: #888;
  font-size: 13px;
  text-align: center;
}

.user-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 11px;
  background: #fff;
  color: #111;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.user-result:hover {
  background: #f8f8f8;
}

.user-result.selected {
  border-color: #111;
  background: #f5f5f5;
}

.user-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-details strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-details small {
  color: #888;
  font-size: 12px;
}

.selected-indicator {
  font-size: 18px;
  font-weight: 700;
}

.invite-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

.cancel-button,
.send-button {
  padding: 12px 18px;
  border-radius: 9px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #ddd;
  background: #fff;
  color: #333;
}

.send-button {
  border: 1px solid #000;
  background: #000;
  color: #fff;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 600px) {
  .members {
    padding: 20px;
  }

  .members-header {
    flex-direction: column;
    align-items: stretch;
  }

  .invite-button {
    width: 100%;
  }

  .member-item {
    flex-wrap: wrap;
  }

  .member-info {
    flex-basis: calc(100% - 60px);
  }

  .member-actions {
    width: 100%;
    padding-left: 52px;
    box-sizing: border-box;
  }

  .role-control {
    flex: 1;
  }

  .role-control select {
    width: 100%;
    max-width: none;
  }

  .remove-button {
    flex-shrink: 0;
  }

  .leave-section {
    flex-direction: column;
    align-items: stretch;
  }

  .leave-button {
    width: 100%;
  }

  .invite-modal {
    padding: 22px;
  }

  .invite-actions {
    flex-direction: column-reverse;
  }

  .cancel-button,
  .send-button {
    width: 100%;
  }
}
</style>
