
<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  currentPhoto: { type: String, default: null },
  currentName: { type: String, default: '' },
  currentUsername: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const fileInput = ref(null)
const imageElement = ref(null)
const cropArea = ref(null)

const editedName = ref('')
const editedUsername = ref('')
const selectedFile = ref(null)
const previewUrl = ref(null)
const removePhoto = ref(false)
const errorMessage = ref('')

const cropSize = ref(260)
const zoom = ref(1)
const position = ref({ x: 0, y: 0 })
const imageSize = ref({ width: 0, height: 0 })

const dragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOrigin = ref({ x: 0, y: 0 })

const nameChanged = computed(
  () => editedName.value.trim() !== props.currentName.trim()
)

const usernameChanged = computed(
  () => editedUsername.value.trim() !== props.currentUsername.trim()
)

const hasChanges = computed(
  () =>
    nameChanged.value ||
    usernameChanged.value ||
    !!selectedFile.value ||
    removePhoto.value
)

const displayedPhoto = computed(() => {
  if (removePhoto.value) return null
  return previewUrl.value || props.currentPhoto
})

const baseScale = computed(() => {
  if (!imageSize.value.width || !imageSize.value.height) {
    return 1
  }

  return Math.max(
    cropSize.value / imageSize.value.width,
    cropSize.value / imageSize.value.height
  )
})

const currentScale = computed(() => baseScale.value * zoom.value)

const renderedWidth = computed(
  () => imageSize.value.width * currentScale.value
)

const renderedHeight = computed(
  () => imageSize.value.height * currentScale.value
)

const maxOffsetX = computed(
  () => Math.max(0, (renderedWidth.value - cropSize.value) / 2)
)

const maxOffsetY = computed(
  () => Math.max(0, (renderedHeight.value - cropSize.value) / 2)
)

const imageStyle = computed(() => ({
  width: `${renderedWidth.value}px`,
  height: `${renderedHeight.value}px`,
  transform: `translate(-50%, -50%) translate(${position.value.x}px, ${position.value.y}px)`,
}))

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function limitPosition() {
  position.value = {
    x: clamp(position.value.x, -maxOffsetX.value, maxOffsetX.value),
    y: clamp(position.value.y, -maxOffsetY.value, maxOffsetY.value),
  }
}

watch(zoom, limitPosition)

function updateCropSize() {
  if (!cropArea.value) return

  cropSize.value = cropArea.value.clientWidth
  limitPosition()
}

function clearPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function resetForm() {
  clearPreview()

  editedName.value = props.currentName
  editedUsername.value = props.currentUsername

  selectedFile.value = null
  removePhoto.value = false
  errorMessage.value = ''

  zoom.value = 1
  position.value = { x: 0, y: 0 }
  imageSize.value = { width: 0, height: 0 }
  dragging.value = false

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      resetForm()
      await nextTick()
      updateCropSize()
    }
  },
  { immediate: true }
)

onUnmounted(clearPreview)

function selectPhoto() {
  if (!props.loading) {
    fileInput.value?.click()
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  errorMessage.value = ''

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    errorMessage.value = 'Selecione uma imagem JPG, PNG ou WebP.'
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'A imagem deve ter no máximo 5 MB.'
    event.target.value = ''
    return
  }

  clearPreview()

  selectedFile.value = file
  removePhoto.value = false

  zoom.value = 1
  position.value = { x: 0, y: 0 }
  imageSize.value = { width: 0, height: 0 }

  previewUrl.value = URL.createObjectURL(file)

  event.target.value = ''
}

function onImageLoad(event) {
  imageSize.value = {
    width: event.target.naturalWidth,
    height: event.target.naturalHeight,
  }

  updateCropSize()
}

function startDrag(event) {
  if (
    !selectedFile.value ||
    props.loading ||
    !imageSize.value.width
  ) {
    return
  }

  if (event.button !== undefined && event.button !== 0) {
    return
  }

  dragging.value = true

  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
  }

  dragOrigin.value = { ...position.value }

  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function moveDrag(event) {
  if (!dragging.value) return

  position.value = {
    x: clamp(
      dragOrigin.value.x + event.clientX - dragStart.value.x,
      -maxOffsetX.value,
      maxOffsetX.value
    ),
    y: clamp(
      dragOrigin.value.y + event.clientY - dragStart.value.y,
      -maxOffsetY.value,
      maxOffsetY.value
    ),
  }
}

function stopDrag() {
  dragging.value = false
}

function resetPosition() {
  zoom.value = 1
  position.value = { x: 0, y: 0 }
}

function removeCurrentPhoto() {
  if (props.loading) return

  clearPreview()

  selectedFile.value = null
  removePhoto.value = true
  errorMessage.value = ''
}

function closeModal() {
  if (!props.loading) {
    emit('close')
  }
}

