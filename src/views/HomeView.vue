<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import defaultCard from '@/components/ui/defaultCard.vue'
import '@/assets/css/home.css'

const authStore = useAuthStore()

const userName = computed(() => {
  return authStore.user?.name?.trim() || 'Usuário'
})

const firstName = computed(() => {
  return userName.value.split(' ')[0]
})

const resources = [
  {
    number: '01',
    category: 'ORGANIZAÇÃO',
    icon: 'mdi mdi-list-box-outline',
    title: 'Seus projetos',
    description:
      'Organize suas ideias, acompanhe seus projetos e transforme planos em resultados.',
    action: 'Explorar projetos',
    to: '/projects',
    available: true,
  },
  {
    number: '02',
    category: 'CRIATIVIDADE',
    icon: 'mdi mdi-creation-outline',
    title: 'Novas ideias',
    description:
      'Um espaço para desenvolver possibilidades e encontrar novas soluções.',
    action: 'Em breve',
    to: '',
    available: false,
  },
  {
    number: '03',
    category: 'PRODUTIVIDADE',
    icon: 'mdi mdi-skip-next-outline',
    title: 'Próximos passos',
    description:
      'Transforme objetivos em pequenas ações e acompanhe sua evolução.',
    action: 'Em breve',
    to: '',
    available: false,
  },
]
</script>

<template>
  <main class="home-page">
    <section class="home-welcome">
      <div class="home-welcome-content">
        <span class="home-eyebrow">
          SEU ESPAÇO DE CRIAÇÃO
        </span>

        <h1>
          Olá, {{ firstName }}<span class="home-title-period">.</span>
        </h1>

        <p class="home-welcome-description">
          Suas ideias começam aqui. Organize seus planos,
          explore possibilidades e avance no seu próprio ritmo.
        </p>

        <div class="home-actions">
          <RouterLink to="/projects" class="home-primary-button">
            Explorar projetos
            <span aria-hidden="true"><span class="mdi mdi-arrow-top-right"></span></span>
          </RouterLink>

          <a href="#recursos" class="home-secondary-link">
            Conhecer recursos
            <span aria-hidden="true"><span class="mdi mdi-arrow-down"></span></span>
          </a>
        </div>
      </div>

      <div class="home-welcome-decoration" aria-hidden="true">
        <span class="decoration-circle decoration-circle-one"></span>
        <span class="decoration-circle decoration-circle-two"></span>
        <span class="decoration-square"></span>
        <span class="decoration-cross">+</span>
      </div>

      <span class="home-welcome-index" aria-hidden="true">
        WORKSPACE / 001
      </span>
    </section>

    <section id="recursos" class="home-resources">
      <div class="home-section-heading">
        <div>
          <span class="home-eyebrow">COMECE POR AQUI</span>
          <h2>O que você quer fazer?</h2>
        </div>

        <p>
          Ferramentas para organizar suas ideias e manter o foco
          no que realmente importa.
        </p>
      </div>

      <div class="home-resources-grid">
        <defaultCard
          v-for="resource in resources"
          :key="resource.number"
          v-bind="resource"
        />
      </div>
    </section>

    <section class="home-bottom-note">
      <span class="home-note-symbol mdi mdi-arrow-top-right" aria-hidden="true">↗</span>


      <div>
        <h2>Uma ideia de cada vez.</h2>
        <p>
          Grandes resultados começam com pequenos passos.
        </p>
      </div>

      <span class="home-note-number">01 — 03</span>
    </section>

    <footer class="home-footer">
      <span>HACKATON WORKSPACE</span>
      <span>SEU ESPAÇO, SUAS IDEIAS.</span>
    </footer>
  </main>
</template>