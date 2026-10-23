<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: { type: Object, default: () => ({}) },
  total: { type: Number, default: null },
  completed: { type: Number, default: null },
})

function contador(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  return Number.isFinite(numero) && numero >= 0 ? Math.floor(numero) : null
}

const totalTarefas = computed(() => contador(props.total ?? props.project.total_tasks))
const concluidas = computed(() => contador(props.completed ?? props.project.completed_tasks))
const temDados = computed(() => totalTarefas.value !== null && concluidas.value !== null)
const quantidadeConcluida = computed(() => Math.min(concluidas.value ?? 0, totalTarefas.value ?? 0))
const porcentagem = computed(() => totalTarefas.value > 0
  ? Math.round((quantidadeConcluida.value / totalTarefas.value) * 100)
  : 0)
</script>

<template>
  <section class="progress" aria-label="Progresso do projeto">
    <header class="progress__header"><h2>Progresso</h2><p>Acompanhe a evolução do projeto.</p></header>
    <div v-if="temDados" class="progress__body">
      <div class="progress__summary">
        <strong>{{ porcentagem }}<span>%</span></strong>
        <span>{{ quantidadeConcluida }} de {{ totalTarefas }} concluídas</span>
      </div>
      <progress :value="porcentagem" max="100" aria-label="Porcentagem de tarefas concluídas">{{ porcentagem }}%</progress>
      <p v-if="totalTarefas === 0">Ainda não há tarefas para calcular o progresso.</p>
      <p v-else-if="porcentagem === 100">Todas as tarefas foram concluídas.</p>
      <p v-else>{{ totalTarefas - quantidadeConcluida }} tarefa(s) restante(s).</p>
    </div>
    <p v-else class="progress__empty">Os dados de progresso ainda não estão disponíveis.</p>
  </section>
</template>

<style scoped>
.progress { min-width: 0; border: 1px solid #000; border-radius: 18px; background: #fff; color: #000; }
.progress__header { padding: 24px; border-bottom: 1px solid #000; }
h2 { margin: 0; font-size: 18px; font-weight: 700; }
.progress__header p { margin: 6px 0 0; font-size: 13px; line-height: 1.6; }
.progress__body { padding: 24px; }
.progress__summary { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.progress__summary strong { font-size: 44px; line-height: 1; letter-spacing: -2px; }
.progress__summary strong span { margin-left: 3px; font-size: 22px; }
.progress__summary > span { font-size: 12px; }
progress { display: block; appearance: none; width: 100%; height: 12px; overflow: hidden; border: 1px solid #000; border-radius: 999px; background: #fff; color: #000; }
progress::-webkit-progress-bar { background: #fff; }
progress::-webkit-progress-value { background: #000; }
progress::-moz-progress-bar { background: #000; }
.progress__body > p, .progress__empty { margin: 16px 0 0; font-size: 13px; line-height: 1.6; }
.progress__empty { margin: 0; padding: 28px 24px; }
@media (max-width: 600px) { .progress__header, .progress__body { padding: 18px; } }
</style>
