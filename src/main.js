import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@mdi/font/css/materialdesignicons.css'
import './assets/css/global.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const authStore = useAuthStore()

window.addEventListener('auth:session-expired', () => {
  authStore.logout()
})

router.isReady().then(() => app.mount('#app'))
