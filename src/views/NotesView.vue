<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import notesApi from '@/api/notesApi'
import projectsApi from '@/api/projectsApi'
import { useAuthStore } from '@/stores/authStore'
import { RouterLink } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const projectStore = useProjectStore()
const authStore = useAuthStore()
const props = defineProps({ id: { type: [String, Number], default: null } })
const projectId = computed(() => props.id ? String(props.id) : '')
const isProjectMural = computed(() => Boolean(projectId.value))
const projectInfo = ref(null)
function isAuthor(note) {
  const userId = authStore.user?.id ?? authStore.user?.user_id
  return !!userId && Number(note.usuario) === Number(userId)
}

const notes = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const search = ref('')
const filterProject = ref('')
const editingId = ref(null)
const orderSaving = ref(false)
const draggingId = ref(null)
const dropTargetId = ref(null)
const previewOrder = ref(null)
const dragOriginalOrder = ref(null)
const dragXY = ref({ x: 0, y: 0 })
let pointerId = null
let dragHandle = null
const composerOpen = ref(false)
const titleField = ref(null)
const modalDialog = ref(null)
let previousFocus = null
let previousBodyOverflow = ''
const photoFile = ref(null)
const localPhotoUrl = ref('')
const savedPhotoUrl = ref('')
const removePhoto = ref(false)
const fileInput = ref(null)
const photoPreview = computed(() => localPhotoUrl.value || (!removePhoto.value ? savedPhotoUrl.value : ''))
const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function clearTemporaryPhoto() {
  if (localPhotoUrl.value) URL.revokeObjectURL(localPhotoUrl.value)
  localPhotoUrl.value = ''
  photoFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function choosePhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!supportedTypes.includes(file.type)) {
    error.value = 'Escolha uma foto JPG, PNG, WEBP ou GIF.'
    event.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'A foto não pode ultrapassar 5 MB.'
    event.target.value = ''
    return
  }
  clearTemporaryPhoto()
  photoFile.value = file
  localPhotoUrl.value = URL.createObjectURL(file)
  removePhoto.value = false
  error.value = ''
}

function clearPhoto() {
  clearTemporaryPhoto()
  removePhoto.value = !!editingId.value && !!savedPhotoUrl.value
}

function safeLink(raw) {
  try {
    const parsed = new URL(raw)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}

const canSave = computed(() =>
  !!(form.titulo.trim() || form.conteudo.trim() || form.link.trim() || photoFile.value || photoPreview.value),
)

const form = reactive({
  titulo: '',
  conteudo: '',
  link: '',
  cor: '#FFF475',
  projeto: '',
  etiquetas: '',
  fixada: false,
})

const palette = ['#FFF475', '#F28B82', '#FBBC04', '#CCFF90', '#A7FFEB', '#CBF0F8', '#D7AEFB', '#FDCFE8']

function resetForm() {
  clearTemporaryPhoto()
  savedPhotoUrl.value = ''
  removePhoto.value = false
  editingId.value = null
  form.titulo = ''
  form.conteudo = ''
  form.link = ''
  form.cor = '#FFF475'
  form.projeto = projectId.value
  form.etiquetas = ''
  form.fixada = false
}


function showComposer() {
  if (loading.value || (isProjectMural.value && !projectInfo.value)) return
  previousFocus = document.activeElement
  error.value = ''
  composerOpen.value = true
  nextTick(() => titleField.value?.focus())
}

function openComposer() {
  resetForm()
  showComposer()
}

function closeComposer(force = false) {
  if (saving.value && !force) return
  composerOpen.value = false
  resetForm()
  error.value = ''
  nextTick(() => {
    previousFocus?.focus?.()
    previousFocus = null
  })
}

function handleDialogKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeComposer()
    return
  }
  if (event.key !== 'Tab') return
  const focusable = [...(modalDialog.value?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
  ) || [])]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(composerOpen, (open) => {
  if (open) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
})

