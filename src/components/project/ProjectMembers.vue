<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'
import projectsApi from '@/api/projectsApi'
import usersApi from '@/api/usersApi'
import invitesApi from '@/api/invitesApi'
import { useToastStore } from '@/stores/toastStore'
import api from '@/api/config'

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['invite-sent'])

const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()

// ==========================================
// USUÁRIO LOGADO
// ==========================================

const currentUserId = computed(() => {
  return (
    authStore.user?.id ??
    authStore.user?.user_id ??
    null
  )
})

// ==========================================
// MEMBROS
// ==========================================

const members = ref([])
const loadingMembers = ref(false)
const membersError = ref('')

const roleError = ref('')
const savingRoleId = ref(null)

const removingMemberId = ref(null)
const removeError = ref('')

const roleOptions = [
  { value: 'member', label: 'Membro' },
  { value: 'admin', label: 'Administrador' },
]

// ==========================================
// NORMALIZAR RESPOSTA DA API
// ==========================================

function listFrom(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.membros)) return data.membros
  if (Array.isArray(data?.participantes)) return data.participantes

  return []
}

function normalizeMember(item) {
  const raw =
    item.usuario_detalhes ||
    item.user_details ||
    item.usuario ||
    item.user ||
    {}

  const user =
    typeof raw === 'object' && raw !== null
      ? raw
      : {}

  const userId =
    user.id ??
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

    username:
      user.username ||
      item.username ||
      '',

    role:
      item.cargo ||
      item.role ||
      'member',
  }
}

// ==========================================
// CARREGAR MEMBROS
// ==========================================

