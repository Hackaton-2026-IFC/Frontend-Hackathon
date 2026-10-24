import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LEGAL_STORAGE_KEY, LEGAL_VERSION, readLegalAcceptance, saveLegalAcceptance } from '../src/services/legalAcceptance.js'

function memoryStore() {
  const map = new Map()
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null },
    setItem(key, value) { map.set(key, String(value)) },
  }
}

test('sem aceite, o usuário deve ver a tela de consentimento', () => {
  const store = memoryStore()
  assert.equal(readLegalAcceptance(store), false)
})

test('registra versão e data e mantém após atualização da aplicação', () => {
  const store = memoryStore()
  const date = new Date('2026-10-24T09:00:00.000Z')
  const record = saveLegalAcceptance(store, date)
  assert.equal(record.version, LEGAL_VERSION)
  assert.equal(record.acceptedAt, date.toISOString())
  assert.equal(readLegalAcceptance(store), true)
  assert.equal(JSON.parse(store.getItem(LEGAL_STORAGE_KEY)).version, LEGAL_VERSION)
})

test('não aceita uma versão antiga nem registros inválidos', () => {
  const store = memoryStore()
  store.setItem(LEGAL_STORAGE_KEY, JSON.stringify({ version: '2025-01-01', acceptedAt: new Date().toISOString() }))
  assert.equal(readLegalAcceptance(store), false)
  store.setItem(LEGAL_STORAGE_KEY, '{corrompido')
  assert.equal(readLegalAcceptance(store), false)
})

test('falha de armazenamento não finge consentimento', () => {
  const storage = { getItem() { throw new Error('Storage blocked') }, setItem() { throw new Error('Storage blocked') } }
  assert.equal(readLegalAcceptance(storage), false)
  assert.throws(() => saveLegalAcceptance(storage), /Storage blocked/)
})
