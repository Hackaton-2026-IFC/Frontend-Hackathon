<script setup>
import { computed, reactive, ref } from 'vue'
import { TASK_PRIORITIES, TASK_STATUSES, taskError } from '@/api/taskApi'
import { useTaskStore } from '@/stores/taskStore'

const props = defineProps({
  task: { type: Object, default: null },
  projects: { type: Array, required: true },
  projectId: { type: [Number, String], default: null },
})

const emit = defineEmits(['cancel', 'saved'])
const store = useTaskStore()
const error = ref('')

const form = reactive({
  projeto: props.task?.projeto ?? props.projectId ?? props.projects[0]?.id ?? '',
  titulo: props.task?.titulo ?? '',
  descricao: props.task?.descricao ?? '',
  prioridade: props.task?.prioridade ?? 'neutra',
  status: props.task?.status ?? 'planejado',
  responsavel: props.task?.responsavel == null ? '' : String(props.task.responsavel),
  data_limite: props.task?.data_limite ?? '',
})

const members = computed(() =>
  props.projects.find((project) => String(project.id) === String(form.projeto))?.participantes || [],
)

function changeProject() {
  form.responsavel = ''
}

async function save() {
  if (store.busy || !form.titulo.trim() || !form.projeto) return

  error.value = ''

  try {
    const payload = {
      ...form,
      projeto: Number(form.projeto),
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      responsavel: form.responsavel === '' ? null : Number(form.responsavel),
      data_limite: form.data_limite || null,
    }

    const savedTask = props.task
      ? await store.update(props.task.id, payload)
      : await store.create(payload)

    emit('saved', savedTask)
  } catch (err) {
    error.value = taskError(err)
  }
}
</script>

<template>
  <section class="task-editor" aria-labelledby="task-form-title">
    <header class="task-editor-header">
      <p class="task-eyebrow">MOMENTUM / ORGANIZAÇÃO</p>
      <h1 id="task-form-title">{{ task ? 'Editar tarefa' : 'Nova tarefa' }}</h1>
      <p>Preencha os campos e salve as informações da tarefa.</p>
    </header>

    <form class="task-form" @submit.prevent="save">
      <fieldset :disabled="store.busy">
        <label>
          Projeto
          <select
            v-model="form.projeto"
            required
            :disabled="Boolean(task) || Boolean(projectId)"
            @change="changeProject"
          >
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.nome }}
            </option>
          </select>
        </label>

        <label>
          Título
          <input
            v-model="form.titulo"
            type="text"
            maxlength="150"
            required
            placeholder="O que precisa ser feito?"
          />
        </label>

        <section class="task-form-edit-options" aria-labelledby="task-options-title">
          <h2 id="task-options-title">Responsável, prioridade e prazo</h2>

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
                  {{
                    member.usuario_detalhes?.name ||
                    member.usuario_detalhes?.username ||
                    'Participante'
                  }}
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
          <textarea
            v-model="form.descricao"
            rows="5"
            placeholder="Detalhe a atividade..."
          ></textarea>
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
        <button type="button" class="task-button" :disabled="store.busy" @click="emit('cancel')">
          {{ task ? 'Voltar para nova tarefa' : 'Limpar' }}
        </button>
        <button
          type="submit"
          class="task-button task-primary"
          :disabled="store.busy || !form.titulo.trim() || !form.projeto"
        >
          {{ store.busy ? 'Salvando...' : task ? 'Salvar alterações' : 'Criar tarefa' }}
        </button>
      </footer>
    </form>
  </section>
</template>
