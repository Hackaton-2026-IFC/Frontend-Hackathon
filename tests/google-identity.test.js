import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { googleClientId, mountGoogleButton } from '../src/services/googleIdentity.js'

const originalWindow = globalThis.window
const originalDocument = globalThis.document

afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
  if (originalDocument === undefined) delete globalThis.document
  else globalThis.document = originalDocument
})

test('usa somente um client ID público do tipo Web', () => {
  assert.match(googleClientId(), /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/)
})

test('renderiza Google Identity e encaminha ID token somente ao callback ativo', async () => {
  let handleResponse
  const received = []
  const mockedId = {
    initialize({ client_id, callback }) {
      assert.equal(client_id, googleClientId())
      handleResponse = callback
    },
    renderButton(host, options) {
      assert.equal(options.locale, 'pt-BR')
      assert.equal(options.ux_mode, undefined)
      host.rendered = true
    },
  }
  globalThis.window = { google: { accounts: { id: mockedId } } }
  const host = { clientWidth: 320, replaceChildren() { this.rendered = false } }
  const dispose = await mountGoogleButton(host, (token) => received.push(token))
  assert.equal(host.rendered, true)
  handleResponse({ credential: 'valid-google-id-token' })
  handleResponse({ credential: '' })
  handleResponse({})
  assert.deepEqual(received, ['valid-google-id-token'])
  dispose()
  handleResponse({ credential: 'token-after-unmount' })
  assert.deepEqual(received, ['valid-google-id-token'])
  assert.equal(host.rendered, false)

  const secondReceived = []
  const disposeAgain = await mountGoogleButton(host, (token) => secondReceived.push(token))
  handleResponse({ credential: 'token-second-mount' })
  assert.deepEqual(secondReceived, ['token-second-mount'])
  assert.deepEqual(received, ['valid-google-id-token'])
  disposeAgain()
})

