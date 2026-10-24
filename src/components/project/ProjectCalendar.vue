<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import { useAuthStore } from '@/stores/authStore'
import projectCalendarApi from '@/api/projectCalendarApi'
import { authorizeCalendar } from '@/services/googleCalendarOAuth'

const props = defineProps({ projectId: { type: [Number, String], required: true } })
const auth = useAuthStore()
const events = ref([])
const tasks = ref([])
const loading = ref(false)
const saving = ref(false)
const exporting = ref(null)
const error = ref('')
const notice = ref('')
const editingId = ref(null)
const showForm = ref(false)
const today = () => {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-')
}
const startDate = ref(today())
const endDate = ref((() => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')
})())
const freshForm = () => ({ titulo:'', descricao:'', data:today(), hora_inicio:'', hora_fim:'', localizacao:'' })
const form = ref(freshForm())
const isGoogleSession = computed(() => {
  try { return jwtDecode(auth.accessToken || '').auth_provider === 'google' } catch { return false }
})
const sortedEvents = computed(() => [...events.value].sort((a,b) => String(a.data).localeCompare(String(b.data)) || String(a.hora_inicio||'').localeCompare(String(b.hora_inicio||''))))
const visibleTasks = computed(() => tasks.value.map(task => ({
  ...task, prazo: task.prazo_antecipado || task.data_limite,
})).filter(task => task.prazo))

function message(err) {
  const data = err?.response?.data
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') return Object.entries(data).map(([key,value]) => `${key}: ${Array.isArray(value)?value.join(', '):String(value)}`).join(' · ')
  return err?.message || 'Não foi possível realizar esta operação.'
}
function safeCalendarLink(value) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && (
      url.hostname === 'calendar.google.com' ||
      (url.hostname === 'www.google.com' && url.pathname.startsWith('/calendar/'))
    )) return url.href
  } catch { /* Link ausente ou inválido */ }
  return null
}
function dateBr(date) {
  if (!date) return 'Sem data'
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(date)
}
async function load() {
  if (!props.projectId || !startDate.value || !endDate.value) return
  error.value = ''
  if (endDate.value < startDate.value) { error.value = 'A data final deve ser posterior à inicial.'; return }
  loading.value = true
  try {
    const {data} = await projectCalendarApi.list(props.projectId, { inicio:startDate.value, fim:endDate.value })
    events.value = Array.isArray(data.eventos) ? data.eventos : []
    tasks.value = Array.isArray(data.tarefas) ? data.tarefas : []
  } catch (err) { error.value = message(err) }
  finally { loading.value = false }
}
function openCreate() {
  form.value = freshForm()
  editingId.value = null
  showForm.value = true
  error.value = ''
}
function edit(event) {
  editingId.value = event.id
  form.value = {
    titulo:event.titulo || '', descricao:event.descricao || '',
    data:event.data || today(), hora_inicio:event.hora_inicio?.slice(0,5) || '',
    hora_fim:event.hora_fim?.slice(0,5) || '', localizacao:event.localizacao || '',
  }
  showForm.value = true
  error.value = ''
}
function closeForm() { if (!saving.value) showForm.value = false }
async function save() {
  if (saving.value) return
  error.value = ''
  if (Boolean(form.value.hora_inicio) !== Boolean(form.value.hora_fim)) { error.value = 'Informe início e fim ou deixe os dois vazios.'; return }
  if (form.value.hora_inicio && form.value.hora_fim <= form.value.hora_inicio) { error.value = 'O horário final deve ser posterior ao inicial.'; return }
  saving.value = true
  try {
    const payload = { ...form.value, titulo:form.value.titulo.trim(), hora_inicio:form.value.hora_inicio || null, hora_fim:form.value.hora_fim || null }
    if (editingId.value) await projectCalendarApi.update(props.projectId, editingId.value, payload)
    else await projectCalendarApi.create(props.projectId, payload)
    showForm.value = false
    notice.value = editingId.value ? 'Evento atualizado.' : 'Evento criado.'
    await load()
  } catch (err) { error.value = message(err) }
  finally { saving.value = false }
}
async function remove(event) {
  if (!window.confirm(`Excluir o evento "${event.titulo}"?`)) return
  error.value = ''
  try {
    await projectCalendarApi.remove(props.projectId, event.id)
    notice.value = 'Evento excluído.'
    await load()
  } catch (err) { error.value = message(err) }
}
async function exportEvent(event) {
  if (exporting.value) return
  error.value = ''
  notice.value = ''
  if (!isGoogleSession.value) {
    error.value = 'Para exportar, saia e entre novamente usando o botão Google. Contas antigas devem vincular o Google no perfil primeiro.'
    return
  }
  exporting.value = event.id
  try {
    // Consentimento OAuth durante o clique; não guardar access token em storage.
    const token = await authorizeCalendar()
    const { data } = await projectCalendarApi.exportGoogle(props.projectId, event.id, token)
    const currentEvent = events.value.find(item => item.id === event.id)
    if (currentEvent) {
      currentEvent.exportado_google = true
      currentEvent.google_event_url = data.htmlLink || null
    }
    notice.value = 'Evento exportado para seu Google Agenda!'
  } catch (err) { error.value = message(err) }
  finally { exporting.value = null }
}
watch(() => props.projectId, () => { showForm.value = false; load() })
onMounted(load)
</script>