function apiError(err, fallback) {
  if (err?.response?.status === 404) {
    return 'A API de notas não foi encontrada no backend configurado. Atualize o backend para a DEV (FEAT-55), aplique as migrações e confirme a variável VITE_URL_BACKEND do frontend.'
  }
  const data = err?.response?.data
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value])
    const text = messages.filter((value) => typeof value === 'string').join(' ')
    if (text) return text
  }
  return err?.message || fallback
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (isProjectMural.value) {
      const { data: project } = await projectsApi.get(projectId.value)
      projectInfo.value = project
      notes.value = sortNotes(await notesApi.listAll({ projeto: projectId.value, arquivada: false }))
    } else {
      projectInfo.value = null
      const [loadedNotes] = await Promise.all([
        notesApi.listAll({ arquivada: false }),
        projectStore.projects.length ? Promise.resolve(projectStore.projects) : projectStore.fetchProjects(),
      ])
      notes.value = loadedNotes
    }
  } catch (err) {
    notes.value = []
    projectInfo.value = null
    error.value = apiError(err, 'Não foi possível carregar o mural.')
  } finally {
    loading.value = false
  }
}


function sortNotes(items) {
  return [...items].sort((a, b) => {
    if (Boolean(a.fixada) !== Boolean(b.fixada)) return a.fixada ? -1 : 1
    const left = Number.isInteger(a.ordem) ? a.ordem : Number.MAX_SAFE_INTEGER
    const right = Number.isInteger(b.ordem) ? b.ordem : Number.MAX_SAFE_INTEGER
    if (left !== right) return left - right
    const ad = Date.parse(a.atualizada_em || a.criada_em || '') || 0
    const bd = Date.parse(b.atualizada_em || b.criada_em || '') || 0
    return bd - ad || Number(b.id) - Number(a.id)
  })
}

const dragAllowed = computed(() =>
  isProjectMural.value && !!projectInfo.value && !search.value.trim()
  && !filterProject.value && !loading.value && !orderSaving.value,
)
const draggingNote = computed(() => notes.value.find((item) => item.id === draggingId.value) || null)

async function moveCard(fromId, toId) {
  if (!dragAllowed.value || fromId === toId) return
  const current = sortNotes(notes.value)
  const fromIndex = current.findIndex((item) => item.id === fromId)
  const targetIndex = current.findIndex((item) => item.id === toId)
  if (fromIndex < 0 || targetIndex < 0) return
  if (Boolean(current[fromIndex].fixada) !== Boolean(current[targetIndex].fixada)) {
    error.value = 'Os cards fixados ficam no topo. Arraste entre cards da mesma seção.'
    return
  }
  const next = [...current]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(targetIndex, 0, moved)
  const previous = notes.value
  notes.value = next.map((note, index) => ({ ...note, ordem: index }))
  orderSaving.value = true
  error.value = ''
  try {
    await notesApi.saveOrder(projectId.value, next.map((note) => note.id))
  } catch (err) {
    notes.value = previous
    error.value = apiError(err, 'Não foi possível salvar a ordem dos cards.')
  } finally {
    orderSaving.value = false
  }
}

function detachPointerListeners() {
  window.removeEventListener('pointermove', moveDrag)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', cancelDrag)
}

// O preview é local: só persiste a ordem no servidor após soltar.
function startDrag(note, event) {
  if (!dragAllowed.value || (event.pointerType === 'mouse' && event.button !== 0)) return
  event.preventDefault()
  pointerId = event.pointerId
  dragHandle = event.currentTarget
  draggingId.value = note.id
  dropTargetId.value = null
  dragXY.value = { x: event.clientX, y: event.clientY }
  dragOriginalOrder.value = sortNotes(notes.value).map(item => item.id)
  previewOrder.value = [...dragOriginalOrder.value]
  error.value = ''
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', cancelDrag)
}

function moveDrag(event) {
  if (pointerId !== event.pointerId || draggingId.value === null) return
  dragXY.value = { x: event.clientX, y: event.clientY }
  const card = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-note-id]')
  const targetId = card ? Number(card.dataset.noteId) : null
  const draggedId = draggingId.value
  if (targetId === null || targetId === draggedId || !previewOrder.value) return
  const dragged = notes.value.find(item => item.id === draggedId)
  const target = notes.value.find(item => item.id === targetId)
  if (!dragged || !target || Boolean(dragged.fixada) !== Boolean(target.fixada)) return
  // Mover o card no array a cada novo alvo faz os demais abrirem espaço imediatamente.
  const next = [...previewOrder.value]
  const fromIndex = next.indexOf(draggedId)
  const targetIndex = next.indexOf(targetId)
  if (fromIndex < 0 || targetIndex < 0) return
  next.splice(fromIndex, 1)
  next.splice(targetIndex, 0, draggedId)
  previewOrder.value = next
  dropTargetId.value = targetId
}

