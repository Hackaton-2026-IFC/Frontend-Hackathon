<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { taskError } from '@/api/taskApi'
import { orderedRoadmapSteps, roadmapCanToggle, roadmapProgress } from '@/utils/taskRoadmap'

const props = defineProps({
  task: { type: Object, required: true },
})

const store = useTaskStore()
const stepTitle = ref('')
const error = ref('')
const editingId = ref(null)
const editingTitle = ref('')
const deletingId = ref(null)

const steps = computed(() => orderedRoadmapSteps(props.task))
const progress = computed(() => roadmapProgress(steps.value))

// The API enforces sequential completion (and reverse-order reopening).
function canToggle(step, index) {
  return !store.busy && roadmapCanToggle(steps.value, index)
}

async function toggle(step, index) {
  if (!canToggle(step, index)) return
  error.value = ''
  try {
    await store.checklist(props.task.id, step)
  } catch (err) {
    error.value = taskError(err)
  }
}

function startEdit(step) {
  editingId.value = step.id
  editingTitle.value = step.titulo
  deletingId.value = null
  error.value = ''
}

async function saveEdit(step) {
  const title = editingTitle.value.trim()
  if (!title || title.length > 150 || store.busy) return
  error.value = ''
  try {
    await store.updateChecklistStep(props.task.id, step.id, title)
    editingId.value = null
    editingTitle.value = ''
  } catch (err) {
    error.value = taskError(err)
  }
}

function confirmDelete(step) {
  deletingId.value = step.id
  editingId.value = null
  editingTitle.value = ''
  error.value = ''
}

async function deleteStep(step) {
  if (store.busy) return
  error.value = ''
  try {
    await store.removeChecklistStep(props.task.id, step.id)
    deletingId.value = null
  } catch (err) {
    error.value = taskError(err)
  }
}

async function addStep() {
  const title = stepTitle.value.trim()
  if (!title || store.busy) return
  error.value = ''
  try {
    await store.checklist(props.task.id, null, title)
    stepTitle.value = ''
  } catch (err) {
    error.value = taskError(err)
  }
}
</script>

<template>
  <section class="roadmap" aria-labelledby="roadmap-title">
    <div class="roadmap__heading">
      <div>
        <p class="workspace-kicker">PASSO A PASSO</p>
        <h3 id="roadmap-title">Roadmap da tarefa</h3>
        <p>As etapas são concluídas na ordem definida.</p>
      </div>
      <strong class="roadmap__total">{{ progress.finished }}/{{ progress.total }}</strong>
    </div>

    <div class="roadmap__progress" aria-label="Progresso do roadmap">
      <progress :value="progress.finished" :max="progress.total || 1">{{ progress.percent }}%</progress>
      <span>{{ progress.percent }}%</span>
    </div>

    <ol v-if="steps.length" class="roadmap__steps">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        class="roadmap__step"
        :class="{ 'roadmap__step--done': step.concluida }"
      >
        <span class="roadmap__number" aria-hidden="true">
          {{ step.concluida ? '✓' : index + 1 }}
        </span>
        <div class="roadmap__content">
          <label class="roadmap__step-label">
            <input
              type="checkbox"
              :checked="Boolean(step.concluida)"
              :disabled="!canToggle(step, index)"
              :aria-label="`${step.concluida ? 'Reabrir' : 'Concluir'} etapa ${index + 1}: ${step.titulo}`"
              @change="toggle(step, index)"
            />
            <span class="roadmap__step-title">{{ step.titulo }}</span>
          </label>
          <p v-if="step.descricao" class="roadmap__step-description">{{ step.descricao }}</p>
          <span class="roadmap__step-status">
            {{ step.concluida ? 'Concluída' : canToggle(step, index) ? 'Próxima etapa' : 'Aguardando etapas anteriores' }}
          </span>

          <div v-if="editingId !== step.id && deletingId !== step.id" class="roadmap__step-actions">
            <button type="button" :disabled="store.busy" :aria-label="`Editar etapa ${index + 1}`" @click="startEdit(step)">
              <span class="mdi mdi-pencil-outline" aria-hidden="true"></span> Editar
            </button>
            <button type="button" :disabled="store.busy" :aria-label="`Excluir etapa ${index + 1}`" @click="confirmDelete(step)">
              <span class="mdi mdi-trash-can-outline" aria-hidden="true"></span> Excluir
            </button>
          </div>

          <form v-if="editingId === step.id" class="roadmap__step-edit" @submit.prevent="saveEdit(step)">
            <label :for="`roadmap-edit-${step.id}`">Nome da etapa</label>
            <input :id="`roadmap-edit-${step.id}`" v-model="editingTitle" type="text" maxlength="150" required :disabled="store.busy" />
            <div>
              <button type="button" class="task-button" :disabled="store.busy" @click="editingId = null">Cancelar</button>
              <button type="submit" class="task-button task-primary" :disabled="store.busy || !editingTitle.trim()">Salvar</button>
            </div>
          </form>

          <div v-if="deletingId === step.id" class="roadmap__step-delete">
            <p>Excluir esta etapa? Essa ação não pode ser desfeita.</p>
            <div>
              <button type="button" class="task-button" :disabled="store.busy" @click="deletingId = null">Cancelar</button>
              <button type="button" class="task-button task-button--danger" :disabled="store.busy" @click="deleteStep(step)">Excluir etapa</button>
            </div>
          </div>
        </div>
      </li>
    </ol>
    <p v-else class="workspace-empty">Nenhuma etapa cadastrada. Adicione a primeira para montar o roadmap.</p>

    <form class="roadmap__add" @submit.prevent="addStep">
      <label for="new-step">Adicionar etapa</label>
      <div>
        <input
          id="new-step"
          v-model="stepTitle"
          type="text"
          maxlength="150"
          placeholder="Ex.: Revisar e testar a funcionalidade"
          :disabled="store.busy"
        />
        <button type="submit" class="task-button task-primary" :disabled="store.busy || !stepTitle.trim()">
          Adicionar
        </button>
      </div>
    </form>
    <ToastNotice v-if="error" :message="error" type="error" />
  </section>
</template>
