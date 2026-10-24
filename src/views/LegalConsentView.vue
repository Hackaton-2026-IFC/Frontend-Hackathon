<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { readLegalAcceptance, saveLegalAcceptance } from '@/services/legalAcceptance.js'

const router = useRouter()
const agreed = ref(false)
const error = ref('')
const accepted = ref(readLegalAcceptance())

function confirm() {
  if (!agreed.value) return
  try {
    saveLegalAcceptance()
    accepted.value = true
    router.replace('/')
  } catch {
    error.value = 'Não foi possível salvar seu aceite neste navegador. Verifique as permissões de armazenamento.'
  }
}
</script>

<template>
  <main class="consent-page">
    <section class="consent-panel" aria-labelledby="consent-title">
      <div class="consent-icon" aria-hidden="true">✓</div>
      <div class="consent-eyebrow">MOMENTUM · SEJA BEM-VINDO</div>
      <h1 id="consent-title">Antes de começar</h1>
      <p class="consent-lead">Para usar o Momentum, leia nossa Política de Privacidade e os Termos de Uso. Você pode consultá-los sem criar conta.</p>
      <div class="consent-documents">
        <RouterLink to="/privacidade" target="_blank" rel="noopener noreferrer">
          <span>Política de Privacidade</span><span aria-hidden="true">↗</span>
        </RouterLink>
        <RouterLink to="/termos" target="_blank" rel="noopener noreferrer">
          <span>Termos de Uso</span><span aria-hidden="true">↗</span>
        </RouterLink>
      </div>
      <form v-if="!accepted" @submit.prevent="confirm">
        <label class="consent-check"><input v-model="agreed" type="checkbox" required /><span>Li e concordo com os <RouterLink to="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</RouterLink> e declaro ciência da <RouterLink to="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</RouterLink>.</span></label>
        <p v-if="error" role="alert" class="consent-error">{{ error }}</p>
        <button class="consent-action" type="submit" :disabled="!agreed">Aceitar e continuar →</button>
        <p class="consent-footnote">O aceite é registrado neste navegador. Limpar os dados do site ou atualizar a versão destes documentos poderá solicitar um novo aceite.</p>
      </form>
      <div v-else>
        <p>Você já aceitou esta versão dos documentos.</p>
        <RouterLink to="/" class="consent-action consent-link">Continuar →</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.consent-page{min-height:100dvh;display:grid;place-items:center;background:#efefed;color:#171717;padding:20px}.consent-panel{max-width:520px;width:100%;background:#fff;border:1px solid #e5e5e5;border-radius:22px;padding:clamp(24px,5vw,42px);box-shadow:0 25px 70px #00000012}.consent-icon{display:grid;place-items:center;background:#141414;color:#fff;width:45px;height:45px;border-radius:12px;font-weight:900;font-size:24px}.consent-eyebrow{font-size:11px;letter-spacing:1.8px;font-weight:800;color:#777;margin-top:22px}.consent-panel h1{font-size:32px;letter-spacing:-1.2px;line-height:1.1;font-weight:800;margin:10px 0}.consent-lead{color:#5a5a5a;line-height:1.7;font-size:14px;margin:14px 0 22px}.consent-documents{display:grid;gap:9px;margin-bottom:20px}.consent-documents a{border:1px solid #e4e4e4;background:#fafafa;border-radius:11px;padding:14px 15px;display:flex;justify-content:space-between;font-size:14px;font-weight:700}.consent-documents a:hover{border-color:#999}.consent-check{display:flex;gap:12px;font-size:13px;line-height:1.65;align-items:flex-start}.consent-check input{flex:none;width:18px;height:18px;margin-top:2px;accent-color:#111}.consent-check a{text-decoration:underline;font-weight:700}.consent-action{display:block;width:100%;text-align:center;padding:13px 16px;border-radius:11px;border:none;background:#111;color:#fff;font-weight:700;font-size:14px;margin-top:19px}.consent-action:disabled{opacity:.5;cursor:not-allowed}.consent-link{text-decoration:none}.consent-footnote{font-size:11px;color:#777;line-height:1.6;margin-top:15px}.consent-error{color:#aa2424;font-size:12px;margin-top:12px}
</style>
