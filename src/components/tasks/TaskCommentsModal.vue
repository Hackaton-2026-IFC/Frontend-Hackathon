<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { taskError } from '@/api/taskApi'
import { assigneePhotoUrl } from '@/utils/taskPresentation'
import { profilePhotoUrl } from '@/utils/profilePhoto'

const props = defineProps({
  task: { type: Object, required: true },
  members: { type: Array, default: () => [] },
})
const emit = defineEmits(['close'])

const store = useTaskStore()
const auth = useAuthStore()
const dialog = ref(null)
const text = ref('')
const editingId = ref(null)
const editingText = ref('')
const deletingId = ref(null)
const localError = ref('')
const failedPhotos = ref({})

const taskId = computed(() => String(props.task.id))
const comments = computed(() => store.commentsByTask[taskId.value] || [])
const loading = computed(() => Boolean(store.commentsLoading[taskId.value]))
const error = computed(() => localError.value || store.commentsErrors[taskId.value] || '')
const nextPage = computed(() => store.commentsNextPageByTask[taskId.value])
const total = computed(() => store.commentsCountByTask[taskId.value] ?? comments.value.length)
const me = computed(() => auth.user?.id ?? auth.user?.user_id)
const membersById = computed(() =>
  Object.fromEntries(
    props.members
      .filter((member) => member?.usuario != null)
      .map((member) => [String(member.usuario), member]),
  ),
)

function authorPhoto(comment) {
  if (comment.autor == null) return null

  // Prioriza a foto atual do próprio usuário, que pode ter sido alterada
  // depois de carregar os participantes do projeto.
  if (me.value != null && String(comment.autor) === String(me.value)) {
    const ownPhoto = profilePhotoUrl(auth.user)
    if (ownPhoto) return ownPhoto
  }

  return assigneePhotoUrl(membersById.value[String(comment.autor)])
}

function photoFailed(comment) {
  const url = authorPhoto(comment)
  if (url) failedPhotos.value[url] = true
}

onMounted(() => {
  dialog.value?.showModal()
  reload()
})
onBeforeUnmount(() => dialog.value?.close())

function close() {
  if (!store.commentsBusy) emit('close')
}

function mine(comment) {
  return me.value != null && comment.autor != null && String(comment.autor) === String(me.value)
}

