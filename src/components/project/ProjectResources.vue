<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  resources: {
    type: Array,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  successCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['add-resource'])

const showModal = ref(false)

const form = ref({
  titulo: '',
  url: '',
  tipo: 'link',
})

watch(
  () => props.successCount,
  (newValue, oldValue) => {
    if (newValue > oldValue && showModal.value) {
      showModal.value = false
    }
  },
)

function openModal() {
  form.value = {
    titulo: '',
    url: '',
    tipo: 'link',
  }

  showModal.value = true
}

function closeModal() {
  if (props.saving) return

  showModal.value = false
}

function submit() {
  if (props.saving) return

  if (
    !form.value.titulo.trim() ||
    !form.value.url.trim()
  ) {
    return
  }

  emit('add-resource', {
    titulo: form.value.titulo.trim(),
    url: form.value.url.trim(),
    tipo: form.value.tipo,
  })
}
</script>

<template>
  <section class="project-resources">

    <!-- CABEÇALHO -->

    <div class="project-resources__header">
      <div>
        <h2>Materiais de apoio</h2>
        <p>Links e documentos importantes para o projeto</p>
      </div>

      <button
        type="button"
        class="project-resources__add"
        @click="openModal"
      >
        <span class="add-symbol" aria-hidden="true">+</span>
        Adicionar material
      </button>
    </div>

    <!-- LISTA DE MATERIAIS -->

    <div
      v-if="resources.length"
      class="project-resources__list"
    >
      <a
        v-for="resource in resources"
        :key="resource.id"
        :href="resource.url"
        target="_blank"
        rel="noopener noreferrer"
        class="project-resources__item"
      >
        <div class="project-resources__icon">
          <span aria-hidden="true">↗</span>
        </div>

        <div class="project-resources__info">
          <strong>{{ resource.titulo }}</strong>
          <span>{{ resource.url }}</span>
        </div>

        <span
          class="project-resources__external"
          aria-hidden="true"
        >
          ↗
        </span>
      </a>
    </div>

    <!-- ESTADO VAZIO -->

    <div
      v-else
      class="project-resources__empty"
    >
      <div class="project-resources__empty-icon">
        <span aria-hidden="true">◇</span>
      </div>

      <strong>Nenhum material adicionado</strong>

      <p>
        Adicione links e documentos para facilitar
        o acesso às informações do projeto.
      </p>
    </div>

    <!-- MODAL -->

    <Teleport to="body">
      <div
        v-if="showModal"
        class="resource-modal-overlay"
        @click.self="closeModal"
      >
        <section
          class="resource-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-modal-title"
        >
          <div class="resource-modal__header">
            <div>
              <h2 id="resource-modal-title">
                Adicionar material
              </h2>

              <p>
                Compartilhe um recurso com a equipe.
              </p>
            </div>

            <button
              type="button"
              class="resource-modal__close"
              aria-label="Fechar"
              :disabled="saving"
              @click="closeModal"
            >
              &times;
            </button>
          </div>

          <form
            class="resource-modal__form"
            @submit.prevent="submit"
          >
            <div class="resource-modal__field">
              <label for="resource-title">
                Nome do material
              </label>

              <input
                id="resource-title"
                v-model="form.titulo"
                type="text"
                placeholder="Ex.: Documentação do projeto"
                required
              />
            </div>

            <div class="resource-modal__field">
              <label for="resource-url">
                Link do material
              </label>

              <input
                id="resource-url"
                v-model="form.url"
                type="url"
                placeholder="https://..."
                required
              />
            </div>

            <p
              v-if="error"
              class="resource-modal__error"
              role="alert"
            >
              {{ error }}
            </p>

            <div class="resource-modal__actions">
              <button
                type="button"
                class="resource-modal__cancel"
                :disabled="saving"
                @click="closeModal"
              >
                Cancelar
              </button>

              <button
                type="submit"
                class="resource-modal__submit"
                :disabled="saving"
              >
                {{ saving ? 'Adicionando...' : 'Adicionar material' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>

  </section>
</template>

<style scoped>
.project-resources {
  width: 100%;
  padding: 28px;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 18px;
  color: #111111;
}

.project-resources__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.project-resources__header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.project-resources__header p {
  margin: 7px 0 0;
  color: #777777;
  font-size: 13px;
}

.project-resources__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border: 0;
  border-radius: 10px;
  background: #111111;
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.project-resources__add:hover {
  background: #333333;
}

.add-symbol {
  font-size: 21px;
  font-weight: 400;
  line-height: 0.8;
}

.project-resources__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-resources__item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
}

.project-resources__item:hover {
  border-color: #cccccc;
  background: #fafafa;
}

.project-resources__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #f4f4f4;
  color: #333333;
  font-size: 22px;
}

.project-resources__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.project-resources__info strong {
  font-size: 13px;
  font-weight: 600;
}

.project-resources__info span {
  overflow: hidden;
  color: #888888;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-resources__external {
  flex-shrink: 0;
  color: #999999;
  font-size: 19px;
}

.project-resources__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  border: 1px dashed #dddddd;
  border-radius: 12px;
}

.project-resources__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 15px;
  border-radius: 12px;
  background: #f5f5f5;
  color: #777777;
  font-size: 26px;
}

.project-resources__empty strong {
  font-size: 14px;
}

.project-resources__empty p {
  max-width: 320px;
  margin: 8px 0 0;
  color: #888888;
  font-size: 12px;
  line-height: 1.6;
}

/* MODAL */

.resource-modal-overlay {
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

.resource-modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 28px;
  box-sizing: border-box;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  background: #ffffff;
  color: #111111;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.18);
}

.resource-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 26px;
}

.resource-modal__header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.6px;
}

.resource-modal__header p {
  margin: 8px 0 0;
  color: #777777;
  font-size: 13px;
}

.resource-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: #f5f5f5;
  color: #555555;
  font-size: 22px;
  cursor: pointer;
}

.resource-modal__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resource-modal__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-modal__field label {
  font-size: 13px;
  font-weight: 600;
}

.resource-modal__field input {
  width: 100%;
  min-height: 44px;
  padding: 11px 13px;
  box-sizing: border-box;
  border: 1px solid #dedede;
  border-radius: 10px;
  outline: none;
  background: #ffffff;
  color: #111111;
  font-family: inherit;
  font-size: 13px;
}

.resource-modal__field input:focus {
  border-color: #111111;
}

.resource-modal__error {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #fff1f1;
  color: #b42318;
  font-size: 13px;
}

.resource-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.resource-modal__cancel,
.resource-modal__submit {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.resource-modal__cancel {
  border: 1px solid #dedede;
  background: #ffffff;
  color: #333333;
}

.resource-modal__submit {
  border: 1px solid #111111;
  background: #111111;
  color: #ffffff;
}

.resource-modal__submit:disabled,
.resource-modal__cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .project-resources {
    padding: 20px;
    border-radius: 14px;
  }

  .project-resources__header {
    flex-direction: column;
    align-items: stretch;
  }

  .project-resources__add {
    width: 100%;
  }

  .resource-modal {
    padding: 22px;
  }

  .resource-modal__actions {
    flex-direction: column-reverse;
  }

  .resource-modal__cancel,
  .resource-modal__submit {
    width: 100%;
  }
}
</style>