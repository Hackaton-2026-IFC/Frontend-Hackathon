// Versões alteradas exigem um novo aceite antes de entrar na plataforma.
// Registro local: não equivale a consentimento auditável vinculado ao usuário no servidor.
export const LEGAL_VERSION = '2026-10-24'
export const LEGAL_STORAGE_KEY = 'momentum:legal-acceptance:v1'

export function readLegalAcceptance(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(LEGAL_STORAGE_KEY) || 'null')
    return value?.version === LEGAL_VERSION && typeof value.acceptedAt === 'string'
  } catch {
    return false
  }
}

export function saveLegalAcceptance(storage = globalThis.localStorage, now = new Date()) {
  const record = { version: LEGAL_VERSION, acceptedAt: now.toISOString() }
  storage.setItem(LEGAL_STORAGE_KEY, JSON.stringify(record))
  return record
}
