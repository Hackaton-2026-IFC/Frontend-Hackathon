<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import projectsApi from '@/api/projectsApi'
import tasksApi from '@/api/tasksApi'

const route = useRoute()
const id = computed(() => route.params.id)
const project = ref(null)
const board = ref(null)
const resources = ref([])
const error = ref('')
const loading = ref(false)
const saving = ref(false)
const newTask = ref({ titulo: '', descricao: '', prioridade: 'neutra', data_limite: '' })
const newResource = ref({ titulo: '', url: '', tipo: 'link' })
const columns = [
  { key: 'planejado', label: 'Planejado' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido', label: 'Concluído' },
]
function explain(e) {
  const d = e?.response?.data
  if (typeof d?.detail === 'string') return d.detail
  if (d && typeof d === 'object') return Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' • ')
  return e.message || 'Ocorreu um erro.'
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, k, r] = await Promise.all([
      projectsApi.get(id.value), projectsApi.kanban(id.value), projectsApi.resources(id.value),
    ])
    project.value = p.data
    board.value = k.data
    resources.value = Array.isArray(r.data) ? r.data : (r.data.results ?? [])
  } catch (e) { error.value = explain(e) }
  finally { loading.value = false }
}
async function addTask() {
  saving.value = true
  error.value = ''
  try {
    await tasksApi.create({
      projeto: Number(id.value),
      titulo: newTask.value.titulo.trim(),
      descricao: newTask.value.descricao,
      prioridade: newTask.value.prioridade,
      ...(newTask.value.data_limite ? { data_limite: newTask.value.data_limite } : {}),
    })
    newTask.value = { titulo: '', descricao: '', prioridade: 'neutra', data_limite: '' }
    await load()
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function moveTask(task, status) {
  if (task.status === status) return
  error.value = ''
  try { await tasksApi.update(task.id, { status }); await load() }
  catch (e) { error.value = explain(e) }
}
async function toggleStep(step) {
  error.value = ''
  try { await tasksApi.updateMicrotask(step.id, { concluida: !step.concluida }); await load() }
  catch (e) { error.value = explain(e) }
}
async function addResource() {
  saving.value = true
  error.value = ''
  try {
    await projectsApi.addResource(id.value, newResource.value)
    newResource.value = { titulo: '', url: '', tipo: 'link' }
    await load()
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
watch(id, load)
onMounted(load)
</script>

<template>
  <section class="workspace">
    <RouterLink to="/projects">← Voltar aos projetos</RouterLink>
    <p v-if="loading" role="status">Carregando...</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <template v-if="project">
      <header class="heading">
        <div><span class="eyebrow">{{ project.status }}</span><h1>{{ project.nome }}</h1><p>{{ project.descricao }}</p><p>Prazo: {{ project.data_limite || 'Não definido' }}</p></div>
        <div class="progress"><strong>{{ board?.progresso ?? 0 }}%</strong><small>Progresso</small></div>
      </header>
      <section class="panel">
        <h2>Equipe</h2>
        <div class="members"><span v-for="member in project.participantes" :key="member.id">{{ member.usuario_detalhes?.name || member.usuario_detalhes?.username || 'Participante' }} ({{ member.cargo }})</span></div>
      </section>
      <section class="panel">
        <h2>Nova tarefa</h2>
        <form class="form" @submit.prevent="addTask">
          <input v-model="newTask.titulo" required placeholder="Título da tarefa" aria-label="Título da tarefa" />
          <textarea v-model="newTask.descricao" placeholder="Descrição" aria-label="Descrição" />
          <label>Prioridade <select v-model="newTask.prioridade"><option value="muito_baixa">Muito baixa</option><option value="baixa">Baixa</option><option value="neutra">Neutra</option><option value="alta">Alta</option><option value="muito_alta">Muito alta</option></select></label>
          <label>Prazo <input v-model="newTask.data_limite" type="date" /></label>
          <button :disabled="saving">Adicionar tarefa</button>
        </form>
      </section>
      <h2>Kanban</h2>
      <div class="board">
        <section v-for="col in columns" :key="col.key" class="lane">
          <h3>{{ col.label }} ({{ board?.kanban?.[col.key]?.length ?? 0 }})</h3>
          <article v-for="task in board?.kanban?.[col.key] ?? []" :key="task.id" class="task">
            <strong>{{ task.titulo }}</strong>
            <p>{{ task.descricao }}</p>
            <small>Prioridade: {{ task.prioridade }} · Urgência: {{ task.urgencia }}</small>
            <small v-if="task.data_limite">Prazo: {{ task.data_limite }}</small>
            <small v-if="task.dependencias?.length">Depende das tarefas: {{ task.dependencias.join(', ') }}</small>
            <div v-for="step in task.microtarefas" :key="step.id" class="step"><label><input type="checkbox" :checked="step.concluida" @change="toggleStep(step)" /> {{ step.ordem }}. {{ step.titulo }}</label></div>
            <label>Mover para <select :value="task.status" @change="moveTask(task, $event.target.value); $event.target.value = task.status"><option v-for="option in columns" :key="option.key" :value="option.key">{{ option.label }}</option></select></label>
          </article>
          <p v-if="!board?.kanban?.[col.key]?.length" class="muted">Nenhuma tarefa</p>
        </section>
      </div>
      <section class="panel">
        <h2>Materiais de apoio</h2>
        <form class="form" @submit.prevent="addResource">
          <input v-model="newResource.titulo" required placeholder="Título do material" aria-label="Título do material" />
          <input v-model="newResource.url" required type="url" placeholder="https://..." aria-label="URL do material" />
          <button :disabled="saving">Adicionar link</button>
        </form>
        <ul><li v-for="resource in resources" :key="resource.id"><a :href="resource.url" rel="noopener noreferrer" target="_blank">{{ resource.titulo }}</a></li></ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
.workspace{max-width:1400px;margin:auto;padding:35px;color:#222}.workspace>a{color:#555}.heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:22px 0}.heading h1{font-size:36px;margin:8px 0}.heading p,.muted{color:#707070}.eyebrow{font-size:12px;color:#888;text-transform:uppercase}.progress{display:flex;flex-direction:column;align-items:center}.progress strong{font-size:30px}.panel{padding:22px;background:#fff;border:1px solid #e6e6e6;border-radius:15px;margin-bottom:24px}.members{display:flex;flex-wrap:wrap;gap:12px}.members span{padding:8px 12px;background:#f0f0ed;border-radius:20px;font-size:13px}.board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:20px 0 28px}.lane{background:#eeeeeb;border-radius:14px;padding:14px;min-height:180px}.lane h3{margin:5px 0 18px}.task{display:flex;flex-direction:column;gap:9px;background:#fff;border-radius:10px;padding:16px;margin-bottom:12px;overflow-wrap:anywhere}.task p{color:#666;margin:0}.task small{color:#555}.step{font-size:13px}.form{display:grid;gap:12px;max-width:650px}input:not([type=checkbox]),textarea,select{width:100%;padding:10px;border:1px solid #cecece;border-radius:8px}button{padding:11px 17px;border:0;border-radius:8px;background:#202020;color:#fff;cursor:pointer}button:disabled{opacity:.6}.error{color:#ac1e1e}@media(max-width:900px){.board{grid-template-columns:1fr}.workspace{padding:20px}}
</style>
