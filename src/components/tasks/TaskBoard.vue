<script setup>
import TaskCard from './TaskCard.vue'
import { TASK_STATUSES } from '@/api/taskApi'
const props = defineProps({
  tasks: { type: Array, required: true },
  projects: { type: Array, default: () => [] },
  busy: Boolean,
})
const emit = defineEmits(['open', 'move', 'create'])
function drop(event, status) {
  if (props.busy) return
  const id = Number(event.dataTransfer.getData('text/plain'))
  const task = props.tasks.find((item) => item.id === id)
  if (task && task.status !== status) emit('move', id, status)
}
</script>

<template>
  <div class="task-board">
    <section
      v-for="(label, status) in TASK_STATUSES"
      :key="status"
      class="task-column"
      :aria-label="label"
      @dragover.prevent
      @drop.prevent="drop($event, status)"
    >
      <header>
        <h2><span class="task-dot" :class="status"></span>{{ label }}</h2>
        <span>{{ tasks.filter((task) => task.status === status).length }}</span>
      </header>
      <TaskCard
        v-for="task in tasks.filter((item) => item.status === status)"
        :key="task.id"
        :task="task"
        :project="projects.find((item) => item.id === task.projeto)"
        :busy="busy"
        @open="emit('open', $event)"
      />
      <p v-if="!tasks.some((task) => task.status === status)" class="task-empty-column">
        Nenhuma tarefa nesta etapa.
      </p>
      <button class="task-add" :disabled="busy || !projects.length" @click="emit('create', status)">
        + Adicionar tarefa
      </button>
    </section>
  </div>
</template>
