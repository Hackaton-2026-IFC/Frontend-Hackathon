
<script setup>
defineProps({
  mode: {
    type: String,
    required: true,
  },
})

defineEmits(['toggle'])
</script>

<template>
  <aside
    class="auth-overlay"
    :class="mode === 'login' ? 'overlay-right' : 'overlay-left'"
    aria-label="Alternar entre login e cadastro"
  >
    <div class="overlay-content">
      <div
        class="overlay-message"
        :class="{ 'message-hidden': mode !== 'register' }"
        :inert="mode !== 'register'"
        :aria-hidden="mode !== 'register'"
      >
        <h2>Já tem uma conta?</h2>
        <p>Faça login para acessar o painel.</p>

        <button type="button" @click="$emit('toggle')">
          Login
        </button>
      </div>

      <div
        class="overlay-message"
        :class="{ 'message-hidden': mode !== 'login' }"
        :inert="mode !== 'login'"
        :aria-hidden="mode !== 'login'"
      >
        <h2>Não tem uma conta?</h2>
        <p>Cadastre-se agora e comece a usar.</p>

        <button type="button" @click="$emit('toggle')">
          Cadastro
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.auth-overlay {
  position: absolute;
  z-index: 20;
  top: 0;
  bottom: 0;
  left: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 50%;
  padding: clamp(24px, 4vw, 56px);
  overflow: hidden;

  color: #fff;
  background: #171717;
  border-radius: 18px;

  transition: transform 650ms cubic-bezier(0.65, 0, 0.35, 1);
  will-change: transform;
}

.overlay-right {
  transform: translateX(100%);
}

.overlay-left {
  transform: translateX(0);
}

.overlay-content {
  display: grid;
  width: 100%;
  min-width: 0;
}

.overlay-message {
  grid-column: 1;
  grid-row: 1;

  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;

  min-width: 0;
  opacity: 1;

  transition:
    opacity 250ms ease,
    transform 250ms ease;
}

.message-hidden {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
}

.overlay-message h2 {
  margin: 0;
  font-size: clamp(21px, 2.4vw, 30px);
  line-height: 1.25;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.overlay-message p {
  margin: 0;
  color: #b8b8b8;
  font-size: 14px;
  line-height: 1.6;
}

.overlay-message button {
  width: 100%;
  min-height: 44px;
  padding: 10px 16px;

  border: none;
  border-radius: 999px;

  color: #171717;
  background: #fff;
  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  transition:
    background 180ms ease,
    transform 180ms ease;
}

.overlay-message button:hover {
  background: #e8e8e8;
}

.overlay-message button:active {
  transform: scale(0.98);
}

.overlay-message button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}

@media (max-width: 767px) {
  .auth-overlay {
    top: auto;
    bottom: 0;
    left: 0;

    width: 100%;
    height: 150px;
    padding: 20px 24px;

    border-radius: 0 0 16px 16px;

    /* No celular, o painel fica embaixo */
    transform: none;
    transition: none;
  }

  .overlay-content {
    max-width: 360px;
    margin-inline: auto;
  }

  .overlay-message {
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .overlay-message h2 {
    font-size: 21px;
  }

  .overlay-message p {
    font-size: 12px;
  }

  .overlay-message button {
    min-height: 40px;
    margin-top: 2px;
  }
}

@media (max-width: 380px) {
  .auth-overlay {
    height: 145px;
    padding: 16px;
  }

  .overlay-message h2 {
    font-size: 19px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-overlay,
  .overlay-message,
  .overlay-message button {
    transition: none;
  }
}
</style>
