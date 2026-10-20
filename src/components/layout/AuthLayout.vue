
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthOverlay from '@/components/shared/AuthOverlay.vue'

const route = useRoute()
const router = useRouter()

const isMobile = ref(false)
let mediaQuery

const mode = computed(() =>
  route.name === 'register' ? 'register' : 'login',
)

function toggle() {
  router.push({
    name: mode.value === 'login' ? 'register' : 'welcome',
  })
}

function updateScreenSize(event) {
  isMobile.value = event.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', updateScreenSize)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateScreenSize)
})
</script>

<template>
  <main class="auth-page">
    <section
      class="auth-card"
      :class="{
        'is-login': mode === 'login',
        'is-register': mode === 'register',
        'is-mobile': isMobile,
      }"
    >
      <RouterView v-slot="{ Component, route: current }">
        <Transition name="form-transition" mode="out-in">
          <component
            :is="Component"
            :key="current.path"
          />
        </Transition>
      </RouterView>

      <AuthOverlay
        :mode="mode"
        @toggle="toggle"
      />
    </section>
  </main>
</template>

<style>
.auth-page,
.auth-page * {
  box-sizing: border-box;
}

.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(16px, 4vw, 48px);
  background: #e7e7e7;
}

.auth-card {
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 1100px;
  height: clamp(560px, 82dvh, 760px);
  min-height: 0;
  overflow: hidden;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 24px 65px rgb(0 0 0 / 14%);
}

/* Animação de entrada e saída dos formulários */
.form-transition-enter-active,
.form-transition-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.form-transition-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.form-transition-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Tablet e celular */
@media (max-width: 767px) {
  .auth-page {
    align-items: center;
    padding: 16px;
  }

  .auth-card {
    width: 100%;
    max-width: 520px;
    height: auto;
    min-height: min(700px, calc(100dvh - 32px));
    margin-inline: auto;
    border-radius: 16px;
  }
}

/* Celulares estreitos */
@media (max-width: 380px) {
  .auth-page {
    padding: 10px;
  }

  .auth-card {
    min-height: min(690px, calc(100dvh - 20px));
    border-radius: 12px;
  }
}

/* Telas baixas: permite rolar a página em vez de esmagar o formulário */
@media (max-height: 620px) and (min-width: 768px) {
  .auth-page {
    align-items: flex-start;
    padding-block: 16px;
  }

  .auth-card {
    height: auto;
    min-height: 560px;
  }
}

/* Respeita a preferência por menos movimento */
@media (prefers-reduced-motion: reduce) {
  .form-transition-enter-active,
  .form-transition-leave-active {
    transition: none;
  }
}
</style>
