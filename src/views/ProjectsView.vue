<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import ProjectEditModal from '@/components/project/ProjectEditModal.vue'
import projectsApi from '@/api/projectsApi'

const store = useProjectStore()

const search = ref('')
const status = ref('all')
const error = ref('')
const createError = ref('')
const showCreate = ref(false)
const saving = ref(false)
const projectProgress = ref({})

function progressFor(id) {
  return projectProgress.value[String(id)] || { loading: true, total: 0, completed: 0, percent: 0 }
}

async function loadProgress(projects) {
  const ids = new Set(projects.map(project => String(project.id)))
  projectProgress.value = Object.fromEntries([...ids].map(id => [id, { loading: true, total: 0, completed: 0, percent: 0 }]))
  await Promise.allSettled([...ids].map(async id => {
    try {
      const { data } = await projectsApi.kanban(id)
      const board = data?.kanban || data
      const groups = ['planejado', 'em_andamento', 'concluido']
      const lists = groups.map(key => Array.isArray(board?.[key]) ? board[key] : [])
      const total = lists.reduce((sum, list) => sum + list.length, 0)
      const completed = lists[2].length
      projectProgress.value[id] = { loading: false, total, completed, percent: total ? Math.round(completed / total * 100) : 0 }
    } catch {
      projectProgress.value[id] = { loading: false, unavailable: true, total: 0, completed: 0, percent: 0 }
    }
  }))
}

const statuses = {
  planned: 'Planejado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const filteredProjects = computed(() => {
  const query = normalize(search.value.trim())

  return store.projects.filter((project) => {
    const matchesName = normalize(project.name).includes(query)
    const matchesStatus =
      status.value === 'all' || project.status === status.value

    return matchesName && matchesStatus
  })
})

async function loadProjects() {
  error.value = ''

  try {
    await store.fetchProjects()
    await loadProgress(store.projects)
  } catch (e) {
    error.value = e.message || 'Não foi possível carregar os projetos.'
  }
}

function openCreate() {
  createError.value = ''
  showCreate.value = true
}

function closeCreate() {
  if (!saving.value) {
    showCreate.value = false
  }
}

function clearFilters() {
  search.value = ''
  status.value = 'all'
}

async function createProject(data) {
  if (saving.value) return

  saving.value = true
  createError.value = ''

  try {
    const created = await store.createProject(data)
    await loadProgress([created, ...store.projects])
    clearFilters()
    showCreate.value = false
  } catch (e) {
    createError.value = e.message || 'Não foi possível criar o projeto.'
  } finally {
    saving.value = false
  }
}

onMounted(loadProjects)
</script>