<template>
  <section class="calendar-box" aria-labelledby="calendar-title">
    <header class="calendar-head">
      <div><span class="calendar-eyebrow">PLANEJAMENTO</span><h2 id="calendar-title">Calendário do projeto</h2><p>Organize eventos e exporte para o seu Google Agenda.</p></div>
      <button type="button" class="calendar-primary" @click="openCreate"><span aria-hidden="true">+</span> Novo evento</button>
    </header>
    <div class="calendar-filters">
      <label>De <input v-model="startDate" type="date" /></label>
      <label>Até <input v-model="endDate" type="date" /></label>
      <button type="button" class="calendar-secondary" :disabled="loading" @click="load">{{ loading ? 'Carregando...' : 'Filtrar datas' }}</button>
    </div>
    <p v-if="!isGoogleSession" class="calendar-guidance">Para usar a exportação, faça login com o Google nesta sessão. <RouterLink to="/profile">Vincular conta existente</RouterLink></p>
    <p v-if="error" class="calendar-error" role="alert">{{ error }}</p>
    <p v-if="notice" class="calendar-success" role="status">{{ notice }}</p>
    <p v-if="loading" role="status">Carregando calendário...</p>
    <div v-else class="calendar-columns">
      <div class="calendar-section">
        <h3>Eventos <span>{{ sortedEvents.length }}</span></h3>
        <div v-for="event in sortedEvents" :key="event.id" class="calendar-item">
          <div class="calendar-date">{{ dateBr(event.data) }} <small>{{ event.hora_inicio ? event.hora_inicio.slice(0,5)+' – '+event.hora_fim?.slice(0,5) : 'Dia inteiro' }}</small></div>
          <div class="calendar-item-content">
            <strong>{{ event.titulo }}</strong>
            <p v-if="event.descricao">{{ event.descricao }}</p>
            <small v-if="event.localizacao"><span aria-hidden="true">⌖</span> {{ event.localizacao }}</small>
            <div class="calendar-actions">
              <button v-if="!event.exportado_google" type="button" :disabled="!!exporting" @click="exportEvent(event)">{{ exporting===event.id ? 'Exportando...' : 'Exportar para Google Agenda' }}</button>
              <span v-else class="calendar-exported" title="Exportação confirmada pelo servidor">✓ Exportado</span>
              <button type="button" @click="edit(event)">Editar</button>
              <button type="button" @click="remove(event)">Excluir</button>
              <a v-if="safeCalendarLink(event.google_event_url)" :href="safeCalendarLink(event.google_event_url)" target="_blank" rel="noopener noreferrer">Abrir no Google ↗</a>
            </div>
          </div>
        </div>
        <p v-if="!sortedEvents.length" class="calendar-empty">Nenhum evento neste período.</p>
      </div>
      <div class="calendar-section">
        <h3>Prazos das tarefas <span>{{ visibleTasks.length }}</span></h3>
        <div v-for="task in visibleTasks" :key="task.id" class="calendar-item">
          <div class="calendar-date">{{ dateBr(task.prazo) }}</div>
          <div class="calendar-item-content"><strong>{{ task.titulo }}</strong><small>{{ task.status === 'concluido' ? 'Concluída' : task.status === 'em_andamento' ? 'Em andamento' : 'Planejada' }}</small></div>
        </div>
        <p v-if="!visibleTasks.length" class="calendar-empty">Nenhum prazo neste período.</p>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="showForm" class="calendar-overlay" @click.self="closeForm">
        <section class="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
          <header class="calendar-modal__header">
            <div class="calendar-modal__heading">
              <span class="calendar-modal__eyebrow">CALENDÁRIO DO PROJETO</span>
              <h2 id="event-form-title">{{ editingId ? 'Editar evento' : 'Novo evento' }}</h2>
              <p>Organize os detalhes e mantenha a equipe alinhada.</p>
            </div>
            <button type="button" class="calendar-modal__close" aria-label="Fechar formulário" @click="closeForm">✕</button>
          </header>
          <form @submit.prevent="save">
            <label>Título <input v-model="form.titulo" required maxlength="200" placeholder="Ex.: Reunião de planejamento" /></label>
            <label>Descrição <textarea v-model="form.descricao" rows="3" placeholder="Adicione informações importantes sobre o evento"></textarea></label>
            <label>Data <input v-model="form.data" required type="date" /></label>
            <div class="calendar-time-row"><label>Início <input v-model="form.hora_inicio" type="time" /></label><label>Fim <input v-model="form.hora_fim" type="time" /></label></div>
            <label>Localização <input v-model="form.localizacao" placeholder="Ex.: Laboratório IFC" /></label>
            <p v-if="error" class="calendar-error" role="alert">{{ error }}</p>
            <footer class="calendar-modal__footer"><button type="button" class="calendar-secondary" :disabled="saving" @click="closeForm">Cancelar</button><button type="submit" class="calendar-primary" :disabled="saving">{{ saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar evento' }}</button></footer>
          </form>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.calendar-box{padding:28px;border:1px solid #e5e5e5;border-radius:18px;background:#fff;color:#171716}
.calendar-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.calendar-eyebrow{font-size:10px;font-weight:800;letter-spacing:1.2px;color:#666}.calendar-head h2{margin:6px 0;font-size:22px}.calendar-head p{margin:0;color:#666;font-size:13px}
.calendar-primary,.calendar-secondary{border-radius:10px;min-height:40px;padding:10px 15px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}.calendar-primary{border:1px solid #171716;background:#171716;color:white}.calendar-secondary{background:#fff;border:1px solid #ddd;color:#111}.calendar-filters{display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin:22px 0}.calendar-filters label{display:grid;gap:5px;font-size:12px;font-weight:650}.calendar-filters input,.calendar-modal input,.calendar-modal textarea{padding:9px;border:1px solid #ccc;border-radius:8px;font:inherit;color:#111;background:#fff}
.calendar-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.calendar-section{min-width:0}.calendar-section h3{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding-bottom:12px;font-size:15px}.calendar-section h3 span{color:#888}.calendar-item{display:flex;gap:14px;border:1px solid #eaeaea;padding:14px;margin:12px 0;border-radius:12px}.calendar-date{min-width:92px;font-weight:700;font-size:12px}.calendar-date small{display:block;font-weight:500;color:#777;margin-top:5px}.calendar-item-content{min-width:0;overflow-wrap:anywhere}.calendar-item-content strong{font-size:13px}.calendar-item-content p{font-size:12px;margin:7px 0;color:#555}.calendar-item-content small{display:block;color:#777;font-size:11px;margin-top:8px}.calendar-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:13px}.calendar-actions button,.calendar-actions a{border:0;background:transparent;padding:0;font-size:11px;font-weight:700;text-decoration:underline;cursor:pointer;color:#333}.calendar-guidance,.calendar-error,.calendar-success{font-size:12px;line-height:1.6;padding:12px;border-radius:9px}.calendar-guidance{background:#f7f7f5}.calendar-error{color:#9b2020;background:#fff1f1}.calendar-success{color:#176839;background:#e8f9ef}.calendar-empty{color:#888;font-size:12px}
.calendar-overlay{position:fixed;inset:0;z-index:10010;display:grid;place-items:center;background:#0009;padding:16px}.calendar-modal{width:min(100%,520px);max-height:92dvh;overflow:auto;background:#fff;border-radius:18px;padding:24px}.calendar-modal header{display:flex;justify-content:space-between;align-items:center}.calendar-modal header button{border:none;background:#eee;border-radius:50%;width:32px;height:32px;cursor:pointer}.calendar-modal form{display:grid;gap:15px}.calendar-modal label{display:grid;gap:6px;font-size:12px;font-weight:700}.calendar-time-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.calendar-modal footer{display:flex;justify-content:flex-end;gap:10px}
@media(max-width:760px){.calendar-box{padding:16px}.calendar-columns{grid-template-columns:1fr}.calendar-head{align-items:flex-start;flex-direction:column}.calendar-item{flex-direction:column;gap:6px}}
.calendar-exported{font-size:11px;font-weight:700;color:#176839;display:inline-flex;align-items:center}

/* Modal de eventos alinhado à identidade visual do Momentum */
.calendar-overlay{padding:20px;background:rgb(12 12 12 / 65%);backdrop-filter:blur(3px)}
.calendar-modal{width:min(100%,540px);max-height:min(90dvh,800px);padding:0;overflow-y:auto;overscroll-behavior:contain;border:1px solid #e5e5e5;border-radius:18px;background:#fff;box-shadow:0 24px 70px rgb(0 0 0 / 24%);color:#171717}
.calendar-modal__header{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:28px 30px 22px;border-bottom:1px solid #ededed}
.calendar-modal__heading{min-width:0}
.calendar-modal__eyebrow{display:block;margin-bottom:9px;color:#737373;font-size:10px;font-weight:750;letter-spacing:.13em}
.calendar-modal__header h2{margin:0;color:#171717;font-size:clamp(22px,3vw,28px);font-weight:700;letter-spacing:-.045em;line-height:1.2}
.calendar-modal__header p{margin:9px 0 0;color:#737373;font-size:12px;line-height:1.55}
.calendar-modal__header .calendar-modal__close{display:grid;place-items:center;flex:0 0 38px;width:38px;height:38px;border:1px solid #e5e5e5;border-radius:10px;background:#fafafa;color:#333;font-size:16px;cursor:pointer}
.calendar-modal__header .calendar-modal__close:hover{background:#ededed}
.calendar-modal form{display:grid;gap:19px;padding:24px 30px 30px}
.calendar-modal form label{display:grid;gap:8px;min-width:0;color:#303030;font-size:12px;font-weight:650}
.calendar-modal input,.calendar-modal textarea{display:block;width:100%;min-width:0;min-height:44px;box-sizing:border-box;padding:11px 13px;border:1px solid #dedede;border-radius:10px;background:#fff;color:#171717;font:inherit;font-size:14px;font-weight:400;transition:border-color .15s,box-shadow .15s}
.calendar-modal textarea{min-height:86px;resize:vertical;line-height:1.5}
.calendar-modal input::placeholder,.calendar-modal textarea::placeholder{color:#999}
.calendar-modal input:hover,.calendar-modal textarea:hover{border-color:#aaa}
.calendar-modal input:focus,.calendar-modal textarea:focus{outline:none;border-color:#171717;box-shadow:0 0 0 3px rgb(23 23 23 / 9%)}
.calendar-modal .calendar-time-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
.calendar-modal__footer{display:flex;justify-content:flex-end;gap:10px;margin-top:4px;padding-top:20px;border-top:1px solid #ededed}
.calendar-modal__footer button{min-height:44px;padding:11px 18px;border-radius:10px;font-size:12px}
.calendar-modal__footer .calendar-secondary:hover{background:#f5f5f5}
.calendar-modal__footer .calendar-primary:hover:not(:disabled){background:#333}
.calendar-modal button:focus-visible{outline:3px solid #777;outline-offset:3px}
.calendar-modal button:disabled{opacity:.55;cursor:not-allowed}
@media(max-width:600px){
 .calendar-overlay{align-items:end;padding:0}
 .calendar-modal{width:100%;max-height:94dvh;border-radius:18px 18px 0 0;border-bottom:0}
 .calendar-modal__header{padding:22px 20px 18px}
 .calendar-modal form{gap:16px;padding:20px 20px max(24px,env(safe-area-inset-bottom))}
 .calendar-modal .calendar-time-row{gap:10px}
 .calendar-modal__footer{display:grid;grid-template-columns:1fr 1fr}
 .calendar-modal__footer button{width:100%;padding:10px}
}
@media(max-width:350px){.calendar-modal .calendar-time-row{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.calendar-modal input,.calendar-modal textarea{transition:none}}
</style>
