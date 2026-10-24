<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useProjectActivityStore } from '@/stores/projectActivityStore'
import {
  activityAction,
  activityChanges,
  activityDate,
  activityTaskTitle,
} from '@/utils/projectActivity'

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
const activityStore = useProjectActivityStore()
const activity = computed(() =>
  activityStore.byProject[String(props.project?.id)] || {
    events: [], count: 0, nextPage: null, loading: false, loaded: false, error: '',
  },
)

function toggleDetails() {
  showDetails.value = !showDetails.value
  if (showDetails.value && props.project?.id != null) {
    void activityStore.load(props.project.id, { refresh: true })
  }
}

function reloadActivities() {
  if (props.project?.id != null) {
    void activityStore.load(props.project.id, { refresh: true })
  }
}

function loadMoreActivities() {
  if (props.project?.id != null) {
    void activityStore.load(props.project.id, { more: true })
  }
}

function activityIcon(action) {
  if (action === 'tarefa_criada') return 'mdi-plus-circle-outline'
  if (action === 'tarefa_excluida' || action === 'comentario_excluido') return 'mdi-delete-outline'
  if (action?.startsWith('comentario_')) return 'mdi-comment-text-outline'
  return 'mdi-pencil-outline'
}

// O mesmo componente é reaproveitado quando o usuário navega entre projetos.
watch(() => props.project?.id, (id, previousId) => {
  if (showDetails.value && id != null && String(id) !== String(previousId)) {
    void activityStore.load(id, { refresh: true })
  }
})

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
      @click="toggleDetails"
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

    <div v-if="showDetails" id="momentum-progress-details">
      <div class="momentum-progress__details">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="momentum-progress__stat"
        >
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </div>
      </div>

      <section class="momentum-progress__feed" aria-labelledby="momentum-progress-feed-title">
        <div class="momentum-progress__feed-header">
          <div>
            <span class="momentum-progress__feed-eyebrow">HISTÓRICO DO PROJETO</span>
            <h3 id="momentum-progress-feed-title">Atividades recentes</h3>
            <p>Veja o que a equipe fez e quando aconteceu.</p>
          </div>
          <button
            type="button"
            class="momentum-progress__refresh"
            :disabled="activity.loading || project?.id == null"
            @click="reloadActivities"
          >
            <span class="mdi mdi-refresh" aria-hidden="true"></span>
            Atualizar
          </button>
        </div>

        <p v-if="activity.loading && !activity.loaded" class="momentum-progress__feed-state" role="status">
          Carregando atividades...
        </p>

        <div v-if="activity.error" class="momentum-progress__feed-error" role="alert">
          <span>{{ activity.error }}</span>
          <button type="button" :disabled="activity.loading" @click="reloadActivities">
            Tentar novamente
          </button>
        </div>

        <ol v-if="activity.events.length" class="momentum-progress__timeline">
          <li v-for="event in activity.events" :key="event.id" class="momentum-progress__event">
            <div class="momentum-progress__marker" aria-hidden="true">
              <span class="mdi" :class="activityIcon(event.acao)"></span>
            </div>
            <div class="momentum-progress__event-content">
              <p class="momentum-progress__event-text">
                <strong>{{ event.autor_nome || 'Integrante da equipe' }}</strong>
                {{ activityAction(event.acao) }}
                <RouterLink
                  v-if="event.tarefa != null"
                  :to="{ name: 'task-view', params: { id: event.tarefa } }"
                >{{ activityTaskTitle(event) }}</RouterLink>
                <span v-else class="momentum-progress__event-task">{{ activityTaskTitle(event) }}</span>
              </p>
              <time v-if="activityDate(event.criado_em)" :datetime="event.criado_em">
                {{ activityDate(event.criado_em) }}
              </time>
              <ul v-if="activityChanges(event).length" class="momentum-progress__changes">
                <li v-for="(change, index) in activityChanges(event)" :key="index">
                  {{ change }}
                </li>
              </ul>
            </div>
          </li>
        </ol>

        <p
          v-else-if="!activity.loading && !activity.error"
          class="momentum-progress__feed-state"
        >
          Ainda não há atividades registradas neste projeto.
        </p>

        <div v-if="activity.events.length" class="momentum-progress__feed-footer">
          <span>
            {{ activity.events.length }} de {{ activity.count }} atividades
            <span v-if="activity.loading" role="status"> · Atualizando...</span>
          </span>
          <button
            v-if="activity.nextPage"
            type="button"
            class="momentum-progress__load-more"
            :disabled="activity.loading"
            @click="loadMoreActivities"
          >
            {{ activity.loading ? 'Carregando...' : 'Carregar mais atividades' }}
          </button>
        </div>
      </section>
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

