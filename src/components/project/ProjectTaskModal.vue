<script setup>
import { ref } from 'vue'

const props = defineProps({
  saving: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  titulo: '',
  descricao: '',
  prioridade: 'neutra',
  status: 'planejado',
  data_limite: '',
})

const priorities = [
  { value: 'muito_baixa', label: 'Muito baixa' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'neutra', label: 'Neutra' },
  { value: 'alta', label: 'Alta' },
  { value: 'muito_alta', label: 'Muito alta' },
]

const statuses = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
]

function submit() {
  const titulo = form.value.titulo.trim()

  if (!titulo || props.saving) return

  emit('save', {
    titulo,
    descricao: form.value.descricao.trim(),
    prioridade: form.value.prioridade,
    status: form.value.status,
    data_limite: form.value.data_limite,
  })
}

function close() {
  if (props.saving) return
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="task-modal-overlay"
      @click.self="close"
    >
      <section
        class="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div class="task-modal__header">
          <div>
            <h2 id="task-modal-title">
              Nova tarefa
            </h2>

            <p>
              Adicione uma atividade ao projeto.
            </p>
          </div>

          <button
            type="button"
            class="task-modal__close"
            aria-label="Fechar"
            :disabled="saving"
            @click="close"
          >
            ✕
          </button>
        </div>

        <form
          class="task-modal__form"
          @submit.prevent="submit"
        >
          <div class="task-modal__field">
            <label for="task-title">
              Título da tarefa *
            </label>

            <input
              id="task-title"
              v-model="form.titulo"
              type="text"
              maxlength="150"
              placeholder="Ex.: Desenvolver tela inicial"
              required
              autofocus
            />
          </div>

          <div class="task-modal__field">
            <label for="task-description">
              Descrição
            </label>

            <textarea
              id="task-description"
              v-model="form.descricao"
              rows="4"
              placeholder="Descreva o que precisa ser feito..."
            />
          </div>

          <div class="task-modal__row">
            <div class="task-modal__field">
              <label for="task-status">
                Status
              </label>

              <select
                id="task-status"
                v-model="form.status"
              >
                <option
                  v-for="status in statuses"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </option>
              </select>
            </div>

            <div class="task-modal__field">
              <label for="task-priority">
                Prioridade
              </label>

              <select
                id="task-priority"
                v-model="form.prioridade"
              >
                <option
                  v-for="priority in priorities"
                  :key="priority.value"
                  :value="priority.value"
                >
                  {{ priority.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="task-modal__field">
            <label for="task-deadline">
              Prazo
            </label>

            <input
              id="task-deadline"
              v-model="form.data_limite"
              type="date"
            />
          </div>

          <p
            v-if="error"
            class="task-modal__error"
            role="alert"
          >
            {{ error }}
          </p>

          <div class="task-modal__actions">
            <button
              type="button"
              class="task-modal__cancel"
              :disabled="saving"
              @click="close"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="task-modal__submit"
              :disabled="saving || !form.titulo.trim()"
            >
              {{ saving ? 'Criando...' : 'Criar tarefa' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.task-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.task-modal {
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 28px;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  background: #fff;
  color: #111;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.18);
  box-sizing: border-box;
}

.task-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 28px;
}

.task-modal__header h2 {
  margin: 0;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.7px;
}

.task-modal__header p {
  margin: 8px 0 0;
  color: #777;
  font-size: 13px;
}

.task-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: #f5f5f5;
  color: #555;
  font-size: 15px;
  cursor: pointer;
}

.task-modal__close:hover {
  background: #eaeaea;
}

.task-modal__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-modal__field {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 8px;
}

.task-modal__field label {
  font-size: 13px;
  font-weight: 600;
}

.task-modal__field input,
.task-modal__field textarea,
.task-modal__field select {
  width: 100%;
  min-height: 44px;
  padding: 11px 13px;
  box-sizing: border-box;
  border: 1px solid #dedede;
  border-radius: 10px;
  outline: none;
  background: #fff;
  color: #111;
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.2s;
}

.task-modal__field textarea {
  resize: vertical;
  min-height: 100px;
}

.task-modal__field input:focus,
.task-modal__field textarea:focus,
.task-modal__field select:focus {
  border-color: #111;
}

.task-modal__field input::placeholder,
.task-modal__field textarea::placeholder {
  color: #aaa;
}

.task-modal__row {
  display: flex;
  gap: 16px;
}

.task-modal__error {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #fff1f1;
  color: #b42318;
  font-size: 13px;
}

.task-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.task-modal__cancel,
.task-modal__submit {
  min-height: 42px;
  padding: 0 20px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.task-modal__cancel {
  border: 1px solid #dedede;
  background: #fff;
  color: #333;
}

.task-modal__cancel:hover {
  background: #f7f7f7;
}

.task-modal__submit {
  border: 1px solid #111;
  background: #111;
  color: #fff;
}

.task-modal__submit:hover:not(:disabled) {
  background: #333;
}

.task-modal__cancel:disabled,
.task-modal__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .task-modal-overlay {
    padding: 12px;
  }

  .task-modal {
    padding: 22px;
    border-radius: 16px;
  }

  .task-modal__row {
    flex-direction: column;
    gap: 20px;
  }

  .task-modal__actions {
    flex-direction: column-reverse;
  }

  .task-modal__cancel,
  .task-modal__submit {
    width: 100%;
  }
}
</style>