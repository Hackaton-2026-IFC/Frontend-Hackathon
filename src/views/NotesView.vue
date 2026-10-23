<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import notesApi from '@/api/notesApi'
import { useProjectStore } from '@/stores/project'

const projectStore = useProjectStore()

const notes = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const search = ref('')
const filterProject = ref('')
const editingId = ref(null)

const form = reactive({
  titulo: '',
  conteudo: '',
  cor: '#FFF475',
  projeto: '',
  etiquetas: '',
  fixada: false,
})

const palette = ['#FFF475', '#F28B82', '#FBBC04', '#CCFF90', '#A7FFEB', '#CBF0F8', '#D7AEFB', '#FDCFE8']

function resetForm() {
  editingId.value = null
  form.titulo = ''
  form.conteudo = ''
  form.cor = '#FFF475'
  form.projeto = ''
  form.etiquetas = ''
  form.fixada = false
}

function apiError(err, fallback) {
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
    const [loadedNotes] = await Promise.all([
      notesApi.listAll({ arquivada: false }),
      projectStore.projects.length ? Promise.resolve(projectStore.projects) : projectStore.fetchProjects(),
    ])
    notes.value = loadedNotes
  } catch (err) {
    error.value = apiError(err, 'Não foi possível carregar suas notas.')
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
    cor: form.cor,
    projeto: form.projeto ? Number(form.projeto) : null,
    etiquetas: form.etiquetas
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    fixada: form.fixada,
  }
}

