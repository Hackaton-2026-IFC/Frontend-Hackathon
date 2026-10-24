<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { TASK_PRIORITIES, TASK_STATUSES, taskError } from '@/api/taskApi'
import { useTaskStore } from '@/stores/taskStore'

const props = defineProps({
  task: { type: Object, default: null },
  projects: { type: Array, required: true },
  projectId: { type: [Number, String], default: null },
})

const emit = defineEmits(['cancel', 'saved'])
const store = useTaskStore()
const error = ref('')
const weatherLoading = ref(false)
const weatherError = ref('')
const forecast = ref(null)

const form = reactive({
  projeto: props.task?.projeto ?? props.projectId ?? props.projects[0]?.id ?? '',
  titulo: props.task?.titulo ?? '',
  descricao: props.task?.descricao ?? '',
  prioridade: props.task?.prioridade ?? 'neutra',
  status: props.task?.status ?? 'planejado',
  responsavel: props.task?.responsavel == null ? '' : String(props.task.responsavel),
  data_limite: props.task?.data_limite ?? '',
  clima_influencia: props.task?.clima_influencia ?? false,
  localizacao: props.task?.localizacao ?? '',
})

const members = computed(() =>
  props.projects.find((project) => String(project.id) === String(form.projeto))?.participantes || [],
)

const forecastLabel = computed(() => {
  if (!forecast.value?.disponivel) return forecast.value?.motivo || ''
  const rain = forecast.value.probabilidade_chuva_pct
  return rain == null
    ? 'Probabilidade de chuva indisponível.'
    : `Probabilidade de chuva: ${rain}%`
})

watch(() => [form.clima_influencia, form.localizacao, form.data_limite], () => {
  forecast.value = null
  weatherError.value = ''
})

async function checkWeather() {
  if (!props.task?.id || !form.clima_influencia) return
  weatherError.value = ''
  forecast.value = null
  weatherLoading.value = true
  try {
    const { default: api } = await import('@/api/config')
    const response = await api.get(`tarefas/${encodeURIComponent(props.task.id)}/clima/`)
    forecast.value = response.data
  } catch (err) {
    weatherError.value = taskError(err)
  } finally {
    weatherLoading.value = false
  }
}

function changeProject() {
  form.responsavel = ''
}

async function save() {
  if (store.busy || !form.titulo.trim() || !form.projeto) return
  if (form.clima_influencia && (!form.localizacao.trim() || !form.data_limite)) {
    error.value = 'Para tarefas influenciadas pelo clima, informe a cidade e o prazo.'
    return
  }

  error.value = ''

  try {
    const payload = {
      ...form,
      projeto: Number(form.projeto),
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      responsavel: form.responsavel === '' ? null : Number(form.responsavel),
      data_limite: form.data_limite || null,
      clima_influencia: Boolean(form.clima_influencia),
      localizacao: form.clima_influencia ? form.localizacao.trim() : '',
    }

    const savedTask = props.task
      ? await store.update(props.task.id, payload)
      : await store.create(payload)

    emit('saved', savedTask)
  } catch (err) {
    error.value = taskError(err)
  }
}
</script>

<template>
  <section class="task-editor" aria-labelledby="task-form-title">
    <header class="task-editor-header">
      <p class="task-eyebrow">MOMENTUM / ORGANIZAÇÃO</p>
      <h1 id="task-form-title">{{ task ? 'Editar tarefa' : 'Nova tarefa' }}</h1>
      <p>Preencha os campos e salve as informações da tarefa.</p>
    </header>

    <form class="task-form" @submit.prevent="save">
      <fieldset :disabled="store.busy">
        <label>
          Projeto
          <select
            v-model="form.projeto"
            required
            :disabled="Boolean(task) || Boolean(projectId)"
            @change="changeProject"
          >
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.nome }}
            </option>
          </select>
        </label>

        <label>
          Título
          <input
            v-model="form.titulo"
            type="text"
            maxlength="150"
            required
            placeholder="O que precisa ser feito?"
          />
        </label>

        <section class="task-form-edit-options" aria-labelledby="task-options-title">
          <h2 id="task-options-title">Responsável, prioridade e prazo</h2>

          <div class="task-form-edit-grid">
            <label class="task-form-assignee">
              Responsável
              <select v-model="form.responsavel">
                <option value="">Sem responsável</option>
                <option
                  v-for="member in members"
                  :key="member.usuario"
                  :value="String(member.usuario)"
                >
                  {{
                    member.usuario_detalhes?.name ||
                    member.usuario_detalhes?.username ||
                    'Participante'
                  }}
                </option>
              </select>
            </label>

            <label>
              Prioridade
              <select v-model="form.prioridade">
                <option v-for="(label, value) in TASK_PRIORITIES" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </label>

            <label>
              Prazo
              <input v-model="form.data_limite" type="date" />
            </label>
          </div>
        </section>

        <section class="task-weather" aria-labelledby="task-weather-title">
          <div class="task-weather-top">
            <span class="mdi mdi-weather-partly-cloudy" aria-hidden="true"></span>
            <div>
              <h2 id="task-weather-title">Clima e planejamento</h2>
              <p>Marque se chuva ou outras condições meteorológicas podem atrapalhar a tarefa.</p>
            </div>
          </div>
          <label class="task-weather-toggle">
            <input v-model="form.clima_influencia" type="checkbox" />
            O clima influencia esta tarefa
          </label>
          <div v-if="form.clima_influencia" class="task-weather-fields">
            <label>
              Cidade da tarefa
              <input v-model.trim="form.localizacao" maxlength="255" required type="text" placeholder="Ex.: Joinville, SC" />
            </label>
            <p class="task-weather-note">A previsão utiliza o prazo cadastrado e fica disponível para até 15 dias. O relatório da IA considera esse dado quando a previsão estiver disponível.</p>
            <p v-if="!form.data_limite" class="task-weather-note">Defina também o prazo da tarefa para consultar a previsão.</p>
            <button v-if="task?.id && form.data_limite" type="button" class="task-button" :disabled="weatherLoading" @click="checkWeather">
              {{ weatherLoading ? 'Consultando clima...' : 'Consultar previsão salva' }}
            </button>
            <p v-if="weatherError" class="task-error" role="alert">{{ weatherError }}</p>
            <div v-if="forecast" class="task-weather-forecast" role="status">
              <strong>{{ forecastLabel }}</strong>
              <template v-if="forecast.disponivel">
                <p>{{ forecast.localizacao?.nome }} · {{ forecast.data }}</p>
                <p>Máxima: {{ forecast.temperatura_maxima_c ?? '—' }} °C · Mínima: {{ forecast.temperatura_minima_c ?? '—' }} °C</p>
                <small>Fonte: Open-Meteo · Previsão sujeita a mudanças</small>
              </template>
            </div>
          </div>
        </section>

        <label>
          Descrição
          <textarea
            v-model="form.descricao"
            rows="5"
            placeholder="Detalhe a atividade..."
          ></textarea>
        </label>

        <label>
          Situação
          <select v-model="form.status">
            <option v-for="(label, value) in TASK_STATUSES" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </label>
      </fieldset>

      <p v-if="error" class="task-error" role="alert">{{ error }}</p>

      <footer class="task-actions">
        <button type="button" class="task-button" :disabled="store.busy" @click="emit('cancel')">
          {{ task ? 'Voltar para nova tarefa' : 'Limpar' }}
        </button>
        <button
          type="submit"
          class="task-button task-primary"
          :disabled="store.busy || !form.titulo.trim() || !form.projeto"
        >
          {{ store.busy ? 'Salvando...' : task ? 'Salvar alterações' : 'Criar tarefa' }}
        </button>
      </footer>
    </form>
  </section>
</template>

<style scoped>
.task-weather{padding:18px;border:1px solid #d1d1ca;border-radius:13px;background:#f8f8f5;display:grid;gap:15px}
.task-weather-top{display:flex;align-items:flex-start;gap:12px}.task-weather-top .mdi{font-size:26px}.task-weather h2{margin:0 0 5px;font-size:16px;letter-spacing:-.3px}.task-weather p{margin:0;color:#595952;font-size:12px;line-height:1.55}
.task-weather-toggle{display:flex!important;align-items:center;gap:10px;font-size:13px;font-weight:700;cursor:pointer}
.task-weather-toggle input{width:17px;height:17px;accent-color:#171716;flex:none}
.task-weather-fields{display:grid;gap:12px}.task-weather-fields label{display:grid;gap:7px;font-weight:700;font-size:12px}
.task-weather-fields input[type="text"]{width:100%;box-sizing:border-box;border:1px solid #c9c9c3;border-radius:10px;padding:11px;background:#fff;color:#171716}
.task-weather-note{font-size:11px!important;color:#686861!important}
.task-weather-forecast{padding:12px 14px;border:1px solid #d1d1ca;border-radius:10px;background:#fff;font-size:12px}
.task-weather-forecast strong{display:block;margin-bottom:5px}.task-weather-forecast p{margin:4px 0}.task-weather-forecast small{color:#686861}
</style>
