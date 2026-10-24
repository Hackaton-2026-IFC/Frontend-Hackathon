// Google Identity Services fornece um ID token para o backend validar.
// O OAuth Client ID é público (NUNCA use Client Secret no navegador).
export const MOMENTUM_GOOGLE_CLIENT_ID =
  '792721733181-sjg88bqnbftnag397ove7jidfk5hgh27.apps.googleusercontent.com'
export const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client'

export function googleClientId() {
  return import.meta.env?.VITE_GOOGLE_CLIENT_ID?.trim() || MOMENTUM_GOOGLE_CLIENT_ID
}

let loadingPromise = null
let initializedClientId = null
let activeCredentialHandler = null

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-momentum-google-identity]')
    const created = !script
    if (!script) {
      script = document.createElement('script')
      script.src = GOOGLE_IDENTITY_SCRIPT
      script.async = true
      script.defer = true
      script.dataset.momentumGoogleIdentity = 'true'
    }

    function cleanup() {
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
    }
    function onLoad() {
      cleanup()
      if (window.google?.accounts?.id) resolve(window.google.accounts.id)
      else {
        loadingPromise = null
        reject(new Error('A biblioteca de autenticação do Google não foi inicializada.'))
      }
    }
    function onError() {
      cleanup()
      script.remove()
      loadingPromise = null
      reject(new Error('Não foi possível carregar o Google. Confira a rede ou bloqueadores do navegador.'))
    }

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })
    if (created) document.head.appendChild(script)
  })
  return loadingPromise
}

function onGoogleCredential(response) {
  const credential = response?.credential
  if (typeof credential === 'string' && credential.trim() && activeCredentialHandler) {
    activeCredentialHandler(credential)
  }
}

/**
 * Renderiza um botão oficial GIS. Apenas a instância visível recebe o callback.
 * Retorna uma função para limpar ao trocar de rota/desmontar o componente.
 */
export async function mountGoogleButton(element, onCredential, { text = 'continue_with' } = {}) {
  if (!element) throw new Error('Container do botão Google não encontrado.')
  const clientId = googleClientId()
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID não configurado.')
  const gis = await loadGoogleIdentity()

  if (initializedClientId && initializedClientId !== clientId) {
    throw new Error('Client ID Google alterado. Recarregue a página.')
  }
  if (!initializedClientId) {
    gis.initialize({
      client_id: clientId,
      callback: onGoogleCredential,
      ux_mode: 'popup',
      auto_select: false,
      context: 'signin',
    })
    initializedClientId = clientId
  }

  activeCredentialHandler = onCredential
  element.replaceChildren()
  gis.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text,
    logo_alignment: 'left',
    width: Math.min(element.clientWidth || 320, 380),
    locale: 'pt-BR',
  })

  return () => {
    if (activeCredentialHandler === onCredential) activeCredentialHandler = null
    element.replaceChildren()
  }
}
