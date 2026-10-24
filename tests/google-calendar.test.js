import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CALENDAR_SCOPES, requestCalendarAuthorization } from '../src/services/googleCalendarOAuth.js'

test('pede explicitamente escopos openid e calendar.events sem persistência', async () => {
  let callback
  let calls = 0
  const google = { accounts: { oauth2: { initTokenClient(options) {
    assert.equal(options.client_id, 'test-client')
    assert.equal(options.scope, CALENDAR_SCOPES)
    callback = options.callback
    return { requestAccessToken({ prompt }) {
      assert.equal(prompt, 'consent')
      calls += 1
      callback({ access_token: 'temporary-oauth-access-token', scope: CALENDAR_SCOPES })
    } }
  } } } }
  const token = await requestCalendarAuthorization({ google, clientId:'test-client' })
  assert.equal(token, 'temporary-oauth-access-token')
  assert.equal(calls, 1)
})

test('recusa escopos insuficientes', async () => {
  const google = { accounts:{ oauth2:{ initTokenClient({callback}) {
    return { requestAccessToken() { callback({ access_token:'token', scope:'openid' }) } }
  } } } }
  await assert.rejects(requestCalendarAuthorization({ google, clientId:'test-client' }), /Autorize também/)
})

test('recusa fechamento ou erro no popup de consentimento', async () => {
  const google = { accounts:{ oauth2:{ initTokenClient({error_callback}) {
    return { requestAccessToken() { error_callback({type:'popup_closed'}) } }
  } } } }
  await assert.rejects(requestCalendarAuthorization({google,clientId:'test-client'}), /cancelada ou recusada/)
})

test('recusa se cliente OAuth não estiver carregado', async () => {
  await assert.rejects(requestCalendarAuthorization({google:{accounts:{}},clientId:'test-client'}), /não está disponível/)
})
