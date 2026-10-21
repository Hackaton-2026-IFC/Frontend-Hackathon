<template>
  <main class="not-found" aria-labelledby="not-found-title">
    <section class="not-found__content">
      <p class="not-found__code" aria-hidden="true">404</p>
      <h1 id="not-found-title">Página não encontrada</h1>
      <p class="not-found__message">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <RouterLink class="not-found__link" :to="{ name: 'welcome' }">
        Voltar ao início
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: 24px;
  background: #f7f8fa;
  color: #20242c;
  text-align: center;
}

.not-found__content {
  width: min(100%, 440px);
}

.not-found__code {
  margin-bottom: 12px;
  color: #e97536;
  font-size: clamp(5rem, 24vw, 8rem);
  font-weight: 800;
  letter-spacing: -0.08em;
  line-height: 1;
}

h1 {
  font-size: clamp(1.5rem, 7vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
}

.not-found__message {
  margin: 12px 0 28px;
  color: #626b78;
  font-size: 1rem;
}

.not-found__link {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  border-radius: 8px;
  background: #e97536;
  color: #fff;
  font-weight: 600;
  transition: background-color 150ms ease;
}

.not-found__link:hover {
  background: #cf5e25;
}

.not-found__link:focus-visible {
  outline: 3px solid #20242c;
  outline-offset: 3px;
}
</style>