<template>
  <div class="projects-page">
    <div class="projects-container">
      <header class="page-heading projects-banner">
        <div>
          <span class="eyebrow">MOMENTUM / ORGANIZAÇÃO</span>
          <h1>Seus projetos.</h1>
          <p>
            Um espaço para organizar ideias e acompanhar suas entregas.
          </p>
        </div>

        <button
          type="button"
          class="button button--primary"
          :disabled="store.loading || !!error"
          @click="openCreate"
        >
          <span aria-hidden="true">+</span>
          Novo projeto
        </button>
        <div class="projects-banner__decoration" aria-hidden="true"><span></span><span></span></div>
      </header>

      <div class="project-filters">
        <label class="search-field">
          <span>Buscar projeto</span>
          <input
            v-model="search"
            type="search"
            placeholder="Digite o nome do projeto"
          />
        </label>

        <label class="status-field">
          <span>Status</span>
          <select v-model="status">
            <option value="all">Todos os status</option>
            <option
              v-for="(label, value) in statuses"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="store.loading" class="empty-state" role="status">
        <p>Carregando projetos...</p>
      </div>

      <div v-else-if="error" class="empty-state" role="alert">
        <h2>Não foi possível carregar</h2>
        <ToastNotice :message="error" type="error" />
        <button type="button" class="button" @click="loadProjects">
          Tentar novamente
        </button>
      </div>

      <template v-else>
        <p class="results" role="status">
          {{ filteredProjects.length }} projeto(s) encontrado(s)
        </p>

        <div v-if="filteredProjects.length" class="project-grid">
          <RouterLink
            v-for="project in filteredProjects"
            :key="project.id"
            class="project-card"
            :to="{
              name: 'project-details',
              params: { id: project.id },
            }"
          >
            <div class="project-card__top">
              <span class="project-status">
                <span class="project-status__dot" aria-hidden="true"></span>
                {{ statuses[project.status] || project.status }}
              </span>

            </div>

            <div class="project-card__body">
              <h2>{{ project.name }}</h2>
              <p>{{ project.description || 'Sem descrição por enquanto.' }}</p>
            </div>

            <div class="project-card__progress">
              <div class="project-card__progress-heading">
                <span>Progresso das tarefas</span>
                <strong v-if="!progressFor(project.id).loading && !progressFor(project.id).unavailable">{{ progressFor(project.id).percent }}%</strong>
                <span v-else class="project-card__progress-placeholder">{{ progressFor(project.id).loading ? 'Carregando' : 'Indisponível' }}</span>
              </div>
              <div
                class="project-card__progress-track"
                role="progressbar"
                :aria-label="`Progresso do projeto ${project.name}`"
                :aria-valuenow="progressFor(project.id).unavailable ? undefined : progressFor(project.id).percent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span :style="{ width: `${progressFor(project.id).percent}%` }"></span>
              </div>
              <p class="project-card__progress-caption">
                <template v-if="progressFor(project.id).loading">Buscando tarefas...</template>
                <template v-else-if="progressFor(project.id).unavailable">Não foi possível carregar o progresso.</template>
                <template v-else>{{ progressFor(project.id).completed }} de {{ progressFor(project.id).total }} tarefas concluídas</template>
              </p>
            </div>


          </RouterLink>
        </div>

        <div v-else class="empty-state">
          <h2>
            {{
              store.projects.length
                ? 'Nenhum resultado'
                : 'Seu próximo projeto começa aqui.'
            }}
          </h2>

          <p>
            {{
              store.projects.length
                ? 'Tente outro nome ou altere o filtro de status.'
                : 'Crie um projeto para começar a organizar suas ideias.'
            }}
          </p>

          <button
            v-if="!store.projects.length"
            type="button"
            class="button button--primary"
            @click="openCreate"
          >
            Criar primeiro projeto
          </button>

          <button
            v-else
            type="button"
            class="button"
            @click="clearFilters"
          >
            Limpar filtros
          </button>
        </div>
      </template>

      <ProjectEditModal
        v-if="showCreate"
        :project="{}"
        mode="create"
        :saving="saving"
        :error="createError"
        @close="closeCreate"
        @save="createProject"
      />
    </div>
  </div>
</template>