/* Feed de atividades: visível apenas quando Mais detalhes está aberto. */
.momentum-progress__feed {
  margin-top: 26px;
  padding-top: 24px;
  border-top: 1px solid #eeeeee;
}
.momentum-progress__feed-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 19px;
}
.momentum-progress__feed-eyebrow {
  color: #858585;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 1px;
}
.momentum-progress__feed-header h3 {
  margin: 7px 0 5px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.4px;
}
.momentum-progress__feed-header p {
  margin: 0;
  font-size: 12px;
  color: #777;
  line-height: 1.5;
}
.momentum-progress__refresh,
.momentum-progress__load-more,
.momentum-progress__feed-error button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid #dedede;
  border-radius: 9px;
  background: #fff;
  color: #262626;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}
.momentum-progress__refresh:hover:not(:disabled),
.momentum-progress__load-more:hover:not(:disabled),
.momentum-progress__feed-error button:hover:not(:disabled) {
  background: #f4f4f4;
}
.momentum-progress__refresh:disabled,
.momentum-progress__load-more:disabled,
.momentum-progress__feed-error button:disabled {
  opacity: 0.5;
  cursor: wait;
}
.momentum-progress__refresh:focus-visible,
.momentum-progress__load-more:focus-visible,
.momentum-progress__feed-error button:focus-visible,
.momentum-progress__event a:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}
.momentum-progress__refresh .mdi { font-size: 17px; }
.momentum-progress__feed-state {
  margin: 0;
  padding: 24px 14px;
  border: 1px dashed #e4e4e4;
  border-radius: 12px;
  color: #777;
  background: #fafafa;
  text-align: center;
  font-size: 13px;
  line-height: 1.5;
}
.momentum-progress__feed-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 13px 15px;
  border: 1px solid #e9c6c6;
  border-radius: 10px;
  background: #fff6f6;
  color: #8c3030;
  font-size: 12px;
  line-height: 1.5;
}
.momentum-progress__timeline {
  list-style: none;
  padding: 0;
  margin: 0;
}
.momentum-progress__event {
  display: flex;
  gap: 14px;
  min-width: 0;
  padding: 0 0 22px;
}
.momentum-progress__event:last-child { padding-bottom: 0; }
.momentum-progress__marker {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex: 0 0 36px;
  padding-top: 1px;
}
.momentum-progress__marker::after {
  content: '';
  position: absolute;
  top: 38px;
  bottom: -21px;
  width: 2px;
  background: #ededed;
}
.momentum-progress__event:last-child .momentum-progress__marker::after { display: none; }
.momentum-progress__marker > .mdi {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e8e8e8;
  border-radius: 50%;
  background: #f7f7f7;
  color: #333;
  font-size: 18px;
}
.momentum-progress__event-content {
  flex: 1;
  min-width: 0;
  padding: 8px 0 0;
}
.momentum-progress__event-text {
  margin: 0;
  color: #555;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.momentum-progress__event-text strong { color: #1a1a1a; font-weight: 700; }
.momentum-progress__event-text a {
  color: #222;
  font-weight: 650;
  text-decoration: underline;
  text-decoration-color: #bbb;
  text-underline-offset: 3px;
}
.momentum-progress__event-text a:hover { text-decoration-color: #222; }
.momentum-progress__event-task { color: #333; font-weight: 650; }
.momentum-progress__event time {
  display: inline-block;
  margin-top: 4px;
  color: #888;
  font-size: 11px;
}
.momentum-progress__changes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}
.momentum-progress__changes li {
  max-width: 100%;
  padding: 5px 9px;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #fafafa;
  color: #656565;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.momentum-progress__feed-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
  padding-top: 17px;
  border-top: 1px solid #ededed;
  color: #888;
  font-size: 11px;
}
@media (max-width: 600px) {
  .momentum-progress__feed { margin-top: 22px; }
  .momentum-progress__feed-header h3 { font-size: 16px; }
  .momentum-progress__event { gap: 10px; }
  .momentum-progress__marker { flex-basis: 32px; }
  .momentum-progress__marker > .mdi { width: 32px; height: 32px; }
  .momentum-progress__marker::after { top: 34px; }
  .momentum-progress__event-text { font-size: 12px; }
}

</style>