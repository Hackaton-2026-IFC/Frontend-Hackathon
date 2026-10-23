<script setup>
import { computed } from 'vue'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/api/taskApi'
import {
  automaticPriority,
  responsibleForTask,
  taskCompletionDate,
  taskDueDate,
  taskIsOverdue,
} from '@/utils/taskPresentation'

const props = defineProps({
  task: { type: Object, required: true },
  projects: { type: Array, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['edit'])
const overdue = computed(() => taskIsOverdue(props.task))
const responsible = computed(() => responsibleForTask(props.task, props.projects))
const completion = computed(() => taskCompletionDate(props.task))
const priorityCode = computed(() => automaticPriority(props.task))
const priorityLabel = computed(() => TASK_PRIORITIES[priorityCode.value] || 'Sem urgência')
const status = computed(() => TASK_STATUSES[props.task.status] || 'A fazer')
</script>

<template>
  <article class="task-overview-card" :class="{ 'task-overview-card--overdue': overdue }">
    <div class="task-overview-card__top">
      <h3>{{ task.titulo }}</h3>
      <span class="task-priority" :title="`Prioridade automática: ${priorityLabel}`">
        <span
          v-if="priorityCode"
          class="task-priority__dot"
          :class="`task-priority__dot--${priorityCode}`"
          aria-hidden="true"
        ></span>
        {{ priorityLabel }}
      </span>
    </div>

    <div class="task-overview-card__meta">
      <p><span>Responsável</span><strong>{{ responsible }}</strong></p>
      <p v-if="completion !== null">
        <span>Conclusão</span>
        <strong>{{ completion }}</strong>
      </p>
      <p v-else>
        <span>Prazo</span>
        <strong>{{ taskDueDate(task) }}</strong>
      </p>
    </div>

    <div class="task-overview-card__bottom">
      <span :class="['task-status-label', { 'task-status-label--overdue': overdue }]">
        {{ overdue ? 'Atrasada' : status }}
      </span>
      <button
        type="button"
        class="task-card-edit"
        :disabled="busy"
        :aria-label="`Editar tarefa ${task.titulo}`"
        @click="emit('edit', task.id)"
      >
        Editar
        <span aria-hidden="true">↗</span>
      </button>
    </div>
  </article>
</template>
