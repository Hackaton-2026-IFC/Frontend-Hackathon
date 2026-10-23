<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'

import ProjectHeader from '@/components/project/ProjectHeader.vue'
import ProjectMembers from '@/components/project/ProjectMembers.vue'
import ProjectProgress from '@/components/project/ProjectProgress.vue'
import ProjectEditModal from '@/components/project/ProjectEditModal.vue'
import ProjectDeleteDialog from '@/components/project/ProjectDeleteDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()

const project = computed(() => store.currentProject)

const error = ref('')
const showEdit = ref(false)
const showDelete = ref(false)

const saving = ref(false)
const deleting = ref(false)

const editError = ref('')
const deleteError = ref('')
const successMessage = ref('')

async function loadProject() {
  error.value = ''

  try {
    await store.fetchProject(route.params.id)
  } catch (e) {
    error.value = e.message
  }
}

watch(
  () => route.params.id,
  () => {
    showEdit.value = false
    showDelete.value = false
    successMessage.value = ''

    loadProject()
  },
  { immediate: true },
)

function goBack() {
  router.push({ name: 'projects' })
}

function openEdit() {
  editError.value = ''
  successMessage.value = ''
  showEdit.value = true
}

function openDelete() {
  deleteError.value = ''
  successMessage.value = ''
  showDelete.value = true
}

async function saveProject(dados) {
  if (saving.value || !project.value) return

  saving.value = true
  editError.value = ''

  try {
    // A store faz o PATCH e atualiza currentProject.
    await store.updateProject(project.value.id, dados)

    showEdit.value = false
    successMessage.value = 'Projeto atualizado com sucesso!'
  } catch (e) {
    // Em caso de erro, mantém o formulário aberto.
    editError.value = e.message
  } finally {
    saving.value = false
  }
}

async function deleteProject(id) {
  if (deleting.value) return

  deleting.value = true
  deleteError.value = ''

  try {
    await store.deleteProject(id)

    showDelete.value = false

    await router.push({ name: 'projects' })
  } catch (e) {
    deleteError.value = e.message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="project-page" :aria-busy="store.loading">
    <div class="project-container">
      <button type="button" class="back-button" @click="goBack">
        <span aria-hidden="true">←</span>
        Projetos
      </button>

      <div v-if="store.loading" class="page-state" role="status">
        <p>Carregando projeto...</p>
      </div>

      <div v-else-if="error" class="page-state" role="alert">
        <h1>Não foi possível abrir o projeto</h1>
        <p>{{ error }}</p>

        <button
          type="button"
          class="back-button"
          @click="loadProject"
        >
          Tentar novamente
        </button>
      </div>

      <template v-else-if="project">
        <p v-if="successMessage" role="status">
          {{ successMessage }}
        </p>

        <ProjectHeader
          :project="project"
          @edit="openEdit"
          @delete="openDelete"
        />

        <div class="project-summary">
          <ProjectMembers :project="project" />

          <ProjectProgress :project="project" />
        </div>

        <ProjectEditModal
          v-if="showEdit"
          :project="project"
          :saving="saving"
          :error="editError"
          @close="showEdit = false"
          @save="saveProject"
        />

        <ProjectDeleteDialog
          v-if="showDelete"
          :project="project"
          :deleting="deleting"
          :error="deleteError"
          @close="showDelete = false"
          @confirm="deleteProject"
        />
      </template>

      <div v-else class="page-state" role="status">
        <h1>Projeto não encontrado</h1>
        <p>Volte à lista para escolher outro projeto.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-page { min-height: 100%; padding: clamp(20px, 4vw, 44px); box-sizing: border-box; background: #fff; color: #000; }
.project-container { max-width: 1200px; margin: 0 auto; }
.back-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; padding: 10px 16px; margin-bottom: 24px; border: 1px solid #000; border-radius: 999px; background: #fff; color: #000; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.back-button:hover { background: #000; color: #fff; }
.back-button:focus-visible { outline: 2px solid #000; outline-offset: 4px; }
.project-summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; gap: 24px; margin-top: 24px; }
.page-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 260px; padding: 24px; border: 1px solid #000; border-radius: 18px; text-align: center; }
.page-state h1 { margin: 0; font-size: 24px; font-weight: 700; }
.page-state p { margin: 0; font-size: 14px; line-height: 1.7; }
.page-state .back-button { margin-bottom: 0; }
@media (max-width: 900px) { .project-summary { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 650px) { .project-page { padding: 20px 16px; } .project-summary { gap: 18px; margin-top: 18px; } }
</style>
