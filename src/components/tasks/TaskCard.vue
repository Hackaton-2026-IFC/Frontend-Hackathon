<script setup>
import { computed } from 'vue'
import { TASK_PRIORITIES } from '@/api/taskApi'

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
    </button>
  </article>
</template>
