<script setup>
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
        <p>{{ error }}</p>
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

            <span class="project-card__footer">
              Abrir projeto
              <span aria-hidden="true">↗</span>
            </span>
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
/* Mobile first: espaço e controles funcionam desde 320px. */
.projects-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: 20px 16px;
  background: #fff;
  color: #000;
}

.projects-container {
  width: 100%;
  max-width: 1200px;
  min-width: 0;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 2px solid #000;
}

.page-heading > div { min-width: 0; }

.eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.6px;
}

h1 {
  margin: 12px 0;
  font-size: clamp(29px, 7vw, 40px);
  font-weight: 700;
  letter-spacing: -1.3px;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.page-heading p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid #000;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.page-heading > .button { width: 100%; }

.button--primary {
  background: #000;
  color: #fff;
}

.button > span { font-size: 22px; line-height: 1; }
.button:disabled { opacity: .5; cursor: not-allowed; }

.project-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  margin: 24px 0 18px;
}

.project-filters label {
  display: grid;
  gap: 8px;
  min-width: 0;
  width: 100%;
  font-size: 12px;
  font-weight: 600;
}

input,
select {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 12px 14px;
  border: 1px solid #000;
  border-radius: 10px;
  background: #fff;
  color: #000;
  font: inherit;
  font-size: 16px;
  font-weight: 400;
}

input::placeholder { color: #666; opacity: 1; }
.results { margin: 0 0 16px; font-size: 12px; }

.project-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.project-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 210px;
  padding: 20px;
  border: 1px solid #000;
  border-radius: 18px;
  background: #fff;
  color: #000;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 0 #000;
}

.project-status {
  padding: 5px 10px;
  border: 1px solid #000;
  border-radius: 999px;
  font-size: 11px;
}

.project-card h2 {
  margin: 18px 0 8px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -.5px;
  overflow-wrap: anywhere;
}

.project-card > p {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.65;
}

.project-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding-top: 14px;
  margin-top: auto;
  border-top: 1px solid #000;
  font-size: 12px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 30px 18px;
  border: 1px dashed #000;
  border-radius: 18px;
  text-align: center;
}

.empty-state h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.empty-state p { margin: 0; font-size: 14px; line-height: 1.7; }
.empty-state .button { width: 100%; }

:is(button, a, input, select):focus-visible {
  outline: 2px solid #000;
  outline-offset: 4px;
}

@media (min-width: 640px) {
  .projects-page { padding: 28px 24px; }
  .page-heading {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .page-heading > div { flex: 1; }
  .page-heading > .button { width: auto; flex-shrink: 0; }
  .page-heading p { font-size: 14px; }
  .project-filters {
    grid-template-columns: minmax(0, 1fr) minmax(160px, 210px);
  }
  .empty-state { padding: 44px 24px; }
  .empty-state .button { width: auto; }
}

@media (min-width: 960px) {
  .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .project-card { min-height: 235px; padding: 24px; }
}

@media (min-width: 1320px) {
  .projects-page { padding: clamp(28px, 3vw, 44px); }
  .page-heading { padding-bottom: 32px; }
  h1 { font-size: 46px; }
  .project-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
  .project-card { min-height: 245px; }
}

@media (prefers-reduced-motion: reduce) {
  .project-card { transition: none; }
}
</style>