function resetDrag() {
  detachPointerListeners()
  pointerId = null
  dragHandle = null
  draggingId.value = null
  dropTargetId.value = null
  previewOrder.value = null
  dragOriginalOrder.value = null
}

function cancelDrag(event) {
  if (event && pointerId !== event.pointerId) return
  resetDrag()
}

async function endDrag(event) {
  if (pointerId !== event.pointerId) return
  const before = dragOriginalOrder.value
  const after = previewOrder.value
  resetDrag()
  if (!before || !after || before.every((id, index) => id === after[index])) return
  // A ordem otimista já refletida visualmente passa a valer no estado local.
  const previous = notes.value
  const ranks = new Map(after.map((id, index) => [id, index]))
  const next = [...notes.value].sort((a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity))
    .map((note, index) => ({ ...note, ordem: index }))
  notes.value = next
  orderSaving.value = true
  error.value = ''
  try {
    await notesApi.saveOrder(projectId.value, after)
  } catch (err) {
    notes.value = previous
    error.value = apiError(err, 'Não foi possível salvar a ordem dos cards.')
  } finally {
    orderSaving.value = false
  }
}

function moveWithKeyboard(note, direction) {
  if (!dragAllowed.value) return
  const section = sortNotes(notes.value).filter((item) => Boolean(item.fixada) === Boolean(note.fixada))
  const index = section.findIndex((item) => item.id === note.id)
  const target = section[index + direction]
  if (target) void moveCard(note.id, target.id)
}

const visibleNotes = computed(() => {
  const query = search.value.trim().toLowerCase()
  const sorted = sortNotes(notes.value)
  const ranked = previewOrder.value
    ? [...sorted].sort((a, b) => previewOrder.value.indexOf(a.id) - previewOrder.value.indexOf(b.id))
    : sorted
  return ranked.filter((note) => {
    const matchesText =
      !query ||
      note.titulo?.toLowerCase().includes(query) ||
      note.conteudo?.toLowerCase().includes(query) ||
      note.link?.toLowerCase().includes(query) ||
      (note.etiquetas || []).some((tag) => String(tag).toLowerCase().includes(query))
    const matchesProject =
      !filterProject.value || String(note.projeto || '') === String(filterProject.value)
    return matchesText && matchesProject
  })
})

function payload() {
  return {
    titulo: form.titulo.trim(),
    conteudo: form.conteudo.trim(),
    link: form.link.trim(),
    cor: form.cor,
    projeto: isProjectMural.value ? Number(projectId.value) : (form.projeto ? Number(form.projeto) : null),
    etiquetas: form.etiquetas
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    fixada: form.fixada,
    ...(removePhoto.value ? { imagem: null } : {}),
  }
}

function payloadWithPhoto() {
  const data = payload()
  if (!photoFile.value) return data
  const multipart = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (key === 'imagem' || value === null) continue
    multipart.append(key, key === 'etiquetas' ? JSON.stringify(value) : String(value))
  }
  multipart.append('imagem', photoFile.value)
  return multipart
}

async function save() {
  if (saving.value || !canSave.value) return
  if (form.link.trim() && !safeLink(form.link.trim())) {
    error.value = 'Use um endereço HTTP ou HTTPS válido.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const response = editingId.value
      ? await notesApi.update(editingId.value, payloadWithPhoto())
      : await notesApi.create(payloadWithPhoto())

    const saved = response.data
    const index = notes.value.findIndex((item) => item.id === saved.id)
    if (index >= 0) notes.value[index] = saved
    else notes.value.unshift(saved)
    notes.value = sortNotes(notes.value)
    closeComposer(true)
  } catch (err) {
    error.value = apiError(err, 'Não foi possível salvar a nota.')
  } finally {
    saving.value = false
  }
}

function edit(note) {
  if (!isAuthor(note)) return
  editingId.value = note.id
  form.titulo = note.titulo || ''
  form.conteudo = note.conteudo || ''
  form.link = note.link || ''
  clearTemporaryPhoto()
  savedPhotoUrl.value = note.imagem_url || ''
  removePhoto.value = false
  form.cor = note.cor || '#FFF475'
  form.projeto = note.projeto ? String(note.projeto) : ''
  form.etiquetas = (note.etiquetas || []).join(', ')
  form.fixada = Boolean(note.fixada)
  showComposer()
}

