<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import ProjectEditModal from '@/components/project/ProjectEditModal.vue'

const store = useProjectStore()

const search = ref('')
const status = ref('all')
const error = ref('')
const createError = ref('')
const showCreate = ref(false)
const saving = ref(false)

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

function projectProgress(project) {
  const direct = Number(project.progress ?? project.progresso ?? project.progress_percentage)
  if (Number.isFinite(direct) && direct >= 0) return Math.min(100, Math.round(direct))
  const tasks = Array.isArray(project.tasks) ? project.tasks : []
  if (!tasks.length) return 0
  const done = tasks.filter((task) => ['completed', 'concluido', 'concluído'].includes(task.status)).length
  return Math.round((done / tasks.length) * 100)
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
    await store.createProject(data)
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
      <header class="page-heading">
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
            <span class="project-status">
              {{ statuses[project.status] || project.status }}
            </span>

            <h2>{{ project.name }}</h2>
            <p>
              {{ project.description || 'Sem descrição por enquanto.' }}
            </p>

            <div class="project-progress">
              <div class="project-progress__labels">
                <span>Progresso do projeto</span>
                <strong>{{ projectProgress(project) }}%</strong>
              </div>
              <div
                class="project-progress__track"
                role="progressbar"
                :aria-valuenow="projectProgress(project)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`Progresso de ${project.name}`"
              >
                <span :style="{ width: `${projectProgress(project)}%` }"></span>
              </div>
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
.projects-page {
  min-height: 100%;
  padding: clamp(16px, 3vw, 40px);
  box-sizing: border-box;
  background: #fff;
  color: #171717;
}
.projects-container { max-width: 1200px; margin: 0 auto; }
.page-heading {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  overflow: hidden;
  padding: clamp(24px, 3vw, 36px);
  border-radius: 12px;
  background: #171717;
  color: #fff;
}
.page-heading::after {
  content: '';
  position: absolute;
  right: 6%;
  top: -120px;
  width: 280px;
  height: 280px;
  border: 1px solid #303030;
  border-radius: 50%;
  box-shadow: 0 0 0 30px #171717, 0 0 0 31px #303030;
  pointer-events: none;
}
.page-heading > div { position: relative; z-index: 1; flex: 1; min-width: min(100%, 230px); }
.eyebrow { color: #a3a3a3; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; }
h1 { margin: 16px 0 12px; font-size: clamp(30px, 4vw, 44px); line-height: 1.1; letter-spacing: -1.3px; }
.page-heading p { margin: 0; color: #a3a3a3; font-size: 13px; line-height: 1.6; }
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 42px;
  padding: 10px 18px;
  border: 1px solid #dedede;
  border-radius: 9px;
  background: #fff;
  color: #171717;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
}
.button:hover:not(:disabled) { background: #f1f1f1; }
.button--primary { background: #171717; color: #fff; border-color: #171717; }
.button--primary:hover:not(:disabled) { background: #333; }
.page-heading > .button--primary {
  position: relative;
  z-index: 1;
  background: #fff;
  color: #171717;
  border-color: #fff;
  border-radius: 999px;
}
.button > span { font-size: 19px; line-height: 1; }
.button:disabled { opacity: .5; cursor: not-allowed; }
.project-filters { display: flex; flex-wrap: wrap; gap: 14px; margin: 26px 0 16px; }
.project-filters label { display: grid; gap: 8px; min-width: 0; font-size: 12px; font-weight: 650; }
.search-field { flex: 1 1 260px; }
.status-field { flex: 0 1 200px; }
input, select {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 10px 13px;
  box-sizing: border-box;
  border: 1px solid #dedede;
  border-radius: 9px;
  background: #fff;
  color: #171717;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
}
input::placeholder { color: #999; }
.results { margin: 0 0 16px; color: #777; font-size: 12px; }
.project-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.project-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 240px;
  padding: 22px;
  border: 1px solid #e5e5e5;
  border-radius: 13px;
  background: #fff;
  color: #171717;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}
.project-card:hover { transform: translateY(-2px); border-color: #c8c8c8; box-shadow: 0 8px 24px #0000000a; }
.project-status { padding: 5px 10px; border: 1px solid #e5e5e5; border-radius: 999px; font-size: 11px; color: #555; }
.project-card h2 { margin: 18px 0 8px; font-size: 21px; font-weight: 700; line-height: 1.3; letter-spacing: -.5px; }
.project-card > p { display: -webkit-box; line-clamp: 3; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 25px; color: #777; font-size: 13px; line-height: 1.6; }
.project-progress { width: 100%; margin-top: auto; }
.project-progress__labels { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 9px; color: #777; font-size: 11px; }
.project-progress__labels strong { color: #171717; font-size: 12px; }
.project-progress__track { height: 6px; overflow: hidden; border-radius: 999px; background: #ededed; }
.project-progress__track > span { display: block; height: 100%; border-radius: inherit; background: #171717; transition: width 180ms ease; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px 24px; border: 1px dashed #ddd; border-radius: 13px; text-align: center; }
.empty-state h2 { margin: 0; font-size: 22px; }
.empty-state p { margin: 0; color: #777; font-size: 14px; line-height: 1.7; }
:is(button, a, input, select):focus-visible { outline: 2px solid #444; outline-offset: 3px; }
@media (max-width: 1100px) { .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 650px) {
  .projects-page { padding: 16px; }
  .page-heading { padding: 25px 20px; gap: 20px; }
  .page-heading::after { right: -130px; }
  .page-heading > .button { width: 100%; }
  .project-grid { grid-template-columns: minmax(0, 1fr); }
  .status-field { flex: 1 1 100%; }
  .project-card { min-height: 210px; }
}
@media (prefers-reduced-motion: reduce) { .project-card, .project-progress__track > span, .button { transition: none; } }
</style>