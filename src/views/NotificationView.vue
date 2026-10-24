<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import invitesApi from '@/api/invitesApi'
import projectsApi from '@/api/projectsApi'
import { getProjectIcon } from '@/utils/projectIcons'
import { useToastStore } from '@/stores/toastStore'

const toast = useToastStore()

const invites = ref([])
const projectDetails = ref({})
const loading = ref(true)
const error = ref('')
const processingId = ref(null)

const pendingInvites = computed(() =>
  invites.value.filter((invite) => {
    const status = String(
      invite.status ?? invite.situacao ?? 'pendente'
    ).toLowerCase()

    return ['pendente', 'pending'].includes(status)
  })
)

function getProjectId(invite) {
  const value = invite.projeto_detalhes ?? invite.projeto_detail ?? invite.projeto ?? invite.projeto_id ?? invite.project_id
  return typeof value === 'object' ? value?.id : value
}

function getProject(invite) {
  const embedded = invite.projeto_detalhes ?? invite.projeto_detail ?? invite.projeto ?? invite.project
  const details = typeof embedded === 'object' && embedded ? embedded : {}
  return { ...details, ...(projectDetails.value[String(getProjectId(invite))] || {}) }
}

function getProjectColor(invite) {
  const color = getProject(invite).cor ?? getProject(invite).color ?? '#171717'
  return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(color)) ? color : '#171717'
}

async function loadProjectDetails(items) {
  const ids = [...new Set(items.map(getProjectId).filter(Boolean).map(String))]
  await Promise.allSettled(ids.map(async (id) => {
    if (projectDetails.value[id]) return
    try {
      const { data } = await projectsApi.get(id)
      projectDetails.value = { ...projectDetails.value, [id]: data }
    } catch {
      // Projetos privados podem não estar disponíveis antes de aceitar o convite.
    }
  }))
}

function getProjectName(invite) {
  const project = getProject(invite)
  const name = project.nome || project.name || project.titulo ||
    invite.nome_projeto || invite.projeto_nome || invite.project_name ||
    invite.projeto?.nome || invite.projeto?.name
  if (name) return name
  const id = getProjectId(invite)
  return id != null ? 'Projeto #' + id : 'Projeto convidado'
}

function getSenderName(invite) {
  const sender = invite.remetente_detalhes ?? invite.convidado_por_detalhes ??
    invite.criado_por_detalhes ?? invite.remetente ?? invite.convidado_por ??
    invite.criado_por ?? invite.sender
  const name = typeof sender === 'object' && sender
    ? sender.nome || sender.name || sender.nome_completo || sender.username
    : null
  return name || invite.remetente_nome || invite.convidado_por_nome ||
    invite.criado_por_nome || invite.sender_name || 'Um usuário'
}

function getErrorMessage(err) {
  const data = err?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (typeof data?.erro === 'string') {
    return data.erro
  }

  return err?.message || 'Não foi possível concluir a operação.'
}

