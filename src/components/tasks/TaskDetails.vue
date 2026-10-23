<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import taskApi, {
  TASK_PRIORITIES,
  TASK_STATUSES,
  formatDeadline,
  isOverdue,
  safeResourceUrl,
  taskError,
} from '@/api/taskApi'
import { useTaskStore } from '@/stores/taskStore'
const props = defineProps({ task: { type: Object, required: true }, project: Object })
const emit = defineEmits(['close', 'edit', 'deleted'])
const store = useTaskStore()
const dialog = ref(null)
const error = ref('')
const confirmDelete = ref(false)
const checklistTitle = ref('')
const resourceTitle = ref('')
const resourceUrl = ref('')
const resources = ref([])
const resourceLoading = ref(true)
const resourceBusy = ref(false)
const resourceError = ref('')
const previousFocus = document.activeElement
const busy = computed(() => store.busy || resourceBusy.value)
const checklist = computed(() =>
  [...(props.task.microtarefas || [])].sort((a, b) => a.ordem - b.ordem),
)
onMounted(() => {
  dialog.value.showModal()
  loadResources()
})
onBeforeUnmount(() => previousFocus?.focus())
function close() {
  if (!busy.value) emit('close')
}
async function loadResources() {
  resourceLoading.value = true
  resourceError.value = ''
  try {
    resources.value = await taskApi.resources(props.task.id)
  } catch (err) {
    resourceError.value = taskError(err)
  } finally {
    resourceLoading.value = false
  }
}
function selectStatus(event) {
  changeStatus(event.target.value)
  event.target.value = props.task.status
}
function toggleChecklist(event, item) {
  event.target.checked = item.concluida
  updateChecklist(item)
}
async function changeStatus(status) {
  error.value = ''
  try {
    await store.update(props.task.id, { status })
  } catch (err) {
    error.value = taskError(err)
  }
}
async function remove() {
  if (busy.value) return
  error.value = ''
  try {
    await store.remove(props.task.id)
    emit('deleted')
  } catch (err) {
    error.value = taskError(err)
  }
}
async function updateChecklist(item = null) {
  if (busy.value || (!item && !checklistTitle.value.trim())) return
  error.value = ''
  try {
    await store.checklist(props.task.id, item, checklistTitle.value.trim())
    if (!item) checklistTitle.value = ''
  } catch (err) {
    error.value = taskError(err)
  }
}
async function addResource() {
  if (busy.value) return
  resourceError.value = ''
  const url = safeResourceUrl(resourceUrl.value)
  if (!url) {
    resourceError.value = 'Informe um link HTTP ou HTTPS válido.'
    return
  }
  resourceBusy.value = true
  try {
    const resource = await taskApi.addResource(props.task.id, {
      titulo: resourceTitle.value.trim(),
      url,
      tipo: 'link',
    })
    resources.value.unshift(resource)
    resourceTitle.value = ''
    resourceUrl.value = ''
  } catch (err) {
    resourceError.value = taskError(err)
  } finally {
    resourceBusy.value = false
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="task-dialog task-details"
    aria-labelledby="task-details-title"
    @cancel.prevent="close"
  >
    <header class="task-dialog-header">
      <div>
        <p class="task-project-label">{{ project?.nome }}</p>
        <h2 id="task-details-title">{{ task.titulo }}</h2>
      </div>
      <button :disabled="busy" aria-label="Fechar detalhes" @click="close">×</button>
    </header>
    <div class="task-details-body">
      <p class="task-description">{{ task.descricao || 'Sem descrição.' }}</p>
      <div class="task-fields-grid">
        <p><small>PRIORIDADE</small>{{ TASK_PRIORITIES[task.prioridade] }}</p>
        <p>
          <small>PRAZO</small>{{ formatDeadline(task.data_limite) }}
          <b v-if="isOverdue(task)" class="task-danger-text"> · Atrasada</b>
        </p>
        <p>
          <small>RESPONSÁVEL</small
          >{{
            project?.participantes?.find((member) => member.usuario === task.responsavel)
              ?.usuario_detalhes?.name || 'Sem responsável'
          }}
        </p>
        <label
          >Situação<select :value="task.status" :disabled="busy" @change="selectStatus">
            <option v-for="(label, value) in TASK_STATUSES" :key="value" :value="value">
              {{ label }}
            </option>
          </select></label
        >
      </div>
      <p v-if="error" class="task-error" role="alert">{{ error }}</p>
      <section class="task-detail-section">
        <h3>
          Checklist
          <span
            >{{ checklist.filter((item) => item.concluida).length }}/{{ checklist.length }}</span
          >
        </h3>
        <p class="task-muted">
          Conclua as etapas em ordem. O progresso atualiza a situação da tarefa.
        </p>
        <label v-for="item in checklist" :key="item.id" class="task-check-row"
          ><input
            type="checkbox"
            :checked="item.concluida"
            :disabled="busy"
            @change="toggleChecklist($event, item)"
          /><span :class="{ 'task-done': item.concluida }">{{ item.titulo }}</span></label
        >
        <form class="task-inline-form" @submit.prevent="updateChecklist()">
          <input
            v-model="checklistTitle"
            aria-label="Novo item do checklist"
            placeholder="Adicionar etapa"
            required
            maxlength="150"
            :disabled="busy"
          /><button class="task-button" :disabled="busy || !checklistTitle.trim()">
            Adicionar
          </button>
        </form>
      </section>
      <section class="task-detail-section">
        <h3>Materiais de apoio</h3>
        <p v-if="resourceLoading" role="status">Carregando links...</p>
        <p v-if="resourceError" class="task-error" role="alert">
          {{ resourceError }}
          <button class="task-button" :disabled="resourceBusy" @click="loadResources">
            Recarregar
          </button>
        </p>
        <ul class="task-resource-list">
          <li v-for="resource in resources" :key="resource.id">
            <a
              v-if="safeResourceUrl(resource.url)"
              :href="safeResourceUrl(resource.url)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ resource.titulo }} ↗</a
            ><span v-else>{{ resource.titulo }} (link inválido)</span>
          </li>
        </ul>
        <form class="task-form" @submit.prevent="addResource">
          <label
            >Nome do material<input
              v-model="resourceTitle"
              required
              maxlength="150"
              :disabled="busy" /></label
          ><label
            >Link<input
              v-model="resourceUrl"
              type="url"
              required
              maxlength="2000"
              placeholder="https://"
              :disabled="busy" /></label
          ><button class="task-button" :disabled="busy || !resourceTitle.trim()">
            {{ resourceBusy ? 'Adicionando...' : 'Adicionar link' }}
          </button>
        </form>
      </section>
      <footer class="task-actions" v-if="!confirmDelete">
        <button class="task-button task-danger" :disabled="busy" @click="confirmDelete = true">
          Excluir tarefa</button
        ><button class="task-button task-primary" :disabled="busy" @click="emit('edit', task.id)">
          Editar tarefa
        </button>
      </footer>
      <section v-else class="task-delete-confirm" aria-label="Confirmação de exclusão">
        <p>Excluir esta tarefa e seus itens vinculados? Esta ação não pode ser desfeita.</p>
        <div class="task-actions">
          <button class="task-button" :disabled="busy" @click="confirmDelete = false">
            Cancelar</button
          ><button class="task-button task-danger" :disabled="busy" @click="remove">
            {{ store.busy ? 'Excluindo...' : 'Confirmar exclusão' }}
          </button>
        </div>
      </section>
    </div>
  </dialog>
</template>
