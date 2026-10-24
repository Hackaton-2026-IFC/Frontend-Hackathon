<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { TASK_PRIORITIES, TASK_STATUSES, taskError } from '@/api/taskApi'
import { automaticPriority } from '@/utils/taskPresentation'
import { useTaskStore } from '@/stores/taskStore'
import TaskAssigneeAvatar from '@/components/tasks/TaskAssigneeAvatar.vue'
import { assigneeDisplayName } from '@/utils/taskPresentation'

const props = defineProps({
  task: { type: Object, default: null },
  projects: { type: Array, required: true },
  projectId: { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'saved'])
const store = useTaskStore()
const dialog = ref(null)
const error = ref('')
const userSearch = ref('')
const searchResults = ref([])
const searchingUsers = ref(false)
const userSearchError = ref('')
const inviteNotice = ref('')
const invitedUserIds = ref([])
let searchTimer = null
let searchRequest = 0

const form = reactive({
  projeto: props.task?.projeto ?? props.projectId ?? props.projects[0]?.id ?? '',
  titulo: props.task?.titulo ?? '',
  descricao: props.task?.descricao ?? '',
  status: props.task?.status ?? 'planejado',
  data_limite: props.task?.data_limite ?? '',
})

const selectedAssigneeIds = ref([
  ...new Set([
    props.task?.responsavel,
    ...(store.additionalAssigneesByTask[String(props.task?.id)] || []),
  ].filter((id) => id != null && id !== '').map(String)),
])

const members = computed(() =>
  props.projects.find((project) => String(project.id) === String(form.projeto))?.participantes || [],
)
const memberIds = computed(() => new Set(members.value.map((member) => String(member.usuario))))
const filteredMembers = computed(() => {
  const term = userSearch.value.trim().toLocaleLowerCase('pt-BR')
  if (!term) return members.value
  return members.value.filter((member) => {
    const details = member.usuario_detalhes || {}
    return [details.name, details.username]
      .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(term))
  })
})
const outsideUsers = computed(() =>
  searchResults.value.filter((user) => !memberIds.value.has(String(user.id))),
)

function resetUserSearch() {
  clearTimeout(searchTimer)
  searchRequest++
  searchResults.value = []
  searchingUsers.value = false
  userSearchError.value = ''
}

watch([userSearch, () => form.projeto], () => {
  resetUserSearch()
  inviteNotice.value = ''
  const term = userSearch.value.trim()
  if (term.length < 2) return

  searchingUsers.value = true
  const requestId = searchRequest
  searchTimer = setTimeout(async () => {
    try {
      const matches = await store.searchUsers(term)
      if (requestId === searchRequest) searchResults.value = matches
    } catch (err) {
      if (requestId === searchRequest) userSearchError.value = taskError(err)
    } finally {
      if (requestId === searchRequest) searchingUsers.value = false
    }
  }, 350)
})

async function inviteUser(user) {
  if (!user?.id || store.busy || store.inviting || memberIds.value.has(String(user.id))) return
  userSearchError.value = ''
  inviteNotice.value = ''
  try {
    await store.inviteProjectMember(form.projeto, user.id)
    invitedUserIds.value = [...invitedUserIds.value, String(user.id)]
    inviteNotice.value = `Convite enviado para ${user.name || user.username}. A pessoa poderá ser atribuída à tarefa depois que aceitar e entrar no projeto.`
  } catch (err) {
    userSearchError.value = taskError(err)
  }
}

const priorityCode = computed(() => automaticPriority({
  status: form.status,
  data_limite: form.data_limite,
  prazo_antecipado: props.task?.prazo_antecipado,
}))

const priorityLabel = computed(() => TASK_PRIORITIES[priorityCode.value] || 'Sem urgência')

onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => {
  resetUserSearch()
  dialog.value?.close()
})

function close() {
  if (!store.busy && !store.inviting) emit('close')
}

function changeProject() {
  selectedAssigneeIds.value = []
  invitedUserIds.value = []
  userSearch.value = ''
  resetUserSearch()
}

