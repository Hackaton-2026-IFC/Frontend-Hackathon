<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import ProjectAgent from '@/components/project/ProjectAgent.vue'

defineProps({ project: { type: Object, required: true } })
const emit = defineEmits(['close'])
const panel = ref(null)
let previousFocus = null
let originalOverflow = ''

function close() { emit('close') }
function onKey(event) {
  if (event.key === 'Escape') { event.preventDefault(); close(); return }
  if (event.key !== 'Tab' || !panel.value) return
  const elements = [...panel.value.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]')]
  if (!elements.length) return
  if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length - 1].focus() }
  else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) { event.preventDefault(); elements[0].focus() }
}
onMounted(() => {
  previousFocus = document.activeElement
  originalOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
  nextTick(() => panel.value?.querySelector('button')?.focus())
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = originalOverflow
  nextTick(() => previousFocus?.focus?.())
})
</script>

<template>
  <Teleport to="body">
    <div class="momentum-agent-overlay" @click.self="close">
      <section ref="panel" class="momentum-agent-dialog" role="dialog" aria-modal="true" aria-label="Agente de IA do projeto">
        <header class="momentum-agent-dialog__header">
          <div><span class="mdi mdi-auto-fix" aria-hidden="true"></span> Agente de IA</div>
          <button type="button" aria-label="Fechar agente de IA" @click="close">✕</button>
        </header>
        <ProjectAgent :project="project" />
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.momentum-agent-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.58)}
.momentum-agent-dialog{width:min(100%,1060px);max-height:calc(100dvh - 40px);overflow-y:auto;padding:20px;border:1px solid #ddd;border-radius:20px;background:#fff;color:#111;box-shadow:0 20px 70px rgba(0,0,0,.2)}
.momentum-agent-dialog__header{display:flex;align-items:center;justify-content:space-between;padding:0 3px 12px;border-bottom:1px solid #e8e8e8;font-weight:700}
.momentum-agent-dialog__header div{display:flex;align-items:center;gap:10px}
.momentum-agent-dialog__header button{width:36px;height:36px;border:0;border-radius:9px;background:#f3f3f3;color:#111;cursor:pointer}
.momentum-agent-dialog :deep(.agent-card){margin-top:16px;border-color:#ddd;background:#fafafa}
@media(max-width:600px){.momentum-agent-overlay{padding:10px}.momentum-agent-dialog{padding:12px;max-height:calc(100dvh - 20px)}}
</style>
