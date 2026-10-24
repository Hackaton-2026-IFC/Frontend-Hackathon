<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ProjectIconModal from '@/components/project/ProjectIconModal.vue'
import { getProjectIcon } from '@/utils/projectIcons'

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

const statusParaFrontend = {
  planejado: 'planned',
  em_andamento: 'in_progress',
  concluido: 'completed',
}

const statusParaBackend = {
  planned: 'planejado',
  in_progress: 'em_andamento',
  completed: 'concluido',
}

const form = reactive({
  name: props.project.name ?? props.project.nome ?? '',
  description:
    props.project.description ?? props.project.descricao ?? '',
  status:
    statusParaFrontend[props.project.status] ??
    props.project.status ??
    'planned',
  icone: props.project.icone ?? '',
  cor: props.project.cor || '#111111',
  data_limite: props.project.data_limite
    ? String(props.project.data_limite).slice(0, 10)
    : '',
})

const previewColor = computed(() => {
  return /^#[0-9a-fA-F]{6}$/.test(form.cor)
    ? form.cor
    : '#111111'
})

onMounted(() => {
  dialogo.value?.showModal()
})

function fechar() {
  if (!props.saving) {
    dialogo.value?.close()
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

  const dados = {
    name: nome,
    description: form.description.trim(),
    status: form.status,
    icone: form.icone,
    cor: form.cor,
    data_limite: form.data_limite || null,
  }

  // A página de detalhes utiliza a API Django diretamente.
  if (props.mode === 'edit') {
    emit('save', {
      nome: dados.name,
      descricao: dados.description,
      status: statusParaBackend[dados.status],
      icone: dados.icone,
      cor: dados.cor,
      data_limite: dados.data_limite,
    })

    return
  }

  // A criação utiliza a store, com nomes em inglês.
  emit('save', dados)
}
</script>

<template>
  <dialog
    ref="dialogo"
    class="project-modal"
    :aria-label="mode === 'create' ? 'Criar projeto' : 'Editar projeto'"
    :aria-busy="saving"
    @cancel.prevent="fechar"
    @click.self="fechar"
  >
    <header class="modal-header">
      <div>
        <span class="modal-label">
          MOMENTUM / PROJETOS
        </span>

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

        <div class="identity-preview">
          <div
            class="preview-icon"
            :style="{ backgroundColor: previewColor }"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                :d="getProjectIcon(form.icone)"
                fill="currentColor"
              />
            </svg>
          </div>

          <div>
            <strong>
              {{ form.name || 'Meu projeto' }}
            </strong>

            <small>Pré-visualização do projeto</small>
          </div>
        </div>

        <label>
          Nome do projeto

          <input
            v-model="form.name"
            type="text"
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
            rows="4"
            placeholder="Descreva o objetivo do projeto"
          />
        </label>

        <label>
          Status

          <select v-model="form.status">
            <option value="planned">Planejado</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluído</option>
          </select>
        </label>

        <label>
          Data de prazo

          <input
            v-model="form.data_limite"
            type="date"
          />
        </label>

        <div class="color-section">
          <span class="field-title">
            Cor do projeto
          </span>

          <div class="color-input">
            <input
              v-model="form.cor"
              type="color"
              aria-label="Selecionar cor do projeto"
            />

            <span>{{ form.cor }}</span>
          </div>
        </div>

        <div class="icon-section">
          <span class="field-title">
            Ícone do projeto
          </span>

          <p>
            Escolha um ícone para identificar seu projeto.
          </p>

          <ProjectIconModal v-model="form.icone" />
        </div>
      </fieldset>

      <p
        v-if="erroLocal || error"
        class="error-message"
        role="alert"
      >
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
  width: min(650px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  overflow-y: auto;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #fff;
  color: #111;
  box-shadow: 0 24px 80px rgb(0 0 0 / 25%);
}

.project-modal::backdrop {
  background: rgb(0 0 0 / 65%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

h2 {
  margin: 8px 0 0;
  font-size: 24px;
}

.close-button {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: #fff;
  color: #111;
  font-size: 26px;
  cursor: pointer;
}

form {
  padding: 24px;
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

input:not([type='color']),
textarea,
select {
  width: 100%;
  min-width: 0;
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
  color: #111;
  font: inherit;
  font-size: 16px;
  font-weight: 400;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.identity-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  color: #fff;
}

.preview-icon svg {
  width: 30px;
  height: 30px;
}

.identity-preview strong {
  display: block;
  font-size: 16px;
  overflow-wrap: anywhere;
}

.identity-preview small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.color-section,
.icon-section {
  display: grid;
  gap: 10px;
}

.field-title {
  font-size: 13px;
  font-weight: 600;
}

.color-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input input {
  width: 60px;
  height: 42px;
  padding: 3px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
}

.color-input span {
  font-size: 13px;
  font-family: monospace;
}

.icon-section p {
  margin: 0;
  color: #666;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.button {
  min-height: 44px;
  padding: 12px 20px;
  border: 1px solid #ddd;
  border-radius: 999px;
  background: #fff;
  color: #111;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.button-primary {
  background: #111;
  color: #fff;
}

button:disabled {
  opacity: 0.5;
  cursor: wait;
}

:is(button, input, textarea, select):focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}

.error-message {
  margin: 20px 0 0;
  padding: 12px;
  border: 1px solid #dc2626;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

@media (max-width: 480px) {
  .modal-header,
  form {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions .button {
    width: 100%;
  }
}
</style>