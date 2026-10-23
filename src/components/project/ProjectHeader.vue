<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete'])

const statuses = {
  planned: 'Planejado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
}
</script>

<template>
  <header class="project-header">
    <div class="project-info">
      <span class="project-status">
        {{ statuses[project.status] || project.status }}
      </span>

      <h1>{{ project.name }}</h1>

      <p>
        {{ project.description || 'Sem descrição por enquanto.' }}
      </p>
    </div>

    <div class="project-actions">
      <RouterLink
        class="board-link"
        :to="{ name: 'project-tasks', params: { projectId: project.id } }"
      >
        Ver tarefas no Kanban ↗
      </RouterLink>

      <button type="button" @click="emit('edit')">
        Editar projeto
      </button>

      <button
        type="button"
        class="delete-button"
        @click="emit('delete')"
      >
        Excluir projeto
      </button>
    </div>
  </header>
</template>

<style scoped>
.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 24px;
  padding-bottom: 28px;
  border-bottom: 2px solid #000;
  background: #fff;
  color: #000;
}

.project-info {
  flex: 1;
  min-width: min(100%, 240px);
}

.project-status {
  display: inline-block;
  padding: 5px 12px;
  border: 1px solid #000;
  border-radius: 999px;
  font-size: 12px;
}

h1 {
  margin: 16px 0 12px;
  font-size: clamp(26px, 4vw, 42px);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.project-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button,
.board-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid #000;
  border-radius: 999px;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.delete-button {
  background: #fff;
  color: #000;
}

.board-link {
  background: #fff;
  color: #000;
  text-decoration: none;
}

button:hover,
.board-link:hover {
  text-decoration: underline;
}

button:focus-visible,
.board-link:focus-visible {
  outline: 2px solid #000;
  outline-offset: 4px;
}
</style>