<style scoped>
.projects-page .projects-banner{position:relative;display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:210px;padding:36px;border:0;border-radius:12px;background:#171717;color:#fff;overflow:hidden;isolation:isolate}
.projects-page .projects-banner>div:first-child{position:relative;z-index:1;max-width:520px;min-width:0}
.projects-page .projects-banner .eyebrow{display:block;margin-bottom:16px;color:#a3a3a3;font-size:.68rem;letter-spacing:.14em}
.projects-page .projects-banner h1{margin:0;color:#fff;font-size:clamp(2.3rem,5vw,3.4rem);font-weight:600;letter-spacing:-.07em;line-height:1.08}
.projects-page .projects-banner p{margin-top:14px;color:#b5b5b5;font-size:.9rem;line-height:1.7}
.projects-page .projects-banner>.button{position:relative;z-index:2;flex-shrink:0;border-color:#fff;background:#fff;color:#171717}
.projects-page .projects-banner>.button:hover:not(:disabled){background:#ededed}
.projects-banner__decoration{position:absolute;top:-110px;right:70px;width:310px;height:310px;pointer-events:none}
.projects-banner__decoration span{position:absolute;inset:0;border:1px solid rgb(255 255 255 / 8%);border-radius:50%}
.projects-banner__decoration span:nth-child(2){inset:35px}
@media(max-width:650px){.projects-page .projects-banner{min-height:0;flex-direction:column;align-items:stretch;padding:28px 22px}.projects-page .projects-banner>div:first-child{flex:auto}.projects-page .projects-banner>.button{width:100%}.projects-banner__decoration{right:-170px}}

.projects-page {
  min-height: 100%;
  padding: clamp(20px, 4vw, 44px);
  box-sizing: border-box;
  background: #fff;
  color: #000;
}

.projects-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  padding-bottom: 32px;
  border-bottom: 2px solid #000;
}

.page-heading > div {
  flex: 1;
  min-width: min(100%, 260px);
}

.eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.6px;
}

h1 {
  margin: 14px 0;
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 700;
  letter-spacing: -1.5px;
  line-height: 1.1;
}

.page-heading p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  padding: 12px 20px;
  border: 1px solid #000;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.button--primary {
  background: #000;
  color: #fff;
}

.button > span {
  font-size: 22px;
  line-height: 1;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.project-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 28px 0 20px;
}

.project-filters label {
  display: grid;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
}

.search-field {
  flex: 1 1 260px;
}

.status-field {
  flex: 0 1 210px;
}

input,
select {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid #000;
  border-radius: 10px;
  background: #fff;
  color: #000;
  font: inherit;
  font-size: 16px;
  font-weight: 400;
}

input::placeholder {
  color: #000;
  opacity: 1;
}

.results {
  margin: 0 0 20px;
  font-size: 12px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.project-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 245px;
  padding: 24px;
  border: 1px solid #000;
  border-radius: 18px;
  background: #fff;
  color: #000;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 0 #000;
}

.project-status {
  padding: 5px 10px;
  border: 1px solid #000;
  border-radius: 999px;
  font-size: 11px;
}

.project-card h2 {
  margin: 22px 0 10px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.6px;
}

.project-card > p {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 28px;
  font-size: 13px;
  line-height: 1.7;
}

.project-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding-top: 16px;
  margin-top: auto;
  border-top: 1px solid #000;
  font-size: 12px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 24px;
  border: 1px dashed #000;
  border-radius: 18px;
  text-align: center;
}

.empty-state h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}

:is(button, a, input, select):focus-visible {
  outline: 2px solid #000;
  outline-offset: 4px;
}

@media (max-width: 1100px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .projects-page {
    padding: 24px 16px;
  }

  .project-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .status-field {
    flex: 1 1 100%;
  }

  .page-heading > .button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    transition: none;
  }
}

/* Cartões com hierarquia visual e progresso real das tarefas */
.projects-page .project-card{align-items:stretch;gap:0;min-height:286px;padding:24px;border:1px solid #e5e5e5;border-radius:16px;box-shadow:0 2px 8px rgb(0 0 0 / 2%);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.projects-page .project-card:hover{transform:translateY(-3px);border-color:#c9c9c9;box-shadow:0 12px 28px rgb(0 0 0 / 8%)}
.project-card__top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.projects-page .project-status{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border:1px solid #e7e7e7;border-radius:999px;background:#f8f8f8;color:#444;font-size:11px;font-weight:600}
.project-status__dot{width:7px;height:7px;flex:0 0 7px;border-radius:50%;background:#171717}
.project-card__arrow{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#f5f5f5;color:#555;font-size:16px}
.project-card__body{flex:1 1 auto;min-width:0}
.projects-page .project-card h2{margin:22px 0 8px;font-size:21px;letter-spacing:-.035em;line-height:1.3}
.projects-page .project-card__body>p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;margin:0 0 24px;color:#737373;font-size:13px;line-height:1.55}
.project-card__progress{margin-top:auto;padding:15px 0 18px;border-top:1px solid #ededed}
.project-card__progress-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;color:#5d5d5d;font-size:12px;font-weight:600}
.project-card__progress-heading strong{color:#171717;font-size:14px;font-weight:750}
.project-card__progress-placeholder{color:#888;font-size:11px;font-weight:400}
.project-card__progress-track{height:8px;overflow:hidden;border-radius:999px;background:#ececec}
.project-card__progress-track>span{display:block;height:100%;border-radius:inherit;background:#171717;transition:width .25s ease}
.project-card__progress-caption{margin:9px 0 0;color:#888;font-size:11px;line-height:1.4}
.projects-page .project-card__footer{align-items:center;padding-top:15px;margin-top:0;border-top:1px solid #ededed;color:#171717;font-size:12px;font-weight:700}
.projects-page .project-card__footer>span{font-size:18px}
.projects-page .project-card:focus-visible{outline:3px solid #737373;outline-offset:3px}
@media(max-width:650px){.projects-page .project-card{min-height:260px;padding:20px}.projects-page .project-card h2{font-size:20px}}
@media(prefers-reduced-motion:reduce){.projects-page .project-card,.project-card__progress-track>span{transition:none}}
</style>