async function loadMembers() {
  const projectId = props.project?.id

  if (!projectId) {
    members.value = []
    return
  }

  loadingMembers.value = true
  membersError.value = ''

  try {
    const response = await projectsApi.members(projectId)

    if (String(props.project?.id) !== String(projectId)) {
      return
    }

    members.value = listFrom(response.data).map(normalizeMember)
  } catch (error) {
    console.error('Erro ao carregar membros:', error)

    membersError.value =
      error.response?.data?.detail ||
      'Não foi possível carregar os membros.'
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
// PERMISSÕES DO USUÁRIO LOGADO
// ==========================================

const currentMember = computed(() => {
  if (currentUserId.value == null) {
    return null
  }

  return members.value.find(
    member =>
      String(member.userId) === String(currentUserId.value),
  ) || null
})

const currentRole = computed(() => {
  return currentMember.value?.role || null
})

const isOwner = computed(() => {
  return currentRole.value === 'owner'
})

const isAdmin = computed(() => {
  return currentRole.value === 'admin'
})

const canLeaveProject = computed(() => {
  return (
    currentMember.value !== null &&
    currentRole.value !== 'owner'
  )
})

// ==========================================
// NOMES DOS CARGOS
// ==========================================

function getRoleLabel(role) {
  const labels = {
    owner: 'Proprietário',
    admin: 'Administrador',
    member: 'Membro',
  }

  return labels[role] || role
}

// ==========================================
// VERIFICAR SE PODE ALTERAR CARGO
// ==========================================

function canChangeRole(member) {
  if (!isOwner.value) {
    return false
  }

  if (member.role === 'owner') {
    return false
  }

  return true
}

// ==========================================
// ALTERAR CARGO
// ==========================================

async function changeRole(member, event) {
  const newRole = event.target.value
  const oldRole = member.role

  if (newRole === oldRole) {
    return
  }

  roleError.value = ''

  if (!canChangeRole(member)) {
    roleError.value =
      'Você não tem permissão para alterar este cargo.'

    event.target.value = oldRole
    return
  }

  if (member.userId == null) {
    roleError.value =
      'Não foi possível identificar o usuário.'

    event.target.value = oldRole
    return
  }

  savingRoleId.value = member.userId

  try {
    await api.patch(
      `projetos/${props.project.id}/membros/${member.userId}/cargo/`,
      {
        cargo: newRole,
      },
    )

    member.role = newRole

    toast.success(`Cargo de ${member.name} alterado para ${getRoleLabel(newRole)}.`)

    await loadMembers()
  } catch (error) {
    console.error('Erro ao alterar cargo:', error)

    roleError.value =
      error.response?.data?.detail ||
      'Não foi possível alterar o cargo.'

    member.role = oldRole
    event.target.value = oldRole
  } finally {
    savingRoleId.value = null
  }
}

// ==========================================
// VERIFICAR SE PODE REMOVER MEMBRO
// ==========================================

function canRemoveMember(member) {
  // Precisa estar autenticado no projeto.
  if (!currentMember.value) {
    return false
  }

  // Não pode remover o proprietário.
  if (member.role === 'owner') {
    return false
  }

  // O botão de remover outros não deve
  // aparecer para o próprio usuário.
  if (
    String(member.userId) === String(currentUserId.value)
  ) {
    return false
  }

  // Proprietário remove membros e administradores.
  if (isOwner.value) {
    return true
  }

  // Administrador remove apenas membros comuns.
  if (
    isAdmin.value &&
    member.role === 'member'
  ) {
    return true
  }

  return false
}

// ==========================================
// REMOVER MEMBRO
// ==========================================

async function removeMember(member) {
  if (!canRemoveMember(member)) {
    removeError.value =
      'Você não tem permissão para remover este participante.'

    return
  }

  const confirmed = window.confirm(
    `Tem certeza que deseja remover ${member.name} do projeto?`,
  )

  if (!confirmed) {
    return
  }

  removingMemberId.value = member.userId
  removeError.value = ''

  try {
    await api.delete(
      `projetos/${props.project.id}/membros/${member.userId}/`,
    )

    toast.success(`${member.name} foi removido do projeto.`)

    await loadMembers()
  } catch (error) {
    console.error('Erro ao remover membro:', error)

    removeError.value =
      error.response?.data?.detail ||
      'Não foi possível remover o membro.'
  } finally {
    removingMemberId.value = null
  }
}

// ==========================================
// SAIR DO PROJETO
// ==========================================

async function leaveProject() {
  if (!canLeaveProject.value) {
    removeError.value =
      'O proprietário precisa transferir a propriedade antes de sair.'

    return
  }

  const confirmed = window.confirm(
    'Tem certeza que deseja sair deste projeto? Você perderá o acesso às atividades dele.',
  )

  if (!confirmed) {
    return
  }

  removingMemberId.value = currentUserId.value
  removeError.value = ''

  try {
    await api.delete(
      `projetos/${props.project.id}/membros/${currentUserId.value}/`,
    )

    await router.push('/projects')
  } catch (error) {
    console.error('Erro ao sair do projeto:', error)

    removeError.value =
      error.response?.data?.detail ||
      'Não foi possível sair do projeto.'
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

const error = ref('')

let searchTimer = null
let searchRequest = 0

// ==========================================
// PESQUISAR USUÁRIOS
// ==========================================

watch(search, (value) => {
  clearTimeout(searchTimer)

  searchRequest++

  users.value = []
  selectedUser.value = null
  error.value = ''

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

      if (requestId !== searchRequest) {
        return
      }

      const results = listFrom(response.data)

      users.value = results.filter(
        user =>
          !members.value.some(
            member =>
              String(member.userId) === String(user.id),
          ),
      )
    } catch (err) {
      if (requestId !== searchRequest) {
        return
      }

      error.value =
        err.response?.data?.detail ||
        'Não foi possível pesquisar os usuários.'
    } finally {
      if (requestId === searchRequest) {
        searching.value = false
      }
    }
  }, 350)
})

// ==========================================
// MODAL
// ==========================================

function openModal() {
  search.value = ''
  users.value = []
  selectedUser.value = null

  error.value = ''

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
  if (sending.value) {
    return
  }

  resetModal()
}

function selectUser(user) {
  selectedUser.value = user
  error.value = ''
}

// ==========================================
// ENVIAR CONVITE
// ==========================================

async function sendInvite() {
  if (!selectedUser.value || sending.value) {
    return
  }

  sending.value = true
  error.value = ''

  try {
    await invitesApi.create(
      props.project.id,
      selectedUser.value.id,
      'member',
    )

    const invitedUser = selectedUser.value

    resetModal()

    toast.success(`Convite enviado para ${
        invitedUser.name || invitedUser.username
      }!`)

    emit('invite-sent')

    await loadMembers()
  } catch (err) {
    console.error('Erro ao enviar convite:', err)

    const data = err.response?.data

    if (typeof data?.detail === 'string') {
      error.value = data.detail
    } else if (data && typeof data === 'object') {
      error.value = Object.values(data)
        .flat()
        .join(' ')
    } else {
      error.value = 'Não foi possível enviar o convite.'
    }
  } finally {
    sending.value = false
  }
}

// ==========================================
// LIMPEZA
// ==========================================

onUnmounted(() => {
  clearTimeout(searchTimer)
  searchRequest++
})
</script>

<template>
  <section
    class="members"
    aria-labelledby="project-members-title"
  >
    <!-- ==================================
         CABEÇALHO
    ================================== -->

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

    <!-- ==================================
         MENSAGENS
    ================================== -->

    <p
      v-if="membersError"
      class="error-message"
      role="alert"
    >
      {{ membersError }}
    </p>

    <p
      v-if="roleError"
      class="error-message"
      role="alert"
    >
      {{ roleError }}
    </p>

    <p
      v-if="removeError"
      class="error-message"
      role="alert"
    >
      {{ removeError }}
    </p>

    <!-- ==================================
         CARREGAMENTO
    ================================== -->

    <p
      v-if="loadingMembers"
      class="empty"
    >
      Carregando membros...
    </p>

    <!-- ==================================
         LISTA DE MEMBROS
    ================================== -->

    <ul
      v-if="members.length"
      class="members-list"
    >
      <li
        v-for="member in members"
        :key="member.membershipId ?? member.userId"
        class="member-item"
      >
        <!-- AVATAR -->

        <span class="avatar">
          {{
            String(member.name || 'M')
              .charAt(0)
              .toUpperCase()
          }}
        </span>

        <!-- INFORMAÇÕES -->

        <div class="member-info">
          <strong>
            {{ member.name }}
          </strong>

          <p>
            {{ getRoleLabel(member.role) }}
          </p>

          <small v-if="member.username">
            @{{ member.username }}
          </small>
        </div>

        <!-- ==================================
             AÇÕES
        ================================== -->

        <div class="member-actions">
          <!-- ALTERAR CARGO -->

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

          <!-- REMOVER MEMBRO -->

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

    <p
      v-else-if="!loadingMembers && !membersError"
      class="empty"
    >
      Nenhum membro encontrado.
    </p>

    <!-- ==================================
         SAIR DO PROJETO
    ================================== -->

    <div
      v-if="canLeaveProject"
      class="leave-section"
    >
      <div class="leave-info">
        <strong>
          Sair do projeto
        </strong>

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

    <!-- ==================================
         AVISO AO PROPRIETÁRIO
    ================================== -->

    <div
      v-if="isOwner"
      class="owner-notice"
    >
      <strong>
        Você é o proprietário deste projeto.
      </strong>

      <p>
        Para sair, primeiro transfira a propriedade
        para outro participante.
      </p>
    </div>

    <!-- ==================================
         MODAL DE CONVITE
    ================================== -->

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
          <!-- CABEÇALHO -->

          <div class="invite-modal-header">
            <div>
              <h2 id="invite-title">
                Convidar membro
              </h2>

              <p>
                Pesquise pelo nome ou username
                do perfil.
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

          <!-- PESQUISA -->

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

          <!-- RESULTADOS -->

          <div class="search-results">
            <p
              v-if="searching"
              class="search-feedback"
            >
              Pesquisando usuários...
            </p>

            <p
              v-else-if="search.trim().length < 2"
              class="search-feedback"
            >
              Digite pelo menos 2 caracteres
              para pesquisar.
            </p>

            <p
              v-else-if="!users.length && !error"
              class="search-feedback"
            >
              Nenhum usuário encontrado.
            </p>

            <button
              v-for="user in users"
              :key="user.id"
              type="button"
              class="user-result"
              :class="{
                selected: selectedUser?.id === user.id,
              }"
              @click="selectUser(user)"
            >
              <span class="user-avatar">
                {{
                  (user.name || user.username || 'U')
                    .charAt(0)
                    .toUpperCase()
                }}
              </span>

              <span class="user-details">
                <strong>
                  {{ user.name || user.username }}
                </strong>

                <small>
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

          <!-- ERRO -->

          <p
            v-if="error"
            class="error-message"
            role="alert"
          >
            {{ error }}
          </p>

          <!-- AÇÕES -->

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
                sending
                  ? 'Enviando...'
                  : 'Enviar convite'
              }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
