<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useHomeStore } from '@/stores/homeStore'
import {
  URGENCY_LABELS,
  deadlineLabel,
  daysUntilDeadline,
} from '@/utils/homePresentation'
import defaultCard from '@/components/ui/defaultCard.vue'
import '@/assets/css/home.css'

const authStore = useAuthStore()
const home = useHomeStore()

const firstName = computed(() => (authStore.user?.name?.trim() || 'Usuário').split(' ')[0])
const quickLinks = [
  {
    number: '01',
    category: 'ORGANIZAÇÃO',
    icon: 'mdi mdi-list-box-outline',
    title: 'Seus projetos',
    description: 'Acompanhe suas equipes, projetos e entregas.',
    action: 'Ver projetos',
    to: '/projects',
    available: true,
  },
  {
    number: '02',
    category: 'CRIATIVIDADE',
    icon: 'mdi mdi-lightbulb-outline',
    title: 'Todas as suas ideias',
    description: 'Notas pessoais e ideias dos projetos, em um só espaço.',
    action: 'Abrir notas',
    to: '/notes',
    available: true,
  },
]

function projectName(task) {
  return home.projectsById[String(task?.projeto)]?.name || 'Projeto'
}

function urgencyName(task) {
  return URGENCY_LABELS[task.urgencia] || URGENCY_LABELS[task.prioridade] || 'Normal'
}

function urgencyClass(task) {
  const days = daysUntilDeadline(task)
  if (task.atrasada || (days != null && days < 0)) return 'late'
  if (days != null && days <= 2) return 'high'
  return ['alta', 'muito_alta'].includes(task.urgencia) ? 'high' : 'normal'
}

function formattedTime(raw) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

onMounted(() => {
  home.load()
})
</script>

