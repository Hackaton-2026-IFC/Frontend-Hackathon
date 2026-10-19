
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'

import InicioView from '@/views/InicioView.vue'
import LoginView from '@/views/LoginView.vue'
import CadastroView from '@/views/CadastroView.vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AuthLayout,
      meta: {
        hideHeader: true,
        hideFooter: true,
      },
      children: [
        { path: '', redirect: { name: 'login' } },
        { path: 'login', name: 'login', component: LoginView },
        { path: 'cadastro', name: 'cadastro', component: CadastroView },
      ],
    },
    {
      path: '/inicio',
      name: 'inicio',
      component: InicioView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (
    (to.name === 'login' || to.name === 'cadastro') &&
    auth.isAuthenticated
  ) {
    return { name: 'inicio' }
  }
})

export default router