/* ==========================================
   CONTAINER
========================================== */

.members {
  padding: 24px;
  border: 1px solid #e6e4e4;
  border-radius: 18px;
  background: #fff;
  color: #111;
}

/* ==========================================
   CABEÇALHO
========================================== */

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

/* ==========================================
   MEMBROS
========================================== */

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

.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 40px;
  height: 40px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  font-weight: 700;
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

/* ==========================================
   AÇÕES DOS MEMBROS
========================================== */

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

/* ==========================================
   SAIR DO PROJETO
========================================== */

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

/* ==========================================
   AVISO DO PROPRIETÁRIO
========================================== */

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

/* ==========================================
   MENSAGENS
========================================== */

.empty {
  margin-top: 20px;
  color: #777;
  font-size: 13px;
}

.success-message {
  padding: 12px;
  margin-top: 18px;
  border-radius: 8px;
  background: #eaf8ef;
  color: #16803c;
  font-size: 13px;
}

.error-message {
  margin: 15px 0 0;
  padding: 12px;
  border-radius: 8px;
  background: #fff1f1;
  color: #b42318;
  font-size: 13px;
}

/* ==========================================
   MODAL
========================================== */

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

/* ==========================================
   PESQUISA
========================================== */

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

/* ==========================================
   RESULTADOS
========================================== */

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

.user-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  height: 42px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
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

/* ==========================================
   BOTÕES DO MODAL
========================================== */

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

/* ==========================================
   ACESSIBILIDADE
========================================== */

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

/* ==========================================
   RESPONSIVIDADE
========================================== */

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