<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
})

const priorities = {
  muito_baixa: 'Muito baixa',
  baixa: 'Baixa',
  neutra: 'Normal',
  media: 'Média',
  alta: 'Alta',
  muito_alta: 'Muito alta',
}

const statuses = {
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

const steps = computed(() =>
  Array.isArray(props.task.microtarefas)
    ? props.task.microtarefas
    : [],
)

const completedSteps = computed(() =>
  steps.value.filter(step => step.concluida).length,
)

const taskRoute = computed(() => ({
  name: 'task-view',
  params: {
    id: props.task.id,
  },
}))

function formatDate(value) {
  if (!value) return ''

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  )

  return match
    ? `${match[3]}/${match[2]}/${match[1]}`
    : String(value)
}
</script>

<template>
  <RouterLink
    :to="taskRoute"
    class="momentum-task"
  >
    <div class="momentum-task__content">

      <!-- TÍTULO E PRIORIDADE -->
      <div class="momentum-task__heading">
        <span class="momentum-task__title">
          {{ task.titulo }}
        </span>

        <span
          class="momentum-task__priority"
          :class="`momentum-task__priority--${task.prioridade}`"
        >
          {{
            priorities[task.prioridade] ||
            task.prioridade ||
            'Normal'
          }}
        </span>
      </div>

      <!-- INFORMAÇÕES -->
      <div class="momentum-task__meta">

        <span
          class="momentum-task__status"
          :class="`momentum-task__status--${task.status}`"
        >
          <span class="momentum-task__status-dot"></span>

          {{ statuses[task.status] || task.status }}
        </span>

        <span
          v-if="task.data_limite"
          class="momentum-task__meta-item"
        >
          <span aria-hidden="true">◷</span>
          {{ formatDate(task.data_limite) }}
        </span>

        <span
          v-if="steps.length"
          class="momentum-task__meta-item"
        >
          <span aria-hidden="true">✓</span>
          {{ completedSteps }}/{{ steps.length }} etapas
        </span>

      </div>

    </div>
  </RouterLink>
</template>

<style scoped>
.momentum-task {
  display: flex;
  flex-direction: column;
  justify-content: center;

  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 110px;
  padding: 20px;

  box-sizing: border-box;

  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;

  color: #171717;
  text-decoration: none;

  cursor: pointer;

  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.momentum-task:hover {
  background: #fafafa;
  border-color: #c9c9c9;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.momentum-task__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;

  width: 100%;
  min-width: 0;
}

.momentum-task__heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  width: 100%;
}

.momentum-task__title {
  color: #171717;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.5;

  overflow-wrap: anywhere;
}

.momentum-task__priority {
  display: inline-flex;
  align-items: center;

  padding: 5px 9px;

  background: #f5f5f5;
  border: 1px solid #eeeeee;
  border-radius: 6px;

  color: #666666;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

/* PRIORIDADES */

.momentum-task__priority--baixa,
.momentum-task__priority--muito_baixa {
  background: #f0f9f4;
  border-color: #dcefe3;
  color: #26804b;
}

.momentum-task__priority--media {
  background: #fff8e8;
  border-color: #f5e9c9;
  color: #9b741f;
}

.momentum-task__priority--alta,
.momentum-task__priority--muito_alta {
  background: #fff1f1;
  border-color: #f5dada;
  color: #bd4545;
}

/* METADADOS */

.momentum-task__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;

  width: 100%;
}

.momentum-task__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  color: #858585;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* STATUS */

.momentum-task__status {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: #777777;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.momentum-task__status-dot {
  width: 7px;
  height: 7px;

  flex-shrink: 0;

  border-radius: 50%;
  background: #a3a3a3;
}

.momentum-task__status--em_andamento {
  color: #3974b8;
}

.momentum-task__status--em_andamento
.momentum-task__status-dot {
  background: #3974b8;
}

.momentum-task__status--concluido {
  color: #298452;
}

.momentum-task__status--concluido
.momentum-task__status-dot {
  background: #298452;
}

/* ACESSIBILIDADE */

.momentum-task:focus-visible {
  outline: 2px solid #171717;
  outline-offset: 3px;
}

/* CELULAR */

@media (max-width: 600px) {
  .momentum-task {
    min-height: 100px;
    padding: 16px;
  }

  .momentum-task__title {
    font-size: 13px;
  }

  .momentum-task__meta {
    gap: 10px;
  }
}
</style>