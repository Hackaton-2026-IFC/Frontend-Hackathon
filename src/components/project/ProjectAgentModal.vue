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
          <div class="momentum-agent-dialog__title"><span class="mdi mdi-auto-fix" aria-hidden="true"></span> Agente de IA</div>
          <button type="button" aria-label="Fechar agente de IA" @click="close">✕</button>
        </header>
        <ProjectAgent :project="project" />
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.momentum-agent-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgb(0 0 0 / 60%);backdrop-filter:blur(3px)}
.momentum-agent-dialog{width:min(100%,790px);max-height:calc(100dvh - 40px);overflow-y:auto;overscroll-behavior:contain;padding:0;border:1px solid #e5e5e5;border-radius:16px;background:#fff;color:#171717;box-shadow:0 24px 80px rgb(0 0 0 / 20%)}
.momentum-agent-dialog__header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 28px;border-bottom:1px solid #ededed;background:#fff}
.momentum-agent-dialog__title{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700}
.momentum-agent-dialog__title .mdi{font-size:17px}
.momentum-agent-dialog__header button{display:grid;place-items:center;flex:0 0 36px;width:36px;height:36px;border:1px solid #ebebeb;border-radius:9px;background:#f8f8f8;color:#333;cursor:pointer}
.momentum-agent-dialog__header button:hover{background:#ededed}
.momentum-agent-dialog__header button:focus-visible{outline:3px solid #888;outline-offset:3px}
.momentum-agent-dialog :deep(.agent-card){padding:28px}
@media(max-width:600px){
 .momentum-agent-overlay{align-items:flex-end;padding:0}
 .momentum-agent-dialog{width:100%;max-height:94dvh;border-radius:16px 16px 0 0}
 .momentum-agent-dialog__header{padding:15px 20px}
 .momentum-agent-dialog :deep(.agent-card){padding:22px 20px max(24px,env(safe-area-inset-bottom))}
}
</style>
