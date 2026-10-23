<script setup>
defineProps({
  task: { type: Object, required: true },
  busy: Boolean,
})

const emit = defineEmits(['open'])
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
    </button>
  </article>
</template>
