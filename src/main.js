import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@mdi/font/css/materialdesignicons.css'
import './assets/css/global.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Um Service Worker instalado anteriormente no localhost pode continuar
// servindo páginas antigas mesmo após desativar o PWA no Vite.
// Removemos apenas os SWs deste endereço durante o desenvolvimento;
// na versão de produção, o PWA permanece intacto.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(
      registrations
        .filter((registration) => new URL(registration.scope).origin === window.location.origin)
        .map((registration) => registration.unregister()),
    ))
    .catch((error) => {
      console.warn('Não foi possível limpar o Service Worker de desenvolvimento:', error)
    })
}