async function togglePin(note) {
  if (orderSaving.value) return
  try {
    const { data } = await notesApi.pinForMe(note.id, !note.fixada)
    notes.value = notes.value.map((item) => item.id === data.id ? data : item)
    notes.value = sortNotes(notes.value)
  } catch (err) {
    error.value = apiError(err, 'Não foi possível fixar a nota.')
  }
}

async function archive(note) {
  if (!isAuthor(note)) return
  try {
    await notesApi.update(note.id, { arquivada: true })
    notes.value = notes.value.filter((item) => item.id !== note.id)
    if (editingId.value === note.id) resetForm()
  } catch (err) {
    error.value = apiError(err, 'Não foi possível arquivar a nota.')
  }
}

async function remove(note) {
  if (!isAuthor(note)) return
  if (!window.confirm('Excluir esta nota definitivamente?')) return
  try {
    await notesApi.remove(note.id)
    notes.value = notes.value.filter((item) => item.id !== note.id)
    if (editingId.value === note.id) resetForm()
  } catch (err) {
    error.value = apiError(err, 'Não foi possível excluir a nota.')
  }
}

function projectName(id) {
  return projectStore.projects.find((project) => String(project.id) === String(id))?.nome || projectStore.projects.find((project) => String(project.id) === String(id))?.name || ''
}

