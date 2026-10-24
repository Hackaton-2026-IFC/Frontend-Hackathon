<script setup>
import { nextTick, ref, watch } from 'vue'
import { toasts, dismissToast } from '@/composables/useToasts'

const host = ref(null)
watch(() => toasts.value.length, async (length) => {
  await nextTick()
  // A camada popover mantém as notificações visíveis sobre dialogs nativos.
  if (length && host.value?.showPopover) host.value.showPopover()
  else if (!length && host.value?.hidePopover) host.value.hidePopover()
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <section ref="host" popover="manual" class="toast-host" aria-label="Notificações">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast-item" :class="toast.type"
          :role="toast.type === 'error' ? 'alert' : 'status'">
          <span aria-hidden="true">{{ toast.type === 'error' ? '!' : '✓' }}</span>
          <p>{{ toast.message }}</p>
          <button type="button" aria-label="Fechar notificação" @click="dismissToast(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </section>
  </Teleport>
</template>

<style scoped>
.toast-host { position: fixed; inset: 20px 20px auto auto; margin: 0; padding: 4px; border: 0; background: transparent; width: min(420px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); overflow-y: auto; z-index: 100000; pointer-events: none; }
.toast-host:popover-open { display: block; }
.toast-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 12px; background: #fff; color: #171717; box-shadow: 0 8px 24px #0002; pointer-events: auto; }
.toast-item.error { border-left: 4px solid #b42318; }
.toast-item p { flex: 1; margin: 0; font: 14px/1.5 sans-serif; overflow-wrap: anywhere; }
.toast-item button { border: 0; background: transparent; color: #555; padding: 0 4px; font-size: 22px; cursor: pointer; }
.toast-item button:focus-visible { outline: 2px solid #111; }
.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(20px); }
@media (prefers-reduced-motion: reduce) { .toast-enter-active, .toast-leave-active { transition: none; } }
@media (max-width: 480px) { .toast-host { inset: 12px 12px auto auto; } }
</style>
