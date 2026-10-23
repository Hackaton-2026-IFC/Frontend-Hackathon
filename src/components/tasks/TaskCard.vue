<script setup>
import { computed } from 'vue'
import { TASK_PRIORITIES, formatDeadline, isOverdue } from '@/api/taskApi'

const props = defineProps({
  task: { type: Object, required: true },
  project: { type: Object, default: null },
  busy: Boolean,
})

const emit = defineEmits(['open'])

const responsibleName = computed(() => {
  const responsibleId = props.task.responsavel
  if (responsibleId == null || responsibleId === '') return 'Sem responsável'

  const member = props.project?.participantes?.find(
    (item) => String(item.usuario) === String(responsibleId),
  )
  return member?.usuario_detalhes?.name?.trim() || member?.usuario_detalhes?.username || 'Sem responsável'
})

const priorityLabel = computed(() => TASK_PRIORITIES[props.task.prioridade] || 'Não definida')

const checklistProgress = computed(() => {
  const steps = props.task.microtarefas
  if (!Array.isArray(steps) || steps.length === 0) return null
  const completed = steps.filter((step) => step.concluida).length
  return `${completed}/${steps.length}`
})
</script>

<template>
  <article
    class="task-card"
    :draggable="!busy"
    @dragstart="$event.dataTransfer.setData('text/plain', String(task.id))"
  >
    <button
      type="button"
      class="task-card-open"
      :title="task.titulo"
      @click="emit('open', task.id)"
    >
      <strong>{{ task.titulo }}</strong>

      <span class="task-card-footer">
        <span class="task-card-responsible" :title="responsibleName">
          {{ responsibleName }}
        </span>
        <span
          class="task-card-priority"
          :class="`task-card-priority-${task.prioridade}`"
          :title="`Prioridade: ${priorityLabel}`"
          :aria-label="`Prioridade: ${priorityLabel}`"
          role="img"
        ></span>
      </span>

      <span v-if="task.data_limite || checklistProgress" class="task-card-extra">
        <span
          v-if="task.data_limite"
          class="task-card-deadline"
          :class="{ 'task-card-deadline-overdue': isOverdue(task) }"
          :title="`Prazo: ${formatDeadline(task.data_limite)}`"
        >
          {{ isOverdue(task) ? 'Atrasada · ' : 'Prazo · ' }}{{ formatDeadline(task.data_limite) }}
        </span>
        <span
          v-if="checklistProgress"
          class="task-card-checklist"
          :title="`Microtarefas concluídas: ${checklistProgress}`"
        >
          Etapas {{ checklistProgress }}
        </span>
      </span>
    </button>
  </article>
</template>