onMounted(load)
watch(projectId, () => {
  resetDrag()
  if (composerOpen.value) closeComposer(true)
  resetForm()
  filterProject.value = ''
  notes.value = []
  projectInfo.value = null
  load()
})
onBeforeUnmount(() => {
  resetDrag()
  clearTemporaryPhoto()
  if (composerOpen.value) document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <main class="notes-page">
    <section class="notes-hero">
      <div>
        <span class="eyebrow">{{ isProjectMural ? 'PROJETOS / MURAL COMPARTILHADO' : 'IDEIAS / NOTAS' }}</span>
        <h1>{{ isProjectMural ? (projectInfo?.nome ? 'Mural — ' + projectInfo.nome : 'Mural do projeto') : 'Seu mural.' }}</h1>
        <p>{{ isProjectMural ? 'Compartilhe ideias, fotos e links. Suas fixações e posições dos cards são só suas.' : 'Suas notas pessoais e ideias publicadas por você em projetos.' }}</p>
        <RouterLink v-if="isProjectMural" :to="{ name: 'project-details', params: { id: projectId } }" class="back-to-project">← Voltar ao projeto</RouterLink>
      </div>
    </section>

    <button
      v-if="isProjectMural && projectInfo && !loading"
      type="button"
      class="mural-fab"
      aria-label="Adicionar ideia ao mural"
      title="Adicionar ideia"
      @click="openComposer"
    >
      <span class="mdi mdi-plus" aria-hidden="true"></span>
    </button>

    <Teleport to="body">
      <div v-if="composerOpen" class="composer-backdrop" @click.self="closeComposer()" @keydown="handleDialogKeydown">
        <section
          ref="modalDialog"
          class="composer composer-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="composer-dialog-title"
        >
          <div class="composer-dialog-header">
            <div>
              <span class="composer-dialog-eyebrow">MURAL DE IDEIAS</span>
              <h2 id="composer-dialog-title">{{ editingId ? 'Editar ideia' : 'Nova ideia' }}</h2>
              <p>Compartilhe uma inspiração com a equipe.</p>
            </div>
            <button
              type="button"
              class="composer-close"
              aria-label="Fechar formulário"
              :disabled="saving"
              @click="closeComposer()"
            >
              <span class="mdi mdi-close" aria-hidden="true"></span>
            </button>
          </div>
          <div class="composer-dialog-body">

      <div class="composer-top">
        <input ref="titleField" v-model="form.titulo" maxlength="200" placeholder="Título" aria-label="Título da nota" />
        <label class="pin-check">
          <input v-model="form.fixada" type="checkbox" />
          Fixar
        </label>
      </div>

      <textarea v-model="form.conteudo" rows="4" placeholder="Escreva sua ideia..." aria-label="Conteúdo da nota"></textarea>

      <label class="idea-link">
        Link de referência (opcional)
        <input v-model="form.link" type="url" maxlength="2000" placeholder="https://exemplo.com/referencia" />
      </label>

      <div class="photo-editor">
        <label class="photo-picker">
          Foto da ideia (até 5 MB)
          <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="choosePhoto" />
        </label>
        <div v-if="photoPreview" class="photo-preview">
          <img :src="photoPreview" alt="Prévia da imagem da ideia" />
          <button type="button" class="button secondary" @click="clearPhoto">Remover foto</button>
        </div>
        <p v-else class="photo-hint">Você pode salvar uma ideia só com foto, link ou texto, ou combinar os três.</p>
      </div>

      <div class="composer-grid" :class="{ 'project-only-grid': isProjectMural }">
        <label v-if="!isProjectMural">
          Projeto
          <select v-model="form.projeto">
            <option value="">Nota pessoal</option>
            <option v-for="project in projectStore.projects" :key="project.id" :value="String(project.id)">
              {{ project.name }}
            </option>
          </select>
        </label>

        <label>
          Etiquetas
          <input v-model="form.etiquetas" placeholder="ideia, pesquisa, urgente" />
        </label>
      </div>

      <div class="palette" aria-label="Cor da nota">
        <button
          v-for="color in palette"
          :key="color"
          type="button"
          class="color-choice"
          :class="{ selected: form.cor === color }"
          :style="{ backgroundColor: color }"
          :aria-label="`Usar cor ${color}`"
          @click="form.cor = color"
        ></button>
      </div>


            <p v-if="error" class="error composer-error" role="alert">{{ error }}</p>
          </div>
          <div class="composer-dialog-footer">
      <div class="composer-actions">
        <button type="button" class="button secondary" :disabled="saving" @click="closeComposer()">Cancelar</button>
        <button type="button" class="button primary" :disabled="saving || !canSave" @click="save">
          {{ saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar ideia' }}
        </button>
      </div>
          </div>
        </section>
      </div>
    </Teleport>

    <p v-if="error && !composerOpen" class="error" role="alert">{{ error }}</p>

    <section v-if="!isProjectMural || projectInfo" class="notes-tools" :class="{ 'project-only-grid': isProjectMural }">
      <label>
        <span>Buscar</span>
        <input v-model="search" type="search" placeholder="Título, texto, link ou etiqueta" />
      </label>
      <label v-if="!isProjectMural">
        <span>Projeto</span>
        <select v-model="filterProject">
          <option value="">Todos</option>
          <option v-for="project in projectStore.projects" :key="project.id" :value="String(project.id)">
            {{ project.name }}
          </option>
        </select>
      </label>
    </section>

    <p v-if="isProjectMural && search.trim()" class="drag-hint">Limpe a busca para reorganizar o mural.</p>
    <p v-else-if="isProjectMural && visibleNotes.length" class="drag-hint">
      <span class="mdi mdi-drag-vertical" aria-hidden="true"></span>
      Segure a alça e arraste para organizar os cards. Só você vê essa ordem.
      <span v-if="orderSaving" aria-live="polite">Salvando ordem…</span>
    </p>

    <div v-if="loading" class="state" role="status">Carregando notas...</div>

    <section v-else-if="visibleNotes.length" class="notes-grid" aria-label="Suas notas">
      <article
        v-for="note in visibleNotes"
        :key="note.id"
        class="note-card"
        :class="{ 'note-card-dragging': draggingId === note.id, 'note-card-pinned': note.fixada }"
        :data-note-id="note.id"
        :style="{ backgroundColor: note.cor || '#FFF475' }"
      >
        <div class="note-card-top">
          <button
            v-if="isProjectMural"
            type="button"
            class="drag-handle"
            :disabled="!dragAllowed"
            :aria-label="'Mover ideia: ' + (note.titulo || 'Sem título')"
            title="Segure e arraste; use setas ↑↓ pelo teclado"
            @pointerdown="startDrag(note, $event)"
            @keydown.up.prevent="moveWithKeyboard(note, -1)"
            @keydown.down.prevent="moveWithKeyboard(note, 1)"
          >
            <span class="mdi mdi-drag-vertical" aria-hidden="true"></span>
          </button>
          <span v-if="note.projeto" class="project-chip">{{ projectName(note.projeto) || 'Projeto' }}</span>
          <button type="button" class="icon-button pin-button" :aria-pressed="Boolean(note.fixada)" :title="note.fixada ? 'Desafixar só para mim' : 'Fixar só para mim'" :aria-label="note.fixada ? 'Desafixar só para mim' : 'Fixar só para mim'" @click="togglePin(note)">
            <span :class="note.fixada ? 'mdi mdi-pin' : 'mdi mdi-pin-outline'" aria-hidden="true"></span>
          </button>
        </div>

        <h2 v-if="note.titulo">{{ note.titulo }}</h2>
        <small v-if="isProjectMural" class="note-author">Publicado por {{ note.usuario_nome || 'Participante' }}</small>
        <img v-if="note.imagem_url" :src="note.imagem_url" :alt="note.titulo ? 'Imagem: ' + note.titulo : 'Imagem da ideia'" class="note-image" loading="lazy" />
        <p v-if="note.conteudo" class="note-content">{{ note.conteudo }}</p>
        <a v-if="safeLink(note.link)" class="note-link" :href="safeLink(note.link)" target="_blank" rel="noopener noreferrer">
          <span class="mdi mdi-link-variant" aria-hidden="true"></span>
          {{ note.link }}
        </a>

        <div v-if="note.etiquetas?.length" class="tags">
          <span v-for="tag in note.etiquetas" :key="tag">#{{ tag }}</span>
        </div>

        <div v-if="isAuthor(note)" class="note-actions">
          <button type="button" @click="edit(note)">Editar</button>
          <button type="button" @click="archive(note)">Arquivar</button>
          <button type="button" @click="remove(note)">Excluir</button>
        </div>
      </article>
    </section>

    <div v-else-if="!error" class="state">
      <strong>Nenhuma nota por aqui.</strong>
      <span>Capture a próxima ideia antes que ela fuja.</span>
    </div>

    <Teleport to="body">
      <div
        v-if="draggingNote"
        class="drag-floating-preview"
        :style="{ left: dragXY.x + 'px', top: dragXY.y + 'px' }"
        aria-hidden="true"
      >
        <span class="mdi mdi-drag-vertical"></span>
        {{ draggingNote.titulo || 'Ideia sem título' }}
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.notes-page{max-width:1220px;margin:0 auto;padding:clamp(20px,4vw,44px);color:#171716}.notes-hero{padding:22px 0 30px;border-bottom:2px solid #171716}.eyebrow{font-size:10px;font-weight:800;letter-spacing:1.5px}.notes-hero h1{margin:10px 0 8px;font-size:clamp(34px,5vw,56px);letter-spacing:-2px}.notes-hero p{max-width:680px;margin:0;line-height:1.65;color:#555}.composer{margin:28px 0;padding:22px;border:1px solid #d9d9d4;border-radius:18px;background:#fafaf8;box-shadow:0 8px 28px rgb(0 0 0 / 5%)}.composer-top{display:flex;gap:16px;align-items:center}.composer input,.composer textarea,.composer select,.notes-tools input,.notes-tools select{width:100%;box-sizing:border-box;border:1px solid #d0d0ca;border-radius:10px;background:#fff;color:#171716;font:inherit;padding:12px}.composer-top>input{border:0;border-bottom:1px solid #ddd;border-radius:0;background:transparent;font-size:20px;font-weight:700}.composer textarea{margin-top:12px;resize:vertical}.pin-check{display:flex!important;flex-direction:row!important;align-items:center;gap:7px;white-space:nowrap}.pin-check input{width:auto}.composer-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.composer-grid label,.notes-tools label{display:grid;gap:7px;font-size:11px;font-weight:700}.palette{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.color-choice{width:28px;height:28px;border:1px solid #aaa;border-radius:50%;cursor:pointer}.color-choice.selected{outline:3px solid #171716;outline-offset:2px}.composer-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.button{min-height:42px;padding:10px 17px;border:1px solid #171716;border-radius:999px;font:inherit;font-weight:700;cursor:pointer}.button.primary{background:#171716;color:#fff}.button.secondary{background:#fff;color:#171716}.button:disabled{opacity:.55;cursor:not-allowed}.error{padding:12px 14px;border:1px solid #cc7e7e;border-radius:10px;background:#fff1f1;color:#7f2020}.notes-tools{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin:26px 0}.notes-grid{columns:3 280px;column-gap:18px}.note-card{break-inside:avoid;margin:0 0 18px;padding:18px;border:1px solid rgb(0 0 0 / 18%);border-radius:16px;box-shadow:0 4px 14px rgb(0 0 0 / 5%);overflow-wrap:anywhere}.note-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.project-chip{max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 8px;border:1px solid rgb(0 0 0 / 24%);border-radius:999px;font-size:10px;font-weight:700}.icon-button{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:50%;background:rgb(255 255 255 / 50%);font-size:19px;cursor:pointer}.note-card h2{margin:15px 0 8px;font-size:20px}.note-content{margin:0;white-space:pre-wrap;line-height:1.55}.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}.tags span{padding:4px 7px;border-radius:999px;background:rgb(255 255 255 / 48%);font-size:10px}.note-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;padding-top:12px;border-top:1px solid rgb(0 0 0 / 15%)}.note-actions button{border:0;background:transparent;padding:4px 2px;font:inherit;font-size:11px;font-weight:700;text-decoration:underline;cursor:pointer}.state{display:flex;flex-direction:column;align-items:center;gap:7px;padding:46px 20px;border:1px dashed #bbb;border-radius:16px;text-align:center;color:#555}@media(max-width:700px){.notes-page{padding:20px 14px 90px}.composer-grid,.notes-tools{grid-template-columns:1fr}.notes-grid{columns:1}.composer-top{align-items:flex-start;flex-direction:column}.pin-check{align-self:flex-end}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
.idea-link{display:grid;gap:7px;margin-top:14px;font-size:11px;font-weight:700}
.photo-editor{margin-top:16px;display:grid;gap:12px}
.photo-picker{display:grid;gap:8px;font-size:11px;font-weight:700}
.photo-picker input{padding:10px;background:#fff}
.photo-preview{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap}
.photo-preview img{max-width:240px;max-height:220px;width:auto;height:auto;object-fit:contain;border-radius:12px;border:1px solid #d9d9d4}
.photo-hint{margin:0;color:#61615c;font-size:12px}
.note-image{display:block;width:100%;max-height:320px;object-fit:cover;border-radius:10px;margin-top:12px}
.note-link{display:flex;align-items:center;gap:6px;max-width:100%;margin-top:12px;color:#244c91;font-size:12px;overflow-wrap:anywhere;word-break:break-all}
.note-link:hover{text-decoration:none}
.back-to-project{display:inline-flex;margin-top:18px;color:#171716;font-size:13px;font-weight:700;text-decoration:underline}
.back-to-project:hover{opacity:.7}
.note-author{display:block;margin:8px 0 12px;font-size:11px;font-weight:650;color:#52524e}
.composer-grid.project-only-grid,.notes-tools.project-only-grid{grid-template-columns:1fr}

/* FEAT-64: botão de criação e formulário em modal */
.mural-fab {
  position: fixed;
  right: clamp(20px, 3vw, 44px);
  bottom: 30px;
  z-index: 1200;
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  border: 1px solid #111;
  border-radius: 50%;
  background: #171716;
  color: #fff;
  box-shadow: 0 10px 28px rgb(0 0 0 / 24%);
  cursor: pointer;
  transition: transform .16s ease, background .16s ease, box-shadow .16s ease;
}
.mural-fab .mdi { font-size: 31px; }
.mural-fab:hover { transform: translateY(-3px); background: #30302c; box-shadow: 0 14px 32px rgb(0 0 0 / 26%); }
.mural-fab:focus-visible, .composer-close:focus-visible { outline: 3px solid #c0d877; outline-offset: 3px; }
.composer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(17 17 16 / 65%);
  backdrop-filter: blur(5px);
}
.composer-modal {
  display: flex;
  flex-direction: column;
  width: min(720px, 100%);
  max-height: min(88dvh, 820px);
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #fafaf8;
  border: 1px solid #e4e4df;
  border-radius: 22px;
  box-shadow: 0 24px 75px rgb(0 0 0 / 24%);
}
.composer-dialog-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  padding: 23px 26px 18px;
  border-bottom: 1px solid #e6e6de;
}
.composer-dialog-eyebrow { color: #777770; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; }
.composer-dialog-header h2 { margin: 5px 0; color: #171716; font-size: 27px; letter-spacing: -.8px; }
.composer-dialog-header p { margin: 0; color: #666660; font-size: 13px; line-height: 1.5; }
.composer-close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: #eeeee9;
  color: #33332d;
  cursor: pointer;
}
.composer-close .mdi { font-size: 22px; }
.composer-close:hover { background: #e0e0d9; }
.composer-dialog-body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 20px 26px; }
.composer-dialog-body .composer-top > input { padding-left: 0; }
.composer-error { margin: 15px 0 0; }
.composer-dialog-footer { padding: 16px 26px; border-top: 1px solid #e6e6de; background: #fafaf8; }
.composer-dialog-footer .composer-actions { margin-top: 0; }
@media(max-width:700px) {
  .mural-fab { width: 58px; height: 58px; right: 17px; bottom: calc(78px + env(safe-area-inset-bottom)); }
  .mural-fab .mdi { font-size: 28px; }
  .composer-backdrop { padding: 10px; }
  .composer-modal { max-height: calc(100dvh - 20px); border-radius: 17px; }
  .composer-dialog-header { padding: 17px 17px 14px; }
  .composer-dialog-header h2 { font-size: 22px; }
  .composer-dialog-body { padding: 15px 17px; }
  .composer-dialog-footer { padding: 13px 17px calc(13px + env(safe-area-inset-bottom)); }
}
@media(prefers-reduced-motion:reduce) {
  .mural-fab { transition: none; }
}

/* FEAT-65: organização pessoal */
.notes-grid { columns: unset; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 18px; align-items: start; }
.note-card { margin: 0; min-width: 0; transition: box-shadow .12s ease, opacity .12s ease, outline-color .12s ease; }
.note-card-pinned { box-shadow: 0 4px 0 rgb(20 20 20 / 18%), 0 9px 22px rgb(0 0 0 / 7%); }
.note-card-dragging { opacity: .44; }
.note-card-drop { outline: 3px dashed #171716; outline-offset: 3px; }
.drag-hint { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin: 14px 0 0; color: #62625d; font-size: 12px; }
.drag-hint .mdi { font-size: 19px; }
.note-card-top { gap: 8px; }
.note-card-top .project-chip { flex: 1; margin-right: auto; }
.drag-handle { display: grid; place-items: center; flex: 0 0 32px; width: 32px; height: 34px; padding: 0; border: none; border-radius: 8px; background: rgb(255 255 255 / 50%); color: #393933; cursor: grab; touch-action: none; user-select: none; }
.drag-handle:active { cursor: grabbing; }
.drag-handle:disabled { cursor: not-allowed; opacity: .4; }
.drag-handle:focus-visible, .pin-button:focus-visible { outline: 3px solid #171716; outline-offset: 2px; }
.drag-handle .mdi { font-size: 20px; pointer-events: none; }
.pin-button[aria-pressed="true"] { background: #171716; color: #fff; }
.pin-button[aria-pressed="false"] { background: rgb(255 255 255 / 70%); }
.drag-floating-preview { position: fixed; z-index: 9999; pointer-events: none; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 12px; background: #171716; box-shadow: 0 12px 30px rgb(0 0 0 / 23%); color: white; transform: translate(-50%, -50%); font-size: 13px; font-weight: 700; }
@media(max-width:700px){ .notes-grid { grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); gap: 14px; } .drag-handle{width: 38px; height: 38px; flex-basis: 38px;} }

/* FEAT-81 — masonry: cards usam a própria altura, sem reservar a altura da linha. */
.notes-grid {
  display: block;
  columns: 3 280px;
  column-gap: 18px;
}
.note-card {
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
  vertical-align: top;
  break-inside: avoid;
  margin: 0 0 18px;
  transition: opacity .14s ease, box-shadow .14s ease;
}
.note-card-dragging {
  opacity: .28;
  outline: 2px dashed #171716;
  outline-offset: -5px;
}
.drag-handle { touch-action: none; }
@media(max-width:700px) {
  .notes-grid { columns: 1; }
  .note-card { margin-bottom: 14px; }
}
@media(prefers-reduced-motion:reduce) {
  .note-card { transition: none; }
}
</style>