async function createCroppedFile() {
  const image = imageElement.value

  if (!image?.complete || !image.naturalWidth) {
    throw new Error('Aguarde o carregamento da imagem.')
  }

  const canvas = document.createElement('canvas')

  canvas.width = 512
  canvas.height = 512

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Não foi possível preparar o recorte.')
  }

  const factor = 512 / cropSize.value

  const width = renderedWidth.value * factor
  const height = renderedHeight.value * factor

  const x =
    (512 - width) / 2 +
    position.value.x * factor

  const y =
    (512 - height) / 2 +
    position.value.y * factor

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 512, 512)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(image, x, y, width, height)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        } else {
          reject(
            new Error('Não foi possível recortar a imagem.')
          )
        }
      },
      'image/jpeg',
      0.9
    )
  })

  return new File(
    [blob],
    `perfil-${Date.now()}.jpg`,
    { type: 'image/jpeg' }
  )
}

async function confirmChanges() {
  if (props.loading || !hasChanges.value) return

  errorMessage.value = ''

  const name = editedName.value.trim()
  const username = editedUsername.value.trim()

  if (!name) {
    errorMessage.value = 'O nome completo não pode ficar vazio.'
    return
  }

  if (!username) {
    errorMessage.value = 'O nome de usuário não pode ficar vazio.'
    return
  }

  if (name.length > 150) {
    errorMessage.value =
      'O nome completo deve ter no máximo 150 caracteres.'
    return
  }

  if (username.length > 150) {
    errorMessage.value =
      'O nome de usuário deve ter no máximo 150 caracteres.'
    return
  }

  try {
    const file = selectedFile.value
      ? await createCroppedFile()
      : null

    emit('confirm', {
      name: nameChanged.value ? name : null,
      username: usernameChanged.value ? username : null,
      file,
      removePhoto: removePhoto.value,
    })
  } catch (error) {
    errorMessage.value =
      error.message || 'Erro ao preparar alterações.'
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="profile-modal">
      <div
        v-if="open"
        class="modal-overlay"
        @click.self="closeModal"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div class="modal-header">
            <div>
              <h2 id="edit-profile-title">
                Editar perfil
              </h2>

              <p>Personalize suas informações.</p>
            </div>

            <button
              class="icon-button"
              type="button"
              :disabled="loading"
              aria-label="Fechar"
              @click="closeModal"
            >
              <span class="mdi mdi-close"></span>
            </button>
          </div>

          <div class="modal-body">
            <div class="field">
              <label for="profile-name">
                Nome completo
              </label>

              <input
                id="profile-name"
                v-model="editedName"
                type="text"
                maxlength="150"
                placeholder="Digite seu nome completo"
                autocomplete="name"
                :disabled="loading"
              />
            </div>

            <div class="field">
              <label for="profile-username">
                Nome de usuário
              </label>

              <input
                id="profile-username"
                v-model="editedUsername"
                type="text"
                maxlength="150"
                placeholder="Digite seu nome de usuário"
                autocomplete="username"
                :disabled="loading"
              />

              <small>
                Seu identificador dentro da plataforma.
              </small>
            </div>

            <div class="section-divider"></div>

            <div class="photo-section">
              <span class="field-label">
                Foto de perfil
              </span>

              <div
                ref="cropArea"
                class="crop-area"
                :class="{
                  draggable: selectedFile && !loading
                }"
                @pointerdown="startDrag"
                @pointermove="moveDrag"
                @pointerup="stopDrag"
                @pointercancel="stopDrag"
                @lostpointercapture="stopDrag"
              >
                <img
                  v-if="selectedFile"
                  ref="imageElement"
                  :src="previewUrl"
                  :style="imageStyle"
                  class="crop-image"
                  alt="Prévia da foto"
                  draggable="false"
                  @load="onImageLoad"
                />

                <img
                  v-else-if="displayedPhoto"
                  :src="displayedPhoto"
                  class="current-image"
                  alt="Foto atual"
                />

                <span
                  v-else
                  class="empty-avatar"
                  aria-label="Sem foto de perfil"
                >
                  {{ editedName.charAt(0).toUpperCase() || 'U' }}
                </span>
              </div>

              <small v-if="selectedFile">
                Arraste a imagem para ajustar o enquadramento.
              </small>

              <div
                v-if="selectedFile"
                class="zoom-controls"
              >
                <div class="zoom-heading">
                  <span>Zoom</span>

                  <button
                    type="button"
                    :disabled="loading"
                    @click="resetPosition"
                  >
                    Redefinir
                  </button>
                </div>

                <div class="zoom-row">
                  <span class="zoom-label">−</span>

                  <input
                    v-model.number="zoom"
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    :disabled="loading"
                    aria-label="Zoom da foto"
                  />

                  <span class="zoom-label">+</span>
                </div>
              </div>

              <div class="photo-actions">
                <button
                  type="button"
                  class="photo-button"
                  :disabled="loading"
                  @click="selectPhoto"
                >
                  Alterar foto
                </button>

                <button
                  type="button"
                  class="photo-button remove-button"
                  :disabled="loading || !displayedPhoto"
                  @click="removeCurrentPhoto"
                >
                  Remover foto
                </button>
              </div>
            </div>

            <ToastNotice v-if="errorMessage" :message="errorMessage" type="error" />

            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              @change="handleFileChange"
            />
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="cancel-button"
              :disabled="loading"
              @click="closeModal"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="confirm-button"
              :disabled="loading || !hasChanges"
              @click="confirmChanges"
            >
              {{
                loading
                  ? 'Salvando...'
                  : 'Confirmar mudanças'
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(8px);
}

.modal {
  width: 100%;
  max-width: 460px;
  max-height: calc(100dvh - 40px);

  overflow-y: auto;

  border: 1px solid #e5e5e5;
  border-radius: 14px;

  background: #fff;
  color: #171717;

  box-shadow: 0 20px 70px rgb(0 0 0 / 16%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;

  padding: 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 650;
}

.modal-header p {
  margin: 7px 0 0;
  color: #737373;
  font-size: 13px;
}

.icon-button {
  width: 30px;
  height: 30px;

  border: 0;
  border-radius: 6px;

  background: transparent;
  color: #737373;

  font-size: 20px;
  cursor: pointer;
}

.icon-button:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 9px;

  margin-bottom: 18px;
}

.field label,
.field-label {
  color: #262626;
  font-size: 13px;
  font-weight: 600;
}

.field input {
  width: 100%;
  min-height: 43px;

  padding: 10px 13px;

  border: 1px solid #dedede;
  border-radius: 8px;
  outline: none;

  background: #fff;
  color: #171717;

  font: inherit;
  font-size: 14px;

  transition: border-color 0.2s ease;
}

.field input:focus {
  border-color: #171717;
}

.field small,
.photo-section > small {
  color: #737373;
  font-size: 11px;
  line-height: 1.5;
}

.section-divider {
  height: 1px;
  margin: 24px 0;
  background: #eee;
}

.photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.field-label {
  align-self: flex-start;
}

.crop-area {
  position: relative;

  width: 260px;
  height: 260px;

  overflow: hidden;

  border: 1px solid #e5e5e5;
  border-radius: 50%;

  background: #f5f5f5;

  touch-action: none;
  user-select: none;
}

.crop-area.draggable {
  cursor: grab;
}

.crop-area.draggable:active {
  cursor: grabbing;
}

.crop-image {
  position: absolute;
  top: 50%;
  left: 50%;

  max-width: none;
  max-height: none;

  pointer-events: none;
}

.current-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-avatar {
  display: grid;
  width: 100%;
  height: 100%;

  place-items: center;

  color: #737373;
  font-size: 75px;
  font-weight: 600;
}

.zoom-controls {
  width: 100%;
  padding: 15px;

  border: 1px solid #e9e9e9;
  border-radius: 9px;
}

.zoom-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 12px;

  font-size: 12px;
  font-weight: 600;
}

.zoom-heading button {
  border: 0;
  background: transparent;

  color: #737373;
  font-size: 12px;

  cursor: pointer;
}

.zoom-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-row input {
  flex: 1;
  min-width: 0;
  accent-color: #171717;
}

.zoom-label {
  color: #737373;
  font-size: 20px;
  font-weight: 500;
}

.photo-actions {
  display: flex;
  width: 100%;
  gap: 10px;
}

.photo-button {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;

  min-height: 42px;
  padding: 9px;

  border: 1px solid #e5e5e5;
  border-radius: 8px;

  background: #fff;
  color: #262626;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.photo-button:hover:not(:disabled) {
  background: #f5f5f5;
}

.remove-button {
  color: #b42318;
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.error-message {
  margin: 16px 0 0;

  color: #b42318;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.cancel-button,
.confirm-button {
  min-height: 39px;
  padding: 10px 15px;

  border-radius: 7px;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.cancel-button {
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #525252;
}

.confirm-button {
  border: 1px solid #171717;
  background: #171717;
  color: #fff;
}

.confirm-button:hover:not(:disabled) {
  background: #333;
}

.profile-modal-enter-active,
.profile-modal-leave-active {
  transition: opacity 0.2s ease;
}

.profile-modal-enter-from,
.profile-modal-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .modal-header,
  .modal-body {
    padding: 20px;
  }

  .crop-area {
    width: 220px;
    height: 220px;
  }

  .modal-footer {
    padding: 14px 20px;
  }

  .confirm-button {
    flex: 1;
  }
}
</style>
