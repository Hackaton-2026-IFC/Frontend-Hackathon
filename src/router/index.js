import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import welcomeView from '@/views/welcomeView.vue'
import registerView from '@/views/registerView.vue'
import homeView from '@/views/homeView.vue'
import profileView from '@/views/profileView.vue'

const routes = [
  {
    path: '/',
    name: 'welcome',
    component: welcomeView,
    meta: {
      guestOnly: true,
      hideHeader: true,
      hideFooter: true,
    },
  },
  {
    path: '/registro',
    name: 'register',
    component: registerView,
    meta: {
      guestOnly: true,
      hideHeader: true,
      hideFooter: true,
    },
  },
  {
    path: '/home',
    name: 'home',
    component: homeView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/projects',
    name: 'projects',
    component: homeView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: homeView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: profileView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'home' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  // Se a rota exige autenticação e o usuário NÃO está autenticado
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'welcome',
      query: { redirect: to.fullPath },
    }
  }

  // Se a rota é exclusiva para convidados (welcome/register) e o usuário JÁ está autenticado
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router