<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  project: { type: Object, required: true },
  deleting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'confirm'])
const dialogo = ref(null)

onMounted(() => dialogo.value?.showModal())
onBeforeUnmount(() => dialogo.value?.close())

function fechar() {
  if (!props.deleting) emit('close')
}
function confirmar() {
  if (!props.deleting) emit('confirm', props.project.id)
}
</script>

<template>
  <dialog ref="dialogo" class="delete-dialog" aria-label="Confirmar exclusão do projeto" :aria-busy="deleting" @cancel.prevent="fechar">
    <div class="delete-dialog__icon" aria-hidden="true">!</div>
    <h2>Excluir projeto?</h2>
    <p>Você está prestes a excluir <strong>{{ project.name || project.title || 'este projeto' }}</strong>.</p>
    <p>Confirme apenas se deseja remover este projeto.</p>
    <p v-if="error" class="delete-dialog__error" role="alert">{{ error }}</p>
    <footer>
      <button type="button" class="button" autofocus :disabled="deleting" @click="fechar">Cancelar</button>
      <button type="button" class="button button--primary" :disabled="deleting" @click="confirmar">{{ deleting ? 'Excluindo...' : 'Excluir projeto' }}</button>
    </footer>
  </dialog>
</template>

<style scoped>
.delete-dialog { position: fixed; inset: 0; width: min(460px, calc(100% - 32px)); max-height: calc(100dvh - 32px); margin: auto; padding: 32px; overflow-y: auto; box-sizing: border-box; border: 1px solid #000; border-radius: 20px; background: #fff; color: #000; box-shadow: 0 24px 80px rgb(0 0 0 / 24%); }
.delete-dialog::backdrop { background: rgb(0 0 0 / 65%); }
.delete-dialog__icon { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 24px; border: 1px solid #000; border-radius: 50%; background: #000; color: #fff; font-size: 26px; font-weight: 600; }
h2 { margin: 0 0 14px; font-size: 26px; font-weight: 700; letter-spacing: -0.8px; }
p { margin: 10px 0; font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-top: 28px; }
.button { min-height: 44px; padding: 10px 18px; border: 1px solid #000; border-radius: 999px; background: #fff; color: #000; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.button--primary { background: #000; color: #fff; }
.button:focus-visible { outline: 2px solid #000; outline-offset: 3px; }
.button:disabled { opacity: 0.55; cursor: wait; }
.delete-dialog__error { padding: 12px; border: 1px solid #000; border-radius: 8px; }
@media (max-width: 480px) { .delete-dialog { padding: 24px; } .button { flex: 1 1 100%; } }
</style>