async function save() {
  if (saving.value) return
  saving.value = true
  error.value = ''
  try {
    const response = editingId.value
      ? await notesApi.update(editingId.value, payload())
      : await notesApi.create(payload())

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
  editingId.value = note.id
  form.titulo = note.titulo || ''
  form.conteudo = note.conteudo || ''
  form.cor = note.cor || '#FFF475'
  form.projeto = note.projeto ? String(note.projeto) : ''
  form.etiquetas = (note.etiquetas || []).join(', ')
  form.fixada = Boolean(note.fixada)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function togglePin(note) {
  try {
    const { data } = await notesApi.update(note.id, { fixada: !note.fixada })
    notes.value = notes.value.map((item) => item.id === data.id ? data : item)
    notes.value = [...notes.value].sort((a, b) => Number(b.fixada) - Number(a.fixada))
  } catch (err) {
    error.value = apiError(err, 'Não foi possível fixar a nota.')
  }
}

async function archive(note) {
  try {
    await notesApi.update(note.id, { arquivada: true })
    notes.value = notes.value.filter((item) => item.id !== note.id)
    if (editingId.value === note.id) resetForm()
  } catch (err) {
    error.value = apiError(err, 'Não foi possível arquivar a nota.')
  }
}

async function remove(note) {
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
  return projectStore.projects.find((project) => String(project.id) === String(id))?.name || ''
}

onMounted(load)
</script>

<template>
  <main class="notes-page">
    <section class="notes-hero">
      <div>
        <span class="eyebrow">IDEIAS / NOTAS</span>
        <h1>Seu mural.</h1>
        <p>Capture uma ideia em segundos e conecte-a a um projeto quando fizer sentido.</p>
      </div>
    </section>

    <section class="composer" aria-label="Criar ou editar nota">
      <div class="composer-top">
        <input v-model="form.titulo" maxlength="200" placeholder="Título" aria-label="Título da nota" />
        <label class="pin-check">
          <input v-model="form.fixada" type="checkbox" />
          Fixar
        </label>
      </div>

      <textarea v-model="form.conteudo" rows="4" placeholder="Escreva sua ideia..." aria-label="Conteúdo da nota"></textarea>

      <div class="composer-grid">
        <label>
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
        <button type="button" class="button primary" :disabled="saving" @click="save">
          {{ saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar nota' }}
        </button>
      </div>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <section class="notes-tools">
      <label>
        <span>Buscar</span>
        <input v-model="search" type="search" placeholder="Título, conteúdo ou etiqueta" />
      </label>
      <label>
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
          <button type="button" class="icon-button" :title="note.fixada ? 'Desafixar' : 'Fixar'" @click="togglePin(note)">
            <span :class="note.fixada ? 'mdi mdi-pin' : 'mdi mdi-pin-outline'" aria-hidden="true"></span>
          </button>
        </div>

        <h2 v-if="note.titulo">{{ note.titulo }}</h2>
        <p v-if="note.conteudo" class="note-content">{{ note.conteudo }}</p>

        <div v-if="note.etiquetas?.length" class="tags">
          <span v-for="tag in note.etiquetas" :key="tag">#{{ tag }}</span>
        </div>

        <div class="note-actions">
          <button type="button" @click="edit(note)">Editar</button>
          <button type="button" @click="archive(note)">Arquivar</button>
          <button type="button" @click="remove(note)">Excluir</button>
        </div>
      </article>
    </section>

    <div v-else class="state">
      <strong>Nenhuma nota por aqui.</strong>
      <span>Joga a próxima ideia ali em cima antes que ela fuja, gênio.</span>
    </div>
  </main>
</template>

<style scoped>
.notes-page{max-width:1220px;margin:0 auto;padding:clamp(20px,4vw,44px);color:#171716}.notes-hero{padding:22px 0 30px;border-bottom:2px solid #171716}.eyebrow{font-size:10px;font-weight:800;letter-spacing:1.5px}.notes-hero h1{margin:10px 0 8px;font-size:clamp(34px,5vw,56px);letter-spacing:-2px}.notes-hero p{max-width:680px;margin:0;line-height:1.65;color:#555}.composer{margin:28px 0;padding:22px;border:1px solid #d9d9d4;border-radius:18px;background:#fafaf8;box-shadow:0 8px 28px rgb(0 0 0 / 5%)}.composer-top{display:flex;gap:16px;align-items:center}.composer input,.composer textarea,.composer select,.notes-tools input,.notes-tools select{width:100%;box-sizing:border-box;border:1px solid #d0d0ca;border-radius:10px;background:#fff;color:#171716;font:inherit;padding:12px}.composer-top>input{border:0;border-bottom:1px solid #ddd;border-radius:0;background:transparent;font-size:20px;font-weight:700}.composer textarea{margin-top:12px;resize:vertical}.pin-check{display:flex!important;flex-direction:row!important;align-items:center;gap:7px;white-space:nowrap}.pin-check input{width:auto}.composer-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.composer-grid label,.notes-tools label{display:grid;gap:7px;font-size:11px;font-weight:700}.palette{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.color-choice{width:28px;height:28px;border:1px solid #aaa;border-radius:50%;cursor:pointer}.color-choice.selected{outline:3px solid #171716;outline-offset:2px}.composer-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.button{min-height:42px;padding:10px 17px;border:1px solid #171716;border-radius:999px;font:inherit;font-weight:700;cursor:pointer}.button.primary{background:#171716;color:#fff}.button.secondary{background:#fff;color:#171716}.button:disabled{opacity:.55;cursor:not-allowed}.error{padding:12px 14px;border:1px solid #cc7e7e;border-radius:10px;background:#fff1f1;color:#7f2020}.notes-tools{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin:26px 0}.notes-grid{columns:3 280px;column-gap:18px}.note-card{break-inside:avoid;margin:0 0 18px;padding:18px;border:1px solid rgb(0 0 0 / 18%);border-radius:16px;box-shadow:0 4px 14px rgb(0 0 0 / 5%);overflow-wrap:anywhere}.note-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.project-chip{max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 8px;border:1px solid rgb(0 0 0 / 24%);border-radius:999px;font-size:10px;font-weight:700}.icon-button{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:50%;background:rgb(255 255 255 / 50%);font-size:19px;cursor:pointer}.note-card h2{margin:15px 0 8px;font-size:20px}.note-content{margin:0;white-space:pre-wrap;line-height:1.55}.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}.tags span{padding:4px 7px;border-radius:999px;background:rgb(255 255 255 / 48%);font-size:10px}.note-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;padding-top:12px;border-top:1px solid rgb(0 0 0 / 15%)}.note-actions button{border:0;background:transparent;padding:4px 2px;font:inherit;font-size:11px;font-weight:700;text-decoration:underline;cursor:pointer}.state{display:flex;flex-direction:column;align-items:center;gap:7px;padding:46px 20px;border:1px dashed #bbb;border-radius:16px;text-align:center;color:#555}@media(max-width:700px){.notes-page{padding:20px 14px 90px}.composer-grid,.notes-tools{grid-template-columns:1fr}.notes-grid{columns:1}.composer-top{align-items:flex-start;flex-direction:column}.pin-check{align-self:flex-end}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style>