async function loadInvites() {
  loading.value = true
  error.value = ''

  try {
    const response = await invitesApi.list()

    const data = response.data

    invites.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : []
    await loadProjectDetails(invites.value)
  } catch (err) {
    console.error('Erro ao buscar convites:', err)
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function respond(invite, action) {
  if (processingId.value !== null) return

  processingId.value = invite.id
  error.value = ''

  try {
    if (action === 'accept') {
      await invitesApi.accept(invite.id)
      toast.success('Convite aceito! Você agora faz parte do projeto.')
    } else {
      await invitesApi.reject(invite.id)
      toast.info('Convite recusado.')
    }

    // Remove o convite respondido da lista imediatamente.
    invites.value = invites.value.filter(
      (item) => item.id !== invite.id
    )

    // Atualiza os dados do servidor.
    await loadInvites()
  } catch (err) {
    console.error('Erro ao responder convite:', err)
    error.value = getErrorMessage(err)
    toast.error(error.value)
  } finally {
    processingId.value = null
  }
}

onMounted(loadInvites)
</script>

<template>
  <main class="notifications-page">
    <div class="notifications-container">

      <!-- CABEÇALHO -->

      <header class="notifications-header">
        <div>
          <span class="notifications-eyebrow">
            SEU ESPAÇO DE TRABALHO
          </span>

          <h1>Notificações</h1>

          <p>
            Gerencie seus convites e participe de novos projetos.
          </p>
        </div>

        <button
          type="button"
          class="refresh-button"
          :disabled="loading"
          @click="loadInvites"
        >
          ↻ Atualizar
        </button>
      </header>

      <!-- MENSAGENS -->

      <div
        v-if="error"
        class="feedback feedback-error"
        role="alert"
      >
        {{ error }}
      </div>


      <!-- CONVITES -->

      <section class="notifications-section">

        <div class="section-heading">
          <div>
            <h2>Convites para projetos</h2>
            <p>Convites recebidos que aguardam sua resposta.</p>
          </div>

          <span class="invite-count">
            {{ pendingInvites.length }}
          </span>
        </div>

        <!-- CARREGANDO -->

        <div
          v-if="loading"
          class="notifications-empty"
        >
          Carregando seus convites...
        </div>

        <!-- SEM CONVITES -->

        <div
          v-else-if="!pendingInvites.length"
          class="notifications-empty"
        >
          <div class="empty-icon" aria-hidden="true">
            ✓
          </div>

          <h3>Tudo em dia!</h3>

          <p>
            Você não possui convites pendentes no momento.
          </p>

          <RouterLink
            to="/projects"
            class="projects-link"
          >
            Ver meus projetos →
          </RouterLink>
        </div>

        <!-- LISTA DE CONVITES -->

        <div
          v-else
          class="invites-list"
        >
          <article
            v-for="invite in pendingInvites"
            :key="invite.id"
            class="invite-card"
          >
            <div class="invite-main">

              <div class="invite-avatar" aria-hidden="true" :style="{ backgroundColor: getProjectColor(invite) }">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path :d="getProjectIcon(getProject(invite).icone ?? getProject(invite).icon ?? '')" fill="currentColor" /></svg>
              </div>

              <div class="invite-content">
                <span class="invite-label">
                  CONVITE DE PROJETO
                </span>

                <h3>
                  {{ getProjectName(invite) }}
                </h3>

                <p>
                  <strong>{{ getSenderName(invite) }}</strong>
                  convidou você para participar deste projeto.
                </p>

                <span class="invite-pending">
                  <span class="pending-dot"></span>
                  Aguardando resposta
                </span>
              </div>
            </div>

            <!-- AÇÕES -->

            <div class="invite-actions">
              <button
                type="button"
                class="reject-button"
                :disabled="processingId !== null"
                @click="respond(invite, 'reject')"
              >
                Recusar
              </button>

              <button
                type="button"
                class="accept-button"
                :disabled="processingId !== null"
                @click="respond(invite, 'accept')"
              >
                {{
                  processingId === invite.id
                    ? 'Processando...'
                    : 'Aceitar convite'
                }}
              </button>
            </div>
          </article>
        </div>

      </section>

    </div>
  </main>
</template>

<style scoped>
.notifications-page {
  min-height: 100%;
  padding: 36px;
  background: #f8f8f8;
  color: #171717;
}

.notifications-page * {
  box-sizing: border-box;
}

.notifications-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* CABEÇALHO */

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  margin-bottom: 28px;
}

.notifications-eyebrow {
  color: #999;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.notifications-header h1 {
  margin: 10px 0;
  font-size: 30px;
  font-weight: 750;
  letter-spacing: -0.8px;
}

.notifications-header p {
  margin: 0;
  color: #888;
  font-size: 13px;
}

.refresh-button {
  padding: 11px 17px;
  border: 1px solid #e5e5e5;
  border-radius: 9px;
  background: #fff;
  color: #444;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button:hover {
  background: #f2f2f2;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* SEÇÃO */

.notifications-section {
  padding: 28px;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  background: #fff;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  margin-bottom: 25px;
}

.section-heading h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
}

.section-heading p {
  margin: 0;
  color: #888;
  font-size: 12px;
}

.invite-count {
  display: grid;
  place-items: center;

  min-width: 30px;
  height: 30px;
  padding: 0 8px;

  border-radius: 8px;
  background: #f2f2f2;

  font-size: 12px;
  font-weight: 700;
}

/* CONVITES */

.invites-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  padding: 22px;

  border: 1px solid #e9e9e9;
  border-radius: 12px;

  background: #fff;
  transition: border-color 0.2s;
}

.invite-card:hover {
  border-color: #cfcfcf;
}

.invite-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.invite-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;

  width: 48px;
  height: 48px;

  border-radius: 12px;
  background: #171717;
  color: #fff;

  font-size: 20px;
  font-weight: 700;
}

.invite-content {
  min-width: 0;
}

.invite-label {
  color: #999;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
}

.invite-content h3 {
  margin: 7px 0;
  font-size: 16px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.invite-content p {
  margin: 0 0 12px;
  color: #777;
  font-size: 12px;
  line-height: 1.6;
}

.invite-content p strong {
  color: #333;
}

.invite-pending {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: #777;
  font-size: 11px;
}

.pending-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e6a23c;
}

/* BOTÕES */

.invite-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.invite-actions button {
  padding: 11px 17px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: background 0.2s;
}

.reject-button {
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #555;
}

.reject-button:hover {
  background: #f5f5f5;
}

.accept-button {
  border: 1px solid #171717;
  background: #171717;
  color: #fff;
}

.accept-button:hover {
  background: #333;
}

.invite-actions button:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* ESTADO VAZIO */

.notifications-empty {
  padding: 65px 20px;
  border: 1px dashed #e5e5e5;
  border-radius: 12px;
  background: #fafafa;
  text-align: center;
  color: #888;
  font-size: 13px;
}

.empty-icon {
  display: grid;
  place-items: center;

  width: 50px;
  height: 50px;
  margin: 0 auto 18px;

  border-radius: 14px;
  background: #f0f0f0;
  color: #333;
  font-size: 24px;
}

.notifications-empty h3 {
  margin: 0 0 8px;
  color: #222;
  font-size: 17px;
}

.notifications-empty p {
  margin: 0 0 18px;
  line-height: 1.6;
}

.projects-link {
  color: #171717;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

/* MENSAGENS */

.feedback {
  margin-bottom: 20px;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 12px;
}

.feedback-error {
  border: 1px solid #f5d0d0;
  background: #fff5f5;
  color: #a33;
}

.feedback-success {
  border: 1px solid #d4eadc;
  background: #f0faf3;
  color: #287548;
}

/* RESPONSIVIDADE */

@media (max-width: 768px) {
  .notifications-page {
    padding: 20px 15px;
  }

  .notifications-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .notifications-section {
    padding: 18px;
  }

  .invite-card {
    align-items: stretch;
    flex-direction: column;
  }

  .invite-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .notifications-header h1 {
    font-size: 25px;
  }

  .invite-card {
    padding: 16px;
  }

  .invite-avatar {
    width: 40px;
    height: 40px;
  }

  .invite-actions {
    flex-direction: column;
  }

  .invite-actions button {
    width: 100%;
  }
}
</style>