function when(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

async function reload() {
  localError.value = ''
  try {
    await store.loadComments(props.task.id)
  } catch {
    // O erro de carregamento aparece na janela e permite tentar novamente.
  }
}

async function loadMore() {
  localError.value = ''
  try {
    await store.loadComments(props.task.id, { more: true })
  } catch {
    // O erro pode ser corrigido pelo botão de tentar novamente.
  }
}

async function publish() {
  const content = text.value.trim()
  if (!content || store.commentsBusy || content.length > 5000) return
  localError.value = ''
  try {
    await store.addComment(props.task.id, content)
    text.value = ''
  } catch (err) {
    localError.value = taskError(err)
  }
}

function startEdit(comment) {
  deletingId.value = null
  editingId.value = comment.id
  editingText.value = comment.conteudo
  localError.value = ''
}

async function saveEdit(comment) {
  const content = editingText.value.trim()
  if (!content || store.commentsBusy || content.length > 5000 || !mine(comment)) return
  localError.value = ''
  try {
    await store.updateComment(props.task.id, comment.id, content)
    editingId.value = null
    editingText.value = ''
  } catch (err) {
    localError.value = taskError(err)
  }
}

async function deleteComment(comment) {
  if (!mine(comment) || store.commentsBusy) return
  localError.value = ''
  try {
    await store.removeComment(props.task.id, comment.id)
    deletingId.value = null
  } catch (err) {
    localError.value = taskError(err)
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="task-comments-dialog"
    aria-labelledby="task-comments-title"
    @cancel.prevent="close"
  >
    <header class="task-comments-header">
      <div>
        <p class="workspace-kicker">CONVERSA DA TAREFA</p>
        <h2 id="task-comments-title">Comentários <span>({{ total }})</span></h2>
        <p class="task-comments-subtitle">{{ task.titulo }}</p>
      </div>
      <button type="button" class="task-comments-close" :disabled="store.commentsBusy" aria-label="Fechar comentários" @click="close">×</button>
    </header>

    <div class="task-comments-body">
      <p v-if="loading && !comments.length" class="workspace-muted" role="status">Carregando comentários...</p>
      <template v-if="error">
        <ToastNotice :message="error" type="error" />
<button v-if="!comments.length" type="button" class="task-button" :disabled="loading" @click="reload">Tentar novamente</button>
      </template>

      <ul v-if="comments.length" class="task-comments-list">
        <li v-for="comment in comments" :key="comment.id" class="task-comment">
          <div class="task-comment-top">
            <div class="task-comment-author">
              <span class="task-comment-avatar" role="img" :aria-label="`Avatar de ${comment.autor_nome || 'Usuário'}`">
                <img
                  v-if="authorPhoto(comment) && !failedPhotos[authorPhoto(comment)]"
                  :src="authorPhoto(comment)"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  @error="photoFailed(comment)"
                />
                <span v-else aria-hidden="true">{{ (comment.autor_nome || 'U').charAt(0).toLocaleUpperCase('pt-BR') }}</span>
              </span>
              <div>
                <strong>{{ comment.autor_nome || 'Usuário' }}</strong>
                <time v-if="comment.criado_em" :datetime="comment.criado_em">{{ when(comment.criado_em) }}</time>
              </div>
            </div>
            <div v-if="mine(comment) && editingId !== comment.id && deletingId !== comment.id" class="task-comment-actions">
              <button type="button" :disabled="store.commentsBusy" @click="startEdit(comment)">Editar</button>
              <button type="button" :disabled="store.commentsBusy" @click="deletingId = comment.id">Excluir</button>
            </div>
          </div>

          <template v-if="editingId === comment.id">
            <form class="task-comment-edit" @submit.prevent="saveEdit(comment)">
              <label :for="`comment-edit-${comment.id}`">Editar comentário</label>
              <textarea :id="`comment-edit-${comment.id}`" v-model="editingText" rows="3" maxlength="5000" required :disabled="store.commentsBusy"></textarea>
              <div>
                <button type="button" class="task-button" :disabled="store.commentsBusy" @click="editingId = null">Cancelar</button>
                <button type="submit" class="task-button task-primary" :disabled="store.commentsBusy || !editingText.trim()">Salvar</button>
              </div>
            </form>
          </template>
          <template v-else>
            <p class="task-comment-text">{{ comment.conteudo }}</p>
            <div v-if="deletingId === comment.id" class="task-comment-delete">
              <p>Excluir este comentário?</p>
              <button type="button" class="task-button" :disabled="store.commentsBusy" @click="deletingId = null">Cancelar</button>
              <button type="button" class="task-button task-button--danger" :disabled="store.commentsBusy" @click="deleteComment(comment)">Confirmar exclusão</button>
            </div>
          </template>
        </li>
      </ul>

      <p v-else-if="!loading && !error" class="task-comments-empty">Nenhum comentário ainda. Comece a conversa.</p>

      <button v-if="nextPage" type="button" class="task-button task-comments-more" :disabled="loading" @click="loadMore">
        {{ loading ? 'Carregando...' : 'Carregar mais comentários' }}
      </button>
    </div>

    <form class="task-comments-compose" @submit.prevent="publish">
      <label for="task-new-comment">Novo comentário</label>
      <textarea id="task-new-comment" v-model="text" rows="3" maxlength="5000" required placeholder="Escreva um comentário para a equipe..." :disabled="store.commentsBusy"></textarea>
      <div class="task-comments-compose-actions">
        <span>{{ text.length }}/5000</span>
        <button type="submit" class="task-button task-primary" :disabled="store.commentsBusy || !text.trim()">
          {{ store.commentsBusy ? 'Publicando...' : 'Publicar comentário' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
