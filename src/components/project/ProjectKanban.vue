<script setup>
import { computed, ref } from 'vue'
import ProjectTaskCard from './ProjectTaskCard.vue'

const props = defineProps({
  tasks: { type: Array, required: true },
  columns: { type: Array, required: true },
  saving: Boolean,
})
const emit = defineEmits(['move'])
const draggedId = ref(null)
const target = ref('')
const grouped = computed(() => Object.fromEntries(
  props.columns.map(column => [column.key, props.tasks.filter(task => task.status === column.key)]),
))

function start(event, task) {
  if (props.saving) return event.preventDefault()
  draggedId.value = task.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(task.id))
}
function finish() {
  draggedId.value = null
  target.value = ''
}
function over(event, status) {
  if (draggedId.value == null || props.saving) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  target.value = status
  // Continua rolando a coluna quando o card se aproxima das bordas.
  const list = event.currentTarget.querySelector('.kanban__list')
  const bounds = list.getBoundingClientRect()
  if (event.clientY > bounds.bottom - 60) list.scrollTop += 20
  else if (event.clientY < bounds.top + 60) list.scrollTop -= 20
}
function drop(event, status) {
  event.preventDefault()
  if (draggedId.value != null && !props.saving) {
    emit('move', { taskId: draggedId.value, status })
  }
  finish()
}
</script>

<template>
  <p class="kanban__hint">Arraste uma tarefa para outra coluna para mudar sua situação.</p>
  <div class="kanban" aria-label="Quadro de tarefas" :aria-busy="saving">
    <section
      v-for="column in columns"
      :key="column.key"
      class="kanban__column"
      :class="{ 'kanban__column--target': target === column.key }"
      :aria-label="column.label"
      @dragover="over($event, column.key)"
      @drop="drop($event, column.key)"
    >
      <header class="kanban__heading">
        <h3><span aria-hidden="true">●</span> {{ column.label }}</h3>
        <span class="kanban__count">{{ grouped[column.key].length }}</span>
      </header>
      <div class="kanban__list" tabindex="0" :aria-label="`Tarefas: ${column.label}`">
        <article
          v-for="task in grouped[column.key]"
          :key="task.id"
          class="kanban__card"
          :class="{ 'kanban__card--dragging': draggedId === task.id }"
          :draggable="!saving"
          @dragstart="start($event, task)"
          @dragend="finish"
        >
          <ProjectTaskCard :task="task" draggable="false" />
          <label class="kanban__move">
            <span aria-hidden="true">⠿</span> Mover para
            <select
              :value="task.status"
              :disabled="saving"
              :aria-label="`Mover tarefa ${task.titulo} para`"
              @change="emit('move', { taskId: task.id, status: $event.target.value }); $event.target.value = task.status"
            >
              <option v-for="option in columns" :key="option.key" :value="option.key">
                {{ option.label }}
              </option>
            </select>
          </label>
        </article>
        <p v-if="!grouped[column.key].length" class="kanban__empty">
          Arraste uma tarefa para cá.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.kanban { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 16px; overflow-x: auto; padding: 4px 2px 12px; }
.kanban, .kanban__list { scrollbar-width: none; -ms-overflow-style: none; }
.kanban::-webkit-scrollbar, .kanban__list::-webkit-scrollbar { display: none; }
.kanban__hint { color: #666; font-size: 13px; margin-bottom: 16px; }
.kanban__column { min-width: 0; background: #f6f6f6; border: 1px solid #ddd; border-radius: 12px; transition: background .15s, border-color .15s; }
.kanban__column--target { background: #e9e9e9; border-color: #111; outline: 2px dashed #777; outline-offset: -4px; }
.kanban__heading { display: flex; align-items: center; gap: 12px; padding: 18px; border-bottom: 1px solid #ddd; }
.kanban__heading h3 { margin: 0; font-size: 15px; color: #222; }
.kanban__heading h3 span { margin-right: 6px; }
.kanban__count { border-radius: 20px; background: #e7e7e7; padding: 2px 8px; font-size: 12px; }
.kanban__list { height: min(65vh, 640px); min-height: 300px; overflow-y: auto; padding: 12px; overscroll-behavior-y: contain; }
.kanban__card { margin-bottom: 12px; border: 1px solid #ddd; border-radius: 10px; background: white; cursor: grab; }
.kanban__card:active { cursor: grabbing; }
.kanban__card--dragging { opacity: .4; }
.kanban__card :deep(.momentum-task) { border: 0; border-radius: 10px 10px 0 0; padding: 16px; height: auto; }
.kanban__move { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
.kanban__move select { min-width: 0; flex: 1; max-width: 155px; padding: 6px; background: white; color: #222; border: 1px solid #ddd; border-radius: 6px; }
.kanban__empty { padding: 28px 12px; border: 1px dashed #ccc; border-radius: 8px; text-align: center; color: #777; font-size: 13px; }
.kanban__list:focus-visible, .kanban__move select:focus-visible { outline: 2px solid #333; outline-offset: -2px; }
@media (max-width: 600px) { .kanban { grid-template-columns: repeat(3, minmax(260px, 85vw)); } }
</style>
