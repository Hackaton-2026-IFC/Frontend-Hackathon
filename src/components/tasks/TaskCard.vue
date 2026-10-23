<script setup>
import { TASK_PRIORITIES, TASK_STATUSES, formatDeadline, isOverdue } from '@/api/taskApi'
const props = defineProps({
  task: { type: Object, required: true },
  project: Object,
  busy: Boolean,
})
const emit = defineEmits(['open', 'move'])
function move(event) {
  emit('move', props.task.id, event.target.value)
  event.target.value = props.task.status
}
</script>

<template>
  <article
    class="task-card"
    :class="{ 'task-overdue': isOverdue(task) }"
    :draggable="!busy"
    @dragstart="$event.dataTransfer.setData('text/plain', String(task.id))"
  >
    <button class="task-card-open" @click="$emit('open', task.id)">
      <span class="task-project-label">{{ project?.nome || 'Projeto' }}</span>
      <strong>{{ task.titulo }}</strong>
      <span v-if="task.descricao" class="task-excerpt">{{ task.descricao }}</span>
      <span class="task-badge" :class="'priority-' + task.prioridade">{{
        TASK_PRIORITIES[task.prioridade]
      }}</span>
      <span class="task-card-meta"
        >{{ formatDeadline(task.data_limite) }} <b v-if="isOverdue(task)"> · Atrasada</b></span
      >
      <span class="task-card-meta">{{
        project?.participantes?.find((member) => member.usuario === task.responsavel)
          ?.usuario_detalhes?.name || 'Sem responsável'
      }}</span>
      <span v-if="task.microtarefas?.length" class="task-card-meta"
        >Checklist: {{ task.microtarefas.filter((item) => item.concluida).length }}/{{
          task.microtarefas.length
        }}</span
      >
    </button>
    <label class="task-card-status"
      >Situação
      <select :value="task.status" :disabled="busy" @change="move">
        <option v-for="(label, value) in TASK_STATUSES" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
    </label>
  </article>
</template>
