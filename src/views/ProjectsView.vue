<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import projectsApi from '@/api/projectsApi'

const projects = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const showForm = ref(false)
const search = ref('')
const form = ref({ nome: '', descricao: '', data_limite: '' })

function explain(errorResponse) {
  const data = errorResponse?.response?.data
  if (typeof data?.detail === 'string') return data.detail
  if (typeof data === 'object' && data) return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' • ')
  return errorResponse?.message || 'Não foi possível concluir a operação.'
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await projectsApi.list({ search: search.value })
    projects.value = Array.isArray(data) ? data : (data.results ?? [])
  } catch (e) { error.value = explain(e) }
  finally { loading.value = false }
}
async function createProject() {
  saving.value = true
  error.value = ''
  try {
    await projectsApi.create({
      nome: form.value.nome.trim(),
      descricao: form.value.descricao,
      ...(form.value.data_limite ? { data_limite: form.value.data_limite } : {}),
    })
    form.value = { nome: '', descricao: '', data_limite: '' }
    showForm.value = false
    await load()
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function togglePin(project) {
  error.value = ''
  try {
    if (project.fixado) await projectsApi.unpin(project.id)
    else await projectsApi.pin(project.id)
    await load()
  } catch (e) { error.value = explain(e) }
}
onMounted(load)
</script>

<template>
  <section class="workspace">
    <header class="heading">
      <div><span class="eyebrow">WORKSPACE</span><h1>Seus projetos</h1><p>Organize os projetos e acompanhe o progresso da equipe.</p></div>
      <button type="button" @click="showForm = !showForm">{{ showForm ? 'Cancelar' : '+ Novo projeto' }}</button>
    </header>
    <form v-if="showForm" class="panel form" @submit.prevent="createProject">
      <label>Nome <input v-model="form.nome" required maxlength="200" /></label>
      <label>Descrição <textarea v-model="form.descricao" rows="3" /></label>
      <label>Prazo oficial <input v-model="form.data_limite" type="date" /></label>
      <button :disabled="saving" type="submit">{{ saving ? 'Salvando...' : 'Criar projeto' }}</button>
    </form>
    <form class="search" @submit.prevent="load"><input v-model="search" placeholder="Buscar projetos..." aria-label="Buscar projetos" /><button type="submit">Buscar</button></form>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="loading" role="status">Carregando projetos...</p>
    <p v-else-if="!projects.length" class="panel">Nenhum projeto encontrado. Crie o primeiro!</p>
    <div v-else class="cards">
      <article v-for="project in projects" :key="project.id" class="panel project">
        <div class="row"><span class="eyebrow">{{ project.status || 'PROJETO' }}</span><button class="ghost" type="button" @click="togglePin(project)">{{ project.fixado ? '★ Desafixar' : '☆ Fixar' }}</button></div>
        <h2>{{ project.nome }}</h2>
        <p>{{ project.descricao || 'Sem descrição' }}</p>
        <small>Prazo: {{ project.data_limite || 'não definido' }} · {{ project.participantes?.length ?? 0 }} participante(s)</small>
        <RouterLink :to="`/projects/${project.id}`">Abrir projeto →</RouterLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.workspace{padding:36px;max-width:1300px;margin:auto;color:#252525}.heading,.row{display:flex;justify-content:space-between;align-items:center;gap:20px}.heading{margin-bottom:26px}.heading h1{font-size:34px;margin:6px 0}.heading p,.project p{color:#676767}.eyebrow{font-size:11px;letter-spacing:1.5px;font-weight:700;color:#74746f}.panel{background:white;border:1px solid #e6e6e2;border-radius:16px;padding:24px;box-shadow:0 5px 20px #00000005}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px}.project{display:flex;flex-direction:column;gap:10px}.project h2{margin:0}.project p{flex:1}.project a{font-weight:700;color:#202020}.project small{color:#666}button{border:0;border-radius:9px;padding:12px 18px;cursor:pointer;background:#1b1b1b;color:white}.ghost{background:transparent;color:#444;padding:8px}.form{display:grid;gap:12px;margin-bottom:22px}.form label{display:grid;gap:6px}.form input,.form textarea,.search input{width:100%;border:1px solid #d6d6d1;border-radius:8px;padding:11px}.search{display:flex;gap:10px;margin-bottom:25px}.error{color:#b42318}@media(max-width:700px){.workspace{padding:20px}.heading{align-items:flex-start;flex-direction:column}}
</style>
