<script setup>
import { onMounted, ref, reactive } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: 'edit',
  },
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

const dialogo = ref(null)
const erroLocal = ref('')

const form = reactive({
  name: props.project.name || '',
  description: props.project.description || '',
  status: props.project.status || 'planned',
})

onMounted(() => {
  dialogo.value?.showModal()
})

function fechar() {
  if (!props.saving) {
    emit('close')
  }
}

function salvar() {
  if (props.saving) return

  erroLocal.value = ''

  const nome = form.name.trim()

  if (!nome) {
    erroLocal.value = 'Informe o nome do projeto.'
    return
  }

  if (nome.length > 100) {
    erroLocal.value = 'O nome deve ter no máximo 100 caracteres.'
    return
  }

  emit('save', {
    name: nome,
    description: form.description.trim(),
    status: form.status,
  })
}
</script>

<template>
  <dialog
    ref="dialogo"
    class="project-modal"
    :aria-label="mode === 'create' ? 'Criar projeto' : 'Editar projeto'"
    :aria-busy="saving"
    @cancel.prevent="fechar"
  >
    <header class="modal-header">
      <div>
        <span class="modal-label">MOMENTUM / PROJETOS</span>

        <h2>
          {{ mode === 'create' ? 'Novo projeto' : 'Editar projeto' }}
        </h2>
      </div>

      <button
        type="button"
        class="close-button"
        aria-label="Fechar"
        :disabled="saving"
        @click="fechar"
      >
        ×
      </button>
    </header>

    <form @submit.prevent="salvar">
      <fieldset :disabled="saving">
        <label>
          Nome do projeto

          <input
            v-model="form.name"
            type="text"
            name="name"
            maxlength="100"
            placeholder="Digite o nome do projeto"
            required
            autofocus
          />
        </label>

        <label>
          Descrição

          <textarea
            v-model="form.description"
            name="description"
            rows="5"
            placeholder="Descreva o objetivo do projeto"
          ></textarea>
        </label>

        <label>
          Status

          <select v-model="form.status" name="status">
            <option value="planned">Planejado</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluído</option>
          </select>
        </label>
      </fieldset>

      <p v-if="erroLocal || error" class="error-message" role="alert">
        {{ erroLocal || error }}
      </p>

      <footer class="modal-actions">
        <button
          type="button"
          class="button"
          :disabled="saving"
          @click="fechar"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="button button-primary"
          :disabled="saving"
        >
          {{
            saving
              ? 'Salvando...'
              : mode === 'create'
                ? 'Criar projeto'
                : 'Salvar alterações'
          }}
        </button>
      </footer>
    </form>
  </dialog>
</template>

<style scoped>
.project-modal {
  position: fixed;
  inset: 0;
  width: min(560px, calc(100% - 24px));
  max-height: calc(100dvh - 24px);
  margin: auto;
  padding: 0;
  overflow-y: auto;
  box-sizing: border-box;
  border: 1px solid #000;
  border-radius: 20px;
  background: #fff;
  color: #000;
  box-shadow: 0 24px 80px rgb(0 0 0 / 24%);
}

.project-modal::backdrop {
  background: rgb(0 0 0 / 65%);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-bottom: 1px solid #000;
}

.modal-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

h2 {
  margin: 8px 0 0;
  font-size: 24px;
  font-weight: 700;
}

.close-button {
  flex: 0 0 44px;
  height: 44px;
  border: 1px solid #000;
  border-radius: 50%;
  background: #fff;
  color: #000;
  font-size: 26px;
  cursor: pointer;
}

form {
  padding: 18px;
}

fieldset {
  display: grid;
  gap: 20px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

label {
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

input,
textarea,
select {
  width: 100%;
  min-width: 0;
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

textarea {
  min-height: 110px;
  resize: vertical;
}

.modal-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin-top: 24px;
}

.button {
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

.button-primary {
  background: #000;
  color: #fff;
}

button:disabled {
  opacity: 0.5;
  cursor: wait;
}

:is(button, input, textarea, select):focus-visible {
  outline: 2px solid #000;
  outline-offset: 3px;
}

.error-message {
  margin: 20px 0 0;
  padding: 12px;
  border: 1px solid #000;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .project-modal {
    width: min(560px, calc(100% - 32px));
    max-height: calc(100dvh - 32px);
  }

  .modal-header,
  form { padding: 24px; }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 28px;
  }
}
</style>
