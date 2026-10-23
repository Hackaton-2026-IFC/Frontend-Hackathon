<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { TASK_PRIORITIES, TASK_STATUSES, taskError } from '@/api/taskApi'
import { useTaskStore } from '@/stores/taskStore'
const props = defineProps({
  task: Object,
  projects: { type: Array, required: true },
  projectId: [Number, String],
  initialStatus: { type: String, default: 'planejado' },
})
const emit = defineEmits(['close', 'saved'])
const store = useTaskStore()
const dialog = ref(null)
const error = ref('')
const previousFocus = document.activeElement
const form = reactive({
  projeto: props.task?.projeto || Number(props.projectId) || props.projects[0]?.id || '',
  titulo: props.task?.titulo || '',
  descricao: props.task?.descricao || '',
  prioridade: props.task?.prioridade || 'neutra',
  status: props.task?.status || props.initialStatus,
  responsavel: props.task?.responsavel == null ? '' : String(props.task.responsavel),
  data_limite: props.task?.data_limite || '',
})
const members = computed(
  () => props.projects.find((project) => String(project.id) === String(form.projeto))?.participantes || [],
)
onMounted(() => dialog.value.showModal())
onBeforeUnmount(() => previousFocus?.focus())
function close() {
  if (!store.busy) emit('close')
}
async function save() {
  if (store.busy || !form.titulo.trim()) return
  error.value = ''
  try {
    const payload = {
      ...form,
      projeto: Number(form.projeto),
      titulo: form.titulo.trim(),
      responsavel: form.responsavel === '' ? null : Number(form.responsavel),
      data_limite: form.data_limite || null,
    }
    const task = props.task
      ? await store.update(props.task.id, payload)
      : await store.create(payload)
    emit('saved', task)
  } catch (err) {
    error.value = taskError(err)
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="task-dialog"
    aria-labelledby="task-form-title"
    @cancel.prevent="close"
  >
    <header class="task-dialog-header">
      <h2 id="task-form-title">{{ task ? 'Editar tarefa' : 'Nova tarefa' }}</h2>
      <button type="button" :disabled="store.busy" aria-label="Fechar formulário" @click="close">
        ×
      </button>
    </header>
    <form class="task-form" @submit.prevent="save">
      <fieldset :disabled="store.busy">
        <label
          >Projeto<select
            v-model="form.projeto"
            required
            :disabled="!!task || !!projectId"
            @change="form.responsavel = ''"
          >
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.nome }}
            </option>
          </select></label
        >
        <label
          >Título<input
            v-model="form.titulo"
            maxlength="150"
            required
            autofocus
            placeholder="O que precisa ser feito?"
        /></label>
        <section class="task-form-edit-options" aria-labelledby="task-form-edit-options-title">
          <h3 id="task-form-edit-options-title">Responsável, prioridade e prazo</h3>
          <div class="task-form-edit-grid">
            <label class="task-form-assignee">
              Responsável
              <select v-model="form.responsavel">
                <option value="">Sem responsável</option>
                <option
                  v-for="member in members"
                  :key="member.usuario"
                  :value="String(member.usuario)"
                >
                  {{ member.usuario_detalhes?.name || member.usuario_detalhes?.username || 'Participante' }}
                </option>
              </select>
            </label>
            <label>
              Prioridade
              <select v-model="form.prioridade">
                <option v-for="(label, value) in TASK_PRIORITIES" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </label>
            <label>
              Prazo
              <input v-model="form.data_limite" type="date" />
            </label>
          </div>
        </section>
        <label>
          Descrição
          <textarea v-model="form.descricao" rows="4" placeholder="Detalhe a atividade..."></textarea>
        </label>
        <label>
          Situação
          <select v-model="form.status">
            <option v-for="(label, value) in TASK_STATUSES" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </label>
      </fieldset>
      <p v-if="error" class="task-error" role="alert">{{ error }}</p>
      <footer class="task-actions">
        <button type="button" class="task-button" :disabled="store.busy" @click="close">
          Cancelar</button
        ><button
          class="task-button task-primary"
          :disabled="store.busy || !form.titulo.trim() || !form.projeto"
        >
          {{ store.busy ? 'Salvando...' : 'Salvar tarefa' }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