async function save() {
  if (store.busy || store.inviting || !form.titulo.trim() || !form.projeto) return

  error.value = ''

  try {
    const allowedIds = new Set(members.value.map((member) => String(member.usuario)))
    const selectedIds = [...new Set(selectedAssigneeIds.value.filter((id) => allowedIds.has(id)))]
    const currentPrimary = props.task?.responsavel == null ? null : String(props.task.responsavel)
    const primaryId = currentPrimary && selectedIds.includes(currentPrimary)
      ? currentPrimary
      : selectedIds[0] || null

    const payload = {
      projeto: Number(form.projeto),
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      status: form.status,
      responsavel: primaryId == null ? null : Number(primaryId),
      data_limite: form.data_limite || null,
    }

    // The backend calculates urgency from the deadline. Do not overwrite the
    // separately stored, manually defined "prioridade" field.
    const savedTask = props.task
      ? await store.update(props.task.id, payload)
      : await store.create(payload)

    const additionalIds = selectedIds.filter((id) => id !== primaryId)
    const additionalStored = store.setAdditionalAssignees(savedTask.id, additionalIds)
    emit('saved', { task: savedTask, additionalStored, additionalCount: additionalIds.length })
  } catch (err) {
    error.value = taskError(err)
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="task-dialog task-editor"
    aria-labelledby="task-form-title"
    :aria-busy="store.busy"
    @cancel.prevent="close"
  >
    <header class="task-editor-header">
      <div>
        <p class="task-eyebrow">MOMENTUM / ORGANIZAÇÃO</p>
        <h2 id="task-form-title">{{ task ? 'Editar tarefa' : 'Nova tarefa' }}</h2>
        <p>Preencha os campos e salve as informações da tarefa.</p>
      </div>
      <button
        type="button"
        class="task-dialog-close"
        aria-label="Fechar formulário"
        :disabled="store.busy || store.inviting"
        @click="close"
      >×</button>
    </header>

    <form class="task-form" @submit.prevent="save">
      <fieldset :disabled="store.busy || store.inviting">
        <label>
          Projeto
          <select
            v-model="form.projeto"
            required
            :disabled="Boolean(task) || Boolean(projectId)"
            @change="changeProject"
          >
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.nome }}
            </option>
          </select>
        </label>

        <label>
          Título
          <input
            v-model="form.titulo"
            type="text"
            maxlength="150"
            required
            autofocus
            placeholder="O que precisa ser feito?"
          />
        </label>

        <section class="task-form-edit-options" aria-labelledby="task-options-title">
          <h3 id="task-options-title">Responsável, prioridade e prazo</h3>
          <div class="task-form-edit-grid">
            <div class="task-form-assignee">
              <span class="task-assignee-title">Responsáveis</span>
              <label class="task-assignee-search">
                Buscar pelo nome ou username
                <input
                  v-model="userSearch"
                  type="search"
                  autocomplete="off"
                  placeholder="Digite o nome de outro usuário..."
                />
              </label>
              <div v-if="filteredMembers.length" class="task-assignee-choices" role="group" aria-label="Selecionar responsáveis">
                <label
                  v-for="member in filteredMembers"
                  :key="member.usuario"
                  class="task-assignee-option"
                  :class="{ 'task-assignee-option--selected': selectedAssigneeIds.includes(String(member.usuario)) }"
                >
                  <input
                    v-model="selectedAssigneeIds"
                    type="checkbox"
                    :value="String(member.usuario)"
                  />
                  <TaskAssigneeAvatar :member="member" compact />
                  <span class="task-assignee-option__name">{{ assigneeDisplayName(member) }}</span>
                </label>
              </div>
              <p v-else class="task-form-priority-help">
                {{ members.length ? 'Nenhum participante encontrado com esse nome.' : 'Nenhum participante disponível neste projeto.' }}
              </p>

              <div v-if="userSearch.trim().length >= 2" class="task-assignee-search-results" aria-live="polite">
                <p v-if="searchingUsers" class="task-assignee-feedback">Pesquisando usuários...</p>
                <template v-else>
                  <p v-if="outsideUsers.length" class="task-assignee-feedback">
                    Outros usuários encontrados (ainda não fazem parte do projeto):
                  </p>
                  <div v-for="user in outsideUsers" :key="user.id" class="task-assignee-search-result">
                    <span class="task-assignee-search-result__avatar" aria-hidden="true">
                      {{ (user.name || user.username || 'U').charAt(0).toUpperCase() }}
                    </span>
                    <span class="task-assignee-search-result__identity">
                      <strong>{{ user.name || user.username || 'Usuário' }}</strong>
                      <small v-if="user.username">@{{ user.username }}</small>
                    </span>
                    <button
                      type="button"
                      class="task-button"
                      :disabled="store.inviting || invitedUserIds.includes(String(user.id))"
                      @click="inviteUser(user)"
                    >
                      {{ invitedUserIds.includes(String(user.id)) ? 'Convidado' : store.inviting ? 'Enviando...' : 'Convidar' }}
                    </button>
                  </div>
                  <p v-if="!outsideUsers.length && !filteredMembers.length && !userSearchError" class="task-assignee-feedback">
                    Nenhum usuário encontrado.
                  </p>
                </template>
                <p v-if="userSearchError" class="task-error" role="alert">{{ userSearchError }}</p>
                <p v-if="inviteNotice" class="task-assignee-invite-notice" role="status">{{ inviteNotice }}</p>
              </div>

              <p class="task-assignee-help">
                Você pode selecionar várias pessoas. A primeira fica como responsável oficial na API;
                as adicionais são salvas somente neste navegador e não aparecem para outros integrantes.
              </p>
            </div>

            <label>
              Prazo
              <input v-model="form.data_limite" type="date" />
            </label>

            <div class="task-form-auto-priority" aria-live="polite">
              <span>Prioridade automática</span>
              <strong>
                <span
                  v-if="priorityCode"
                  class="task-priority__dot"
                  :class="`task-priority__dot--${priorityCode}`"
                  aria-hidden="true"
                ></span>
                {{ priorityLabel }}
              </strong>
            </div>
          </div>
          <p class="task-form-priority-help">
            Calculada pelo prazo: quanto mais perto do vencimento, maior a prioridade.
          </p>
        </section>

        <label>
          Descrição
          <textarea
            v-model="form.descricao"
            rows="4"
            placeholder="Detalhe a atividade..."
          ></textarea>
        </label>

        <label>
          Situação
          <select v-model="form.status">
            <option v-for="(label, value) in TASK_STATUSES" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </label>
      </fieldset>

      <p v-if="error" class="task-error" role="alert">{{ error }}</p>

      <footer class="task-actions">
        <button type="button" class="task-button" :disabled="store.busy || store.inviting" @click="close">
          Cancelar
        </button>
        <button
          type="submit"
          class="task-button task-primary"
          :disabled="store.busy || store.inviting || !form.titulo.trim() || !form.projeto"
        >
          {{ store.busy ? 'Salvando...' : task ? 'Salvar alterações' : 'Criar tarefa' }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
