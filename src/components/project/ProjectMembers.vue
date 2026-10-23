<script setup>
import { computed, ref, watch } from 'vue'
import usersApi from '@/api/usersApi'
import invitesApi from '@/api/invitesApi'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['invite-sent'])

const members = computed(() =>
  Array.isArray(props.project.members)
    ? props.project.members
    : [],
)

const showModal = ref(false)
const search = ref('')
const users = ref([])
const selectedUser = ref(null)

const searching = ref(false)
const sending = ref(false)

const error = ref('')
const success = ref('')

let searchTimer = null
let searchRequest = 0

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

      if (requestId !== searchRequest) return

      const results = Array.isArray(response.data)
        ? response.data
        : (response.data?.results ?? [])

      users.value = results.filter(
        (user) =>
          !members.value.some(
            (member) =>
              Number(member.id) === Number(user.id) ||
              Number(member.usuario) === Number(user.id),
          ),
      )
    } catch (e) {
      if (requestId !== searchRequest) return

      error.value =
        e.response?.data?.detail ||
        'Não foi possível pesquisar os usuários.'
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
  error.value = ''
  success.value = ''
  showModal.value = true
}

function closeModal() {
  if (sending.value) return

  clearTimeout(searchTimer)
  searchRequest++

  showModal.value = false
  search.value = ''
  users.value = []
  selectedUser.value = null
}

function selectUser(user) {
  selectedUser.value = user
  error.value = ''
}

async function sendInvite() {
  if (!selectedUser.value || sending.value) return

  sending.value = true
  error.value = ''

  try {
    await invitesApi.create(
      props.project.id,
      selectedUser.value.id,
      'member',
    )

    const invitedUser = selectedUser.value

    closeAfterSuccess()

    success.value = `Convite enviado para ${invitedUser.name || invitedUser.username}!`

    emit('invite-sent')
  } catch (e) {
    const data = e.response?.data

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

function closeAfterSuccess() {
  clearTimeout(searchTimer)
  searchRequest++

  showModal.value = false
  search.value = ''
  users.value = []
  selectedUser.value = null
}
</script>

<template>
  <section
    class="members"
    aria-labelledby="project-members-title"
  >
    <!-- CABEÇALHO -->

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
        type="button"
        class="invite-button"
        @click="openModal"
      >
        <span aria-hidden="true">+</span>
        Convidar membro
      </button>
    </header>

    <!-- MENSAGEM DE SUCESSO -->

    <p
      v-if="success"
      class="success-message"
      role="status"
    >
      {{ success }}
    </p>

    <!-- LISTA DE MEMBROS -->

    <ul v-if="members.length" class="members-list">
      <li
        v-for="member in members"
        :key="member.id"
        class="member-item"
      >
        <span class="avatar" aria-hidden="true">
          {{ (member.name || 'M').charAt(0).toUpperCase() }}
        </span>

        <div class="member-info">
          <strong>
            {{ member.name || 'Membro' }}
          </strong>

          <p>
            {{ member.role || 'Membro' }}
          </p>
        </div>
      </li>
    </ul>

    <p v-else class="empty">
      Nenhum membro informado.
    </p>

    <!-- MODAL -->

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
          <!-- CABEÇALHO DO MODAL -->

          <div class="invite-modal-header">
            <div>
              <h2 id="invite-title">
                Convidar membro
              </h2>

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

          <!-- CAMPO DE PESQUISA -->

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
              Digite pelo menos 2 caracteres para pesquisar.
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
              {{ sending ? 'Enviando...' : 'Enviar convite' }}
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
  color: #000;
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

.invite-button span {
  font-size: 19px;
  line-height: 1;
}

.invite-button:hover {
  background: #333;
}

/* MEMBROS */

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
}

.member-info strong {
  font-size: 14px;
}

.member-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #777;
}

.empty {
  margin-top: 20px;
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

/* MODAL */

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

/* PESQUISA */

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

/* RESULTADOS */

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

/* MENSAGENS */

.error-message {
  margin: 15px 0 0;
  padding: 12px;
  border-radius: 8px;
  background: #fff1f1;
  color: #b42318;
  font-size: 13px;
}

/* BOTÕES */

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

/* RESPONSIVIDADE */

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