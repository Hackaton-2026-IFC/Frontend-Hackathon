import { googleClientId, loadGoogleIdentity } from './googleIdentity'

// Consentimento separado do login. O token OAuth não é persistido.
export const CALENDAR_SCOPES = 'openid https://www.googleapis.com/auth/calendar.events'

export function requestCalendarAuthorization({ google = window.google, clientId = googleClientId() } = {}) {
  if (!google?.accounts?.oauth2?.initTokenClient) {
    return Promise.reject(new Error('A autorização Google Agenda não está disponível.'))
  }
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (response) => {
      if (settled) return
      settled = true
      if (response?.error || !response?.access_token) {
        reject(new Error('A autorização do Google Agenda foi cancelada ou recusada.'))
        return
      }
      const scopes = new Set((response.scope || '').split(/\s+/))
      if (!CALENDAR_SCOPES.split(' ').every(scope => scopes.has(scope))) {
        reject(new Error('Autorize também openid e a criação de eventos no Google Agenda.'))
        return
      }
      resolve(response.access_token)
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_SCOPES,
      callback: finish,
      error_callback: () => finish({ error: 'popup_failed' }),
    })
    client.requestAccessToken({ prompt: 'consent' })
  })
}

export async function authorizeCalendar() {
  await loadGoogleIdentity()
  return requestCalendarAuthorization()
}
