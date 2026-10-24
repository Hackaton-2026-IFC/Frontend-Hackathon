<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { computed, ref, watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { TASK_PRIORITIES, TASK_STATUSES, safeResourceUrl, taskError, formatDeadline } from '@/api/taskApi'
import {
  automaticPriority,
  assigneeMembers,
  assigneeDisplayName,
  taskCompletionDate,
  taskDueDate,
  taskIsOverdue,
} from '@/utils/taskPresentation'
import TaskAssigneeAvatar from '@/components/tasks/TaskAssigneeAvatar.vue'
import TaskRoadmap from '@/components/tasks/TaskRoadmap.vue'
import TaskCommentsModal from '@/components/tasks/TaskCommentsModal.vue'

const props = defineProps({
  task: { type: Object, required: true },
  tasks: { type: Array, required: true },
  projects: { type: Array, required: true },
  additionalAssigneesByTask: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['edit', 'removed'])
const store = useTaskStore()
const confirmDialog = ref(null)
const commentsOpen = ref(false)
const deletingError = ref('')
const linkError = ref('')
const showLinkForm = ref(false)
const linkTitle = ref('')
const linkUrl = ref('')
const linkType = ref('link')

const project = computed(() =>
  props.projects.find((item) => String(item.id) === String(props.task.projeto)),
)
const assignees = computed(() =>
  assigneeMembers(props.task, props.projects, props.additionalAssigneesByTask),
)
const creator = computed(() =>
  project.value?.participantes?.find((person) =>
    String(person.usuario) === String(props.task.criado_por),
  ),
)
const priorityCode = computed(() => automaticPriority(props.task))
const priorityLabel = computed(() => TASK_PRIORITIES[priorityCode.value] || 'Sem urgência')
const isLate = computed(() => taskIsOverdue(props.task))
const completionDate = computed(() => taskCompletionDate(props.task))
const roadmapSteps = computed(() => props.task.microtarefas || [])
const roadmapCompleted = computed(() => roadmapSteps.value.filter((step) => step.concluida).length)
const taskDependencies = computed(() =>
  (props.task.dependencias || []).map((id) => ({
    id,
    task: props.tasks.find((item) => String(item.id) === String(id)),
  })),
)
const resources = computed(() => store.resourcesByTask[String(props.task.id)] || [])

function prettyDate(value) {
  if (!value) return 'Não informada'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(parsed)
}

async function loadLinks(id) {
  linkError.value = ''
  if (store.resourcesByTask[String(id)] !== undefined) return
  try {
    await store.loadResources(id)
  } catch {
    // Resource-specific error is shown below, not swallowed or sent to the view.
  }
}

watch(
  () => props.task.id,
  (id) => {
    showLinkForm.value = false
    linkTitle.value = ''
    linkUrl.value = ''
    deletingError.value = ''
    commentsOpen.value = false
    loadLinks(id)
  },
  { immediate: true },
)

async function addLink() {
  if (!linkTitle.value.trim() || !safeResourceUrl(linkUrl.value) || store.busy) {
    linkError.value = 'Informe um título e um link HTTP ou HTTPS válido.'
    return
  }
  linkError.value = ''
  try {
    await store.addResource(props.task.id, {
      titulo: linkTitle.value.trim(),
      url: linkUrl.value.trim(),
      tipo: linkType.value,
    })
    linkTitle.value = ''
    linkUrl.value = ''
    showLinkForm.value = false
  } catch (err) {
    linkError.value = taskError(err)
  }
}

function openDelete() {
  deletingError.value = ''
  confirmDialog.value?.showModal()
}

async function deleteTask() {
  if (store.busy) return
  deletingError.value = ''
  try {
    await store.remove(props.task.id)
    confirmDialog.value?.close()
    emit('removed', props.task.id)
  } catch (err) {
    deletingError.value = taskError(err)
  }
}
</script>

<template>
  <article class="task-workspace" :class="{ 'task-workspace--late': isLate }">
    <header class="task-workspace__header">
      <div class="task-workspace__heading">
        <span class="workspace-kicker">{{ project?.nome || 'Projeto' }} / TAREFA #{{ task.id }}</span>
        <h2>{{ task.titulo }}</h2>
        <div class="workspace-tags">
          <span class="workspace-tag" :class="{ 'workspace-tag--late': isLate }">
            {{ isLate ? 'Atrasada' : TASK_STATUSES[task.status] || 'A fazer' }}
          </span>
          <span class="workspace-tag workspace-tag--priority">
            <span
              v-if="priorityCode"
              class="task-priority__dot"
              :class="`task-priority__dot--${priorityCode}`"
              aria-hidden="true"
            ></span>
            Prioridade {{ priorityLabel.toLowerCase() }}
          </span>
        </div>
      </div>
      <div class="task-workspace__actions">
        <button type="button" class="task-button task-primary" :disabled="store.busy" @click="emit('edit', task.id)">
          Editar tarefa
        </button>
        <button type="button" class="task-button task-button--danger" :disabled="store.busy" @click="openDelete">
          Excluir
        </button>
      </div>
    </header>

    <div class="task-workspace__body">
      <div class="task-workspace__primary">
        <section class="workspace-section" aria-labelledby="task-description">
          <div class="workspace-section__heading">
            <p class="workspace-kicker">CONTEXTO</p>
            <h3 id="task-description">Descrição</h3>
          </div>
          <p class="task-description">{{ task.descricao?.trim() || 'Esta tarefa ainda não possui descrição.' }}</p>
        </section>

        <TaskRoadmap :key="task.id" :task="task" />

        <section class="workspace-section" aria-labelledby="task-resources">
          <div class="workspace-section__heading workspace-section__heading--actions">
            <div>
              <p class="workspace-kicker">REFERÊNCIAS</p>
              <h3 id="task-resources">Materiais de apoio</h3>
            </div>
            <button type="button" class="task-button" :disabled="store.busy" @click="showLinkForm = !showLinkForm">
              {{ showLinkForm ? 'Fechar' : '+ Adicionar link' }}
            </button>
          </div>

          <p v-if="store.resourcesLoading[task.id]" class="workspace-muted" role="status">Carregando materiais...</p>
          <template v-if="store.resourceErrors[task.id]">
        <ToastNotice :message="store.resourceErrors[task.id]" type="error" />
<button type="button" class="task-button" @click="store.loadResources(task.id).catch(() => {})">
              Tentar novamente
            </button>
      </template>

          <ul v-if="resources.length" class="workspace-link-list">
            <li v-for="resource in resources" :key="resource.id">
              <a v-if="safeResourceUrl(resource.url)" :href="safeResourceUrl(resource.url)" target="_blank" rel="noopener noreferrer">
                {{ resource.titulo }} <span aria-hidden="true">↗</span>
              </a>
              <span v-else>{{ resource.titulo }}</span>
              <small>{{ resource.tipo || 'link' }} <span v-if="resource.descricao">· {{ resource.descricao }}</span></small>
            </li>
          </ul>
          <p v-else-if="!store.resourcesLoading[task.id]" class="workspace-muted">Nenhum material de apoio cadastrado.</p>

          <form v-if="showLinkForm" class="workspace-link-form" @submit.prevent="addLink">
            <label>Título do material<input v-model="linkTitle" maxlength="150" required placeholder="Documentação, protótipo..." /></label>
            <label>Endereço do link<input v-model="linkUrl" type="url" required placeholder="https://..." /></label>
            <label>Tipo
              <select v-model="linkType">
                <option value="link">Link</option>
                <option value="documento">Documento</option>
                <option value="pasta">Pasta</option>
                <option value="repositorio">Repositório</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <ToastNotice v-if="linkError" :message="linkError" type="error" />
            <button type="submit" class="task-button task-primary" :disabled="store.busy || !linkTitle.trim() || !linkUrl.trim()">
              Salvar material
            </button>
          </form>
        </section>
      </div>

      <aside class="task-workspace__aside" aria-label="Informações da tarefa">
        <section class="workspace-aside-section">
          <p class="workspace-kicker">EQUIPE</p>
          <h3>Responsáveis</h3>
          <ul v-if="assignees.length" class="workspace-assignees">
            <li v-for="member in assignees" :key="member.usuario">
              <TaskAssigneeAvatar :member="member" />
              <span>
                <strong>{{ assigneeDisplayName(member) }}</strong>
                <small>
                  {{ String(member.usuario) === String(task.responsavel) ? 'Principal' : 'Adicional neste navegador' }}
                </small>
              </span>
            </li>
          </ul>
          <p v-else class="workspace-muted">Nenhum responsável atribuído.</p>
          
        </section>

        <section class="workspace-aside-section">
          <p class="workspace-kicker">ACOMPANHAMENTO</p>
          <h3>Datas e andamento</h3>
          <dl class="workspace-facts">
            <div><dt>Situação</dt><dd>{{ TASK_STATUSES[task.status] || task.status }}</dd></div>
            <div><dt>Prioridade automática</dt><dd>{{ priorityLabel }}</dd></div>
            <div><dt>Prazo oficial</dt><dd>{{ formatDeadline(task.data_limite) }}</dd></div>
            <div v-if="task.prazo_antecipado"><dt>Meta antecipada</dt><dd>{{ formatDeadline(task.prazo_antecipado) }}</dd></div>
            <div><dt>Prazo considerado</dt><dd>{{ taskDueDate(task) }}</dd></div>
            <div><dt>Criada em</dt><dd>{{ prettyDate(task.data_criacao) }}</dd></div>
            <div v-if="completionDate !== null"><dt>Concluída em</dt><dd>{{ completionDate }}</dd></div>
            <div><dt>Etapas</dt><dd>{{ roadmapCompleted }} de {{ roadmapSteps.length }}</dd></div>
            <div v-if="creator"><dt>Criada por</dt><dd>{{ assigneeDisplayName(creator) }}</dd></div>
          </dl>
        </section>

        <section v-if="taskDependencies.length" class="workspace-aside-section">
          <p class="workspace-kicker">PRÉ-REQUISITOS</p>
          <h3>Dependências</h3>
          <ul class="workspace-dependencies">
            <li v-for="item in taskDependencies" :key="item.id">
              <span>{{ item.task?.titulo || `Tarefa #${item.id}` }}</span>
              <small>{{ item.task ? (TASK_STATUSES[item.task.status] || item.task.status) : 'Sem acesso aos detalhes' }}</small>
            </li>
          </ul>
        </section>

        <section v-if="task.clima_influencia || task.localizacao" class="workspace-aside-section">
          <p class="workspace-kicker">PLANEJAMENTO</p>
          <h3>Localização e clima</h3>
          <p class="workspace-muted">{{ task.localizacao || 'Localização não informada' }}</p>
          <p class="workspace-muted">{{ task.clima_influencia ? 'Esta tarefa depende das condições climáticas.' : 'Sem dependência climática.' }}</p>
        </section>
      </aside>
    </div>

    <button
      type="button"
      class="task-comments-floating"
      :disabled="store.busy"
      aria-label="Abrir comentários desta tarefa"
      @click="commentsOpen = true"
    >
      <span class="mdi mdi-comment-text-outline" aria-hidden="true"></span>
      <span>Comentários</span>
    </button>

    <TaskCommentsModal
      v-if="commentsOpen"
      :task="task"
      :members="project?.participantes || []"
      @close="commentsOpen = false"
    />

    <dialog ref="confirmDialog" class="task-confirm-dialog" @cancel="deletingError = ''">
      <h3>Excluir tarefa?</h3>
      <p>Esta ação também remove as etapas relacionadas e não pode ser desfeita.</p>
      <ToastNotice v-if="deletingError" :message="deletingError" type="error" />
      <div>
        <button type="button" class="task-button" :disabled="store.busy" @click="confirmDialog?.close()">Cancelar</button>
        <button type="button" class="task-button task-button--danger" :disabled="store.busy" @click="deleteTask">
          {{ store.busy ? 'Excluindo...' : 'Excluir tarefa' }}
        </button>
      </div>
    </dialog>
  </article>
</template>
