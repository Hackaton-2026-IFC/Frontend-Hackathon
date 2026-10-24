<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    default: () => ({}),
  },
  total: {
    type: Number,
    default: null,
  },
  completed: {
    type: Number,
    default: null,
  },
  inProgress: {
    type: Number,
    default: 0,
  },
  planned: {
    type: Number,
    default: 0,
  },
})

const showDetails = ref(false)

const totalTasks = computed(() =>
  Math.max(0, Number(props.total ?? props.project?.total_tasks ?? 0) || 0),
)

const completedTasks = computed(() =>
  Math.min(
    totalTasks.value,
    Math.max(0, Number(props.completed ?? props.project?.completed_tasks ?? 0) || 0),
  ),
)

const percentage = computed(() => {
  if (!totalTasks.value) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

const stats = computed(() => [
  { label: 'Total de tarefas', value: totalTasks.value },
  { label: 'Concluídas', value: completedTasks.value },
  { label: 'Em andamento', value: props.inProgress },
  { label: 'Planejadas', value: props.planned },
])
</script>

<template>
  <section class="momentum-progress">
    <div class="momentum-progress__header">
      <div class="momentum-progress__info">
        <h2>Progresso do projeto</h2>
        <p>{{ completedTasks }} de {{ totalTasks }} tarefas concluídas</p>
      </div>

      <strong class="momentum-progress__percentage">
        {{ percentage }}%
      </strong>
    </div>

    <div
      class="momentum-progress__track"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Progresso do projeto"
    >
      <div
        class="momentum-progress__fill"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>

    <button
      type="button"
      class="momentum-progress__toggle"
      :aria-expanded="showDetails"
      aria-controls="momentum-progress-details"
      @click="showDetails = !showDetails"
    >
      {{ showDetails ? 'Menos detalhes' : 'Mais detalhes' }}

      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="{ 'is-open': showDetails }"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div
      v-if="showDetails"
      id="momentum-progress-details"
      class="momentum-progress__details"
    >
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="momentum-progress__stat"
      >
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.momentum-progress {
  width: 100%;
  min-width: 0;
  padding: 28px;
  box-sizing: border-box;
  border: 1px solid #dedede;
  border-radius: 18px;
  background: #ffffff;
  color: #111111;
}

.momentum-progress__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.momentum-progress__info {
  min-width: 0;
}

.momentum-progress__info h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.4px;
}

.momentum-progress__info p {
  margin: 7px 0 0;
  color: #666666;
  font-size: 13px;
  line-height: 1.5;
}

.momentum-progress__percentage {
  flex-shrink: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -1px;
}

.momentum-progress__track {
  width: 100%;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #eeeeee;
}

.momentum-progress__fill {
  height: 100%;
  border-radius: inherit;
  background: #111111;
  transition: width 0.3s ease;
}

.momentum-progress__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #666666;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.momentum-progress__toggle:hover {
  color: #111111;
}

.momentum-progress__toggle:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 4px;
}

.momentum-progress__toggle svg {
  transition: transform 0.2s ease;
}

.momentum-progress__toggle svg.is-open {
  transform: rotate(180deg);
}

.momentum-progress__details {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eeeeee;
}

.momentum-progress__stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  background: #fafafa;
}

.momentum-progress__stat strong {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.momentum-progress__stat span {
  color: #666666;
  font-size: 12px;
}

@media (max-width: 700px) {
  .momentum-progress__details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .momentum-progress {
    padding: 20px;
    border-radius: 14px;
  }

  .momentum-progress__info h2 {
    font-size: 16px;
  }

  .momentum-progress__info p {
    font-size: 12px;
  }

  .momentum-progress__percentage {
    font-size: 24px;
  }

  .momentum-progress__track {
    height: 6px;
  }
}

@media (max-width: 380px) {
  .momentum-progress__stat {
    padding: 12px;
  }

  .momentum-progress__stat strong {
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .momentum-progress__fill,
  .momentum-progress__toggle svg {
    transition: none;
  }
}
</style>