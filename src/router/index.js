import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import AuthLayout from '@/components/layout/AuthLayout.vue'
import LoginView from '@/views/LoginView.vue'
import CadastroView from '@/views/CadastroView.vue'
import homeView from '@/views/homeView.vue'
import profileView from '@/views/profileView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const routes = [
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/tasks',
    name: 'project-tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    component: AuthLayout,
    meta: {
      guestOnly: true,
      hideHeader: true,
      hideFooter: true,
    },
    children: [
      {
        path: '',
        name: 'welcome',
        component: LoginView,
      },
      {
        path: 'registro',
        alias: ['cadastro', 'register'],
        name: 'register',
        component: CadastroView,
      },
    ],
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
    name: 'not-found',
    component: NotFoundView,
    meta: {
      hideHeader: true,
      hideFooter: true,
    },
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
