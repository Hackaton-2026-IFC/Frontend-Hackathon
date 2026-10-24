<script setup>
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import notificationsApi from '@/api/notificationsApi'

const router = useRouter()
const open = ref(false)
const loading = ref(false)
const error = ref('')
const items = ref([])
const unread = ref(0)
let timer = null

function message(err) {
  return err?.response?.data?.detail || err?.message || 'Não foi possível carregar as notificações.'
}

async function refresh({ silent = false } = {}) {
  if (loading.value && !silent) return
  if (!silent) loading.value = true
  error.value = ''

  try {
    const [listResponse, unreadResponse] = await Promise.all([
      notificationsApi.list({ page: 1, page_size: 20 }),
      notificationsApi.unread(),
    ])

    const data = listResponse.data
    items.value = Array.isArray(data) ? data : (data?.results || [])
    unread.value = Number(unreadResponse.data?.quantidade || 0)
  } catch (err) {
    if (!silent) error.value = message(err)
  } finally {
    if (!silent) loading.value = false
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value) await refresh()
}

async function markRead(item) {
  if (item.lida) return
  try {
    const { data } = await notificationsApi.read(item.id)
    items.value = items.value.map((entry) => entry.id === data.id ? data : entry)
    unread.value = Math.max(0, unread.value - 1)
  } catch (err) {
    error.value = message(err)
  }
}

async function openNotification(item) {
  await markRead(item)

  if (item.link) {
    open.value = false
    await router.push(item.link)
  }
}

async function markAll() {
  try {
    await notificationsApi.readAll()
    items.value = items.value.map((item) => ({ ...item, lida: true }))
    unread.value = 0
  } catch (err) {
    error.value = message(err)
  }
}

function dateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(() => {
  refresh({ silent: true })
  timer = window.setInterval(() => refresh({ silent: true }), 30000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <div class="notifications">
    <button
      type="button"
      class="bell"
      :aria-expanded="open"
      aria-label="Abrir notificações"
      @click="toggle"
    >
      <span class="mdi mdi-bell-outline" aria-hidden="true"></span>
      <span v-if="unread" class="badge">{{ unread > 99 ? '99+' : unread }}</span>
    </button>

    <div v-if="open" class="panel">
      <div class="panel-header">
        <div>
          <span>ATIVIDADE</span>
          <h2>Notificações</h2>
        </div>

        <button v-if="unread" type="button" class="read-all" @click="markAll">
          Marcar todas como lidas
        </button>
      </div>

      <ToastNotice v-if="error" :message="error" type="error" />
      <p v-if="loading" class="notification-state" role="status">Carregando...</p>

      <div v-else-if="items.length" class="notification-list">
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="notification-item"
          :class="{ unread: !item.lida }"
          @click="openNotification(item)"
        >
          <span class="notification-dot" aria-hidden="true"></span>

          <span class="notification-copy">
            <strong>{{ item.titulo }}</strong>
            <span>{{ item.mensagem }}</span>
            <small>{{ dateLabel(item.criada_em) }}</small>
          </span>
        </button>
      </div>

      <p v-else class="notification-state">Nenhuma notificação ainda.</p>
    </div>
  </div>
</template>

<style scoped>
.notifications{position:relative;margin-left:auto}.bell{position:relative;display:grid;place-items:center;width:42px;height:42px;border:1px solid #d8d8d3;border-radius:50%;background:#fff;color:#171716;font-size:21px;cursor:pointer}.bell:hover{background:#f5f5f2}.badge{position:absolute;top:-5px;right:-6px;display:grid;place-items:center;min-width:19px;height:19px;padding:0 4px;border:2px solid #fff;border-radius:999px;background:#d83b3b;color:#fff;font-size:9px;font-weight:800}.panel{position:absolute;top:52px;right:0;width:min(390px,calc(100vw - 28px));max-height:520px;overflow:auto;border:1px solid #d6d6d0;border-radius:16px;background:#fff;color:#171716;box-shadow:0 20px 48px rgb(0 0 0 / 18%)}.panel-header{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px;border-bottom:1px solid #e5e5e0;background:#fff}.panel-header>div>span{font-size:9px;font-weight:800;letter-spacing:1.2px}.panel-header h2{margin:4px 0 0;font-size:18px}.read-all{border:0;background:transparent;color:#171716;font:inherit;font-size:10px;font-weight:700;text-decoration:underline;cursor:pointer}.notification-list{display:flex;flex-direction:column}.notification-item{display:flex;width:100%;gap:10px;padding:14px 16px;border:0;border-bottom:1px solid #ededE8;background:#fff;color:#171716;text-align:left;font:inherit;cursor:pointer}.notification-item:hover{background:#f7f7f4}.notification-item.unread{background:#f2f5ff}.notification-dot{flex:0 0 7px;width:7px;height:7px;margin-top:6px;border-radius:50%;background:transparent}.notification-item.unread .notification-dot{background:#3457d5}.notification-copy{display:flex;min-width:0;flex-direction:column;gap:4px}.notification-copy strong{font-size:12px}.notification-copy>span{font-size:11px;line-height:1.45;color:#555}.notification-copy small{margin-top:2px;color:#85857e;font-size:9px}.notification-state,.notification-error{margin:0;padding:24px 16px;text-align:center;font-size:11px;color:#666}.notification-error{color:#842626;background:#fff1f1}.bell:focus-visible,.read-all:focus-visible,.notification-item:focus-visible{outline:2px solid #171716;outline-offset:2px}@media(max-width:700px){.bell{width:38px;height:38px;border-color:#454540;background:#252523;color:#fff}.badge{border-color:#171716}.panel{position:fixed;top:66px;right:10px;left:10px;width:auto;max-height:calc(100dvh - 150px)}}
</style>