<template>
  <main class="home-page">
    <section class="home-welcome">
      <div class="home-welcome-content">
        <span class="home-eyebrow">MOMENTUM / SEU ESPAÇO</span>
        <h1>Olá, {{ firstName }}<span class="home-title-period">.</span></h1>
        <p class="home-welcome-description">
          Veja o que merece sua atenção hoje e continue de onde o projeto parou.
        </p>
        <div class="home-actions">
          <a href="#seu-foco" class="home-primary-button">
            Ver minhas prioridades
            <span class="mdi mdi-arrow-down" aria-hidden="true"></span>
          </a>
          <RouterLink to="/projects" class="home-secondary-link">
            Meus projetos <span class="mdi mdi-arrow-top-right" aria-hidden="true"></span>
          </RouterLink>
        </div>
      </div>
      <div class="home-welcome-decoration" aria-hidden="true">
        <span class="decoration-circle decoration-circle-one"></span>
        <span class="decoration-circle decoration-circle-two"></span>
        <span class="decoration-square"></span>
      </div>
      <span class="home-welcome-index" aria-hidden="true">WORKSPACE / HOME</span>
    </section>

    <section id="seu-foco" class="home-intelligence">
      <header class="home-section-heading home-focus-heading">
        <div>
          <span class="home-eyebrow">SEU FOCO</span>
          <h2>O que importa agora.</h2>
        </div>
        <p>Tarefas urgentes e um plano inteligente para seu dia, direto do projeto.</p>
      </header>

      <div class="home-focus-grid">
        <section class="home-panel" aria-labelledby="home-priorities-title">
          <div class="home-panel-heading">
            <div class="home-panel-heading-title">
              <span class="home-panel-icon mdi mdi-alert-circle-outline" aria-hidden="true"></span>
              <div>
                <span class="home-panel-eyebrow">ATENÇÃO PRIMEIRO</span>
                <h3 id="home-priorities-title">Principais tarefas</h3>
              </div>
            </div>
            <button type="button" class="home-refresh" :disabled="home.loadingPriorities" @click="home.loadPriorities()" aria-label="Atualizar tarefas" title="Atualizar tarefas">
              <span class="mdi mdi-refresh" aria-hidden="true"></span>
            </button>
          </div>
          <p class="home-panel-description">Tarefas em aberto, priorizadas por urgência e prazo.</p>
          <div v-if="home.loadingPriorities" class="home-panel-state" role="status">Buscando tarefas urgentes...</div>
          <div v-else-if="home.priorityError" class="home-panel-state home-panel-state--error" role="alert">
            <p>{{ home.priorityError }}</p>
            <button type="button" class="home-inline-action" @click="home.loadPriorities()">Tentar novamente</button>
          </div>
          <ol v-else-if="home.priorityTasks.length" class="home-task-list">
            <li v-for="(task, index) in home.priorityTasks" :key="task.id">
              <RouterLink :to="{ name: 'task-view', params: { id: task.id } }" class="home-task-item">
                <span class="home-task-number">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="home-task-main">
                  <strong>{{ task.titulo }}</strong>
                  <small>{{ projectName(task) }}</small>
                </span>
                <span class="home-task-meta">
                  <span class="home-urgency-tag" :class="'home-urgency-tag--' + urgencyClass(task)">{{ urgencyName(task) }}</span>
                  <span class="home-task-deadline">{{ deadlineLabel(task) }}</span>
                </span>
                <span class="mdi mdi-arrow-top-right home-task-arrow" aria-hidden="true"></span>
              </RouterLink>
            </li>
          </ol>
          <div v-else class="home-panel-state">
            <span class="mdi mdi-check-circle-outline" aria-hidden="true"></span>
            Nenhuma tarefa pendente por enquanto.
          </div>
        </section>

        <section class="home-panel home-panel--day" aria-labelledby="home-day-title">
          <div class="home-panel-heading">
            <div class="home-panel-heading-title">
              <span class="home-panel-icon mdi mdi-lightning-bolt-outline" aria-hidden="true"></span>
              <div>
                <span class="home-panel-eyebrow">RECOMENDAÇÃO INTELIGENTE</span>
                <h3 id="home-day-title">Meu dia</h3>
              </div>
            </div>
            <button type="button" class="home-refresh" :disabled="home.loadingDay" @click="home.loadDay()" aria-label="Atualizar meu dia" title="Atualizar meu dia">
              <span class="mdi mdi-refresh" aria-hidden="true"></span>
            </button>
          </div>
          <p class="home-panel-description">O backend considera prioridade, vencimento e dependências para sugerir os próximos passos.</p>
          <div v-if="home.loadingDay" class="home-panel-state" role="status">Montando seu plano de hoje...</div>
          <div v-else-if="home.dayError" class="home-panel-state home-panel-state--error" role="alert">
            <p>{{ home.dayError }}</p>
            <button type="button" class="home-inline-action" @click="home.loadDay()">Tentar novamente</button>
          </div>
          <template v-else>
            <div v-if="home.smartDay" class="home-day-stat">
              <strong>{{ home.smartDay.total_pendentes ?? 0 }}</strong>
              <span>pendente(s) para considerar</span>
              <span v-if="home.smartDay.total_bloqueadas" class="home-day-blocked">{{ home.smartDay.total_bloqueadas }} bloqueada(s)</span>
            </div>
            <ol v-if="home.recommendations.length" class="home-day-list">
              <li v-for="(item, index) in home.recommendations" :key="item.tarefa.id">
                <RouterLink :to="{ name: 'task-view', params: { id: item.tarefa.id } }" class="home-day-item">
                  <span class="home-day-order">{{ index + 1 }}</span>
                  <span class="home-day-main">
                    <strong>{{ item.tarefa.titulo }}</strong>
                    <small>{{ projectName(item.tarefa) }}</small>
                    <span class="home-day-reasons">
                      <span v-for="(reason, i) in (item.motivos || []).slice(0, 2)" :key="i">{{ reason }}</span>
                    </span>
                  </span>
                  <span v-if="item.bloqueada" class="home-day-lock" title="Tarefa bloqueada por dependências">
                    <span class="mdi mdi-lock-outline" aria-hidden="true"></span> Bloqueada
                  </span>
                  <span v-else class="mdi mdi-arrow-top-right home-task-arrow" aria-hidden="true"></span>
                </RouterLink>
              </li>
            </ol>
            <div v-else class="home-panel-state">
              <span class="mdi mdi-check-circle-outline" aria-hidden="true"></span>
              Seu dia está livre de tarefas pendentes.
            </div>
          </template>
        </section>
      </div>
    </section>

    <section class="home-last-project" aria-labelledby="home-mural-title">
      <div class="home-section-heading home-last-heading">
        <div>
          <span class="home-eyebrow">CONTINUE DE ONDE PAROU</span>
          <h2 id="home-mural-title">Mural de ideias do projeto.</h2>
        </div>
        <p>Notas no estilo Google Keep, vinculadas ao projeto com a atividade mais recente.</p>
      </div>

      <div v-if="home.loadingProject" class="home-panel home-panel-state" role="status">
        Localizando seu último projeto e as ideias...
      </div>
      <div v-else-if="home.projectError" class="home-panel home-panel-state home-panel-state--error" role="alert">
        <p>{{ home.projectError }}</p>
        <button type="button" class="home-inline-action" @click="home.loadRecentProject()">Tentar novamente</button>
      </div>
      <div v-else-if="home.recentProject" class="home-mural-panel">
        <div class="home-mural-heading">
          <div>
            <span class="home-panel-eyebrow">{{ home.recentProject.lastActivityAt ? 'ÚLTIMA MOVIMENTAÇÃO REGISTRADA' : 'PROJETO MAIS RECENTE' }}</span>
            <h3>{{ home.recentProject.project.name }}</h3>
            <p v-if="home.recentProject.lastActivityAt">
              Atividade em {{ formattedTime(home.recentProject.lastActivityAt) }}
            </p>
            <p v-else>Sem movimentações registradas. Exibindo pelo cadastro do projeto.</p>
            <p v-if="home.activityIncomplete" class="home-mural-warning">
              Não foi possível consultar o histórico de todos os projetos.
            </p>
          </div>
          <RouterLink :to="{ name: 'project-mural', params: { id: home.recentProject.project.id } }" class="home-mural-button">
            Abrir mural
            <span class="mdi mdi-arrow-top-right" aria-hidden="true"></span>
          </RouterLink>
        </div>

        <div v-if="home.notesError" class="home-panel-state home-panel-state--error" role="alert">
          {{ home.notesError }}
          <RouterLink :to="{ name: 'project-mural', params: { id: home.recentProject.project.id } }" class="home-inline-action">Abrir mural mesmo assim</RouterLink>
        </div>
        <div v-else-if="home.recentNotes.length" class="home-notes-preview">
          <RouterLink
            v-for="note in home.recentNotes"
            :key="note.id"
            :to="{ name: 'project-mural', params: { id: home.recentProject.project.id } }"
            class="home-note-preview"
            :style="{ '--note-tint': note.cor || '#fff6a7' }"
          >
            <span class="home-note-preview-top">
              <span class="mdi mdi-note-outline" aria-hidden="true"></span>
              <span class="mdi mdi-arrow-up-right" aria-hidden="true"></span>
            </span>
            <strong>{{ note.titulo || 'Ideia sem título' }}</strong>
            <span class="home-note-preview-content">{{ note.conteudo || (note.imagem_url ? 'Ideia com foto' : note.link ? 'Ideia com link' : 'Ver no mural') }}</span>
          </RouterLink>
        </div>
        <p v-else class="home-mural-empty">
          Ainda não há ideias neste projeto. Abra o mural para adicionar a primeira.
        </p>
      </div>
      <div v-else class="home-panel home-panel-state">
        Você ainda não participa de projetos. <RouterLink to="/projects">Explorar projetos</RouterLink>
      </div>
    </section>

    <section class="home-resources home-shortcuts" aria-labelledby="home-shortcuts-title">
      <div class="home-section-heading">
        <div>
          <span class="home-eyebrow">ACESSO RÁPIDO</span>
          <h2 id="home-shortcuts-title">Seus espaços.</h2>
        </div>
      </div>
      <div class="home-resources-grid home-links-grid">
        <defaultCard v-for="resource in quickLinks" :key="resource.number" v-bind="resource" />
      </div>
    </section>

    <footer class="home-footer">
      <span>MOMENTUM / HACKATHON 2026</span>
      <span>ORGANIZE • PRIORIZE • CRIE</span>
    </footer>
  </main>
</template>
