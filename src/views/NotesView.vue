<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
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
      notes.value = await notesApi.listAll({ projeto: projectId.value, arquivada: false })
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

const visibleNotes = computed(() => {
  const query = search.value.trim().toLowerCase()
  return notes.value.filter((note) => {
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
    notes.value = [...notes.value].sort((a, b) => Number(b.fixada) - Number(a.fixada))
    resetForm()
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
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function togglePin(note) {
  if (!isAuthor(note)) return
  try {
    const { data } = await notesApi.update(note.id, { fixada: !note.fixada })
    notes.value = notes.value.map((item) => item.id === data.id ? data : item)
    notes.value = [...notes.value].sort((a, b) => Number(b.fixada) - Number(a.fixada))
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
  resetForm()
  filterProject.value = ''
  notes.value = []
  projectInfo.value = null
  load()
})
onBeforeUnmount(clearTemporaryPhoto)
</script>

<template>
  <main class="notes-page">
    <section class="notes-hero">
      <div>
        <span class="eyebrow">{{ isProjectMural ? 'PROJETOS / MURAL COMPARTILHADO' : 'IDEIAS / NOTAS' }}</span>
        <h1>{{ isProjectMural ? (projectInfo?.nome ? 'Mural — ' + projectInfo.nome : 'Mural do projeto') : 'Seu mural.' }}</h1>
        <p>{{ isProjectMural ? 'Compartilhe ideias, fotos e links com todos os participantes deste projeto.' : 'Suas notas pessoais e ideias publicadas por você em projetos.' }}</p>
        <RouterLink v-if="isProjectMural" :to="{ name: 'project-details', params: { id: projectId } }" class="back-to-project">← Voltar ao projeto</RouterLink>
      </div>
    </section>

    <section v-if="!isProjectMural || projectInfo" class="composer" aria-label="Criar ou editar nota">
      <div class="composer-top">
        <input v-model="form.titulo" maxlength="200" placeholder="Título" aria-label="Título da nota" />
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

      <div class="composer-actions">
        <button v-if="editingId" type="button" class="button secondary" @click="resetForm">Cancelar</button>
        <button type="button" class="button primary" :disabled="saving || !canSave" @click="save">
          {{ saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar nota' }}
        </button>
      </div>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

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

    <div v-if="loading" class="state" role="status">Carregando notas...</div>

    <section v-else-if="visibleNotes.length" class="notes-grid" aria-label="Suas notas">
      <article
        v-for="note in visibleNotes"
        :key="note.id"
        class="note-card"
        :style="{ backgroundColor: note.cor || '#FFF475' }"
      >
        <div class="note-card-top">
          <span v-if="note.projeto" class="project-chip">{{ projectName(note.projeto) || 'Projeto' }}</span>
          <button v-if="isAuthor(note)" type="button" class="icon-button" :title="note.fixada ? 'Desafixar' : 'Fixar'" @click="togglePin(note)">
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
</style>
