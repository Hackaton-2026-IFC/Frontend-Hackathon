import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// ==========================================
// IMPORTAÇÃO DOS COMPONENTES
// ==========================================

import AuthLayout from '@/components/layout/AuthLayout.vue'

import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import HomeView from '@/views/HomeView.vue'
import ProfileView from '@/views/ProfileView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import ProjectView from '@/views/ProjectView.vue'
import TaskView from '@/views/TaskView.vue'
import NotesView from '@/views/NotesView.vue'
import NotificationView from '@/views/NotificationView.vue'

const routes = [
  // ==========================================
  // TAREFAS
  // ==========================================

  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: '/projects/:projectId/tasks',
    name: 'project-tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================

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
        component: RegisterView,
      },
    ],
  },

  // ==========================================
  // HOME
  // ==========================================

  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // PROJETOS
  // ==========================================

  {
    path: '/projects',
    name: 'projects',
    component: ProjectsView,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: '/projects/:id',
    name: 'project-details',
    component: ProjectView,
    props: true,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // DETALHES DA TAREFA
  // ==========================================

  {
    path: '/tasks/:id',
    name: 'task-view',
    component: TaskView,
    props: true,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // NOTIFICAÇÕES
  // ==========================================

  {
    path: '/notifications',
    name: 'notifications',
    component: NotificationView,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // ANOTAÇÕES
  // ==========================================

  {
    path: '/notes',
    name: 'notes',
    component: NotesView,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

  {
    path: '/settings',
    name: 'settings',
    component: HomeView,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // PERFIL
  // ==========================================

  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // PÁGINA NÃO ENCONTRADA
  // ==========================================

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

// ==========================================
// CRIAR ROUTER
// ==========================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ==========================================
// PROTEÇÃO DAS ROTAS
// ==========================================

router.beforeEach((to) => {
  const authStore = useAuthStore()

  // Impede acesso a páginas protegidas sem login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'welcome',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  // Impede usuários autenticados de acessar login/cadastro
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return {
      name: 'home',
    }
  }
})

export default router