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
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  min-width: 0;
  padding-bottom: 24px;
  border-bottom: 2px solid #000;
  background: #fff;
  color: #000;
}
.project-info { min-width: 0; }
.project-status {
  display: inline-block;
  padding: 5px 12px;
  border: 1px solid #000;
  border-radius: 999px;
  font-size: 12px;
}
h1 {
  margin: 14px 0 10px;
  font-size: clamp(28px, 7vw, 38px);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.project-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}
button,
.board-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #000;
  border-radius: 999px;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}
.board-link {
  grid-column: 1 / -1;
  background: #fff;
  color: #000;
  text-decoration: none;
}
.delete-button { background: #fff; color: #000; }
button:hover,
.board-link:hover { text-decoration: underline; }
button:focus-visible,
.board-link:focus-visible { outline: 2px solid #000; outline-offset: 4px; }

@media (min-width: 640px) {
  .project-header { gap: 24px; padding-bottom: 28px; }
  h1 { font-size: clamp(32px, 4vw, 42px); }
  .project-actions {
    display: flex;
    flex-wrap: wrap;
  }
  button,
  .board-link {
    width: auto;
    padding: 10px 18px;
    font-size: 13px;
  }
}

@media (min-width: 1150px) {
  .project-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
  .project-info { flex: 1; }
  .project-actions { justify-content: flex-end; }
}
</style>
