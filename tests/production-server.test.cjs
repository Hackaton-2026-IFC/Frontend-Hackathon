const assert = require('node:assert/strict')
const { test } = require('node:test')
const { spawn } = require('node:child_process')
const net = require('node:net')
const path = require('node:path')

function availablePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer()
    socket.on('error', reject)
    socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port
      socket.close(() => resolve(port))
    })
  })
}
async function waitReady(url, child) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (child.exitCode !== null) throw new Error('Servidor encerrou antes do teste')
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Servidor não iniciou na porta solicitada')
}

test('npm start serve build e rotas do Vue Router no Dokku', async t => {
  const port = await availablePort()
  const base = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, [path.resolve(__dirname, '../server.cjs')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: 'ignore',
  })
  t.after(() => child.kill())
  await waitReady(base, child)
  const root = await fetch(base)
  assert.equal(root.status, 200)
  assert.match(await root.text(), /<html/i)
  for (const pathname of ['/privacidade', '/termos', '/projects/1']) {
    const res = await fetch(base + pathname)
    assert.equal(res.status, 200, pathname)
    assert.match(res.headers.get('content-type'), /text\/html/)
  }
  const missing = await fetch(base + '/assets/nao-existe.js')
  assert.equal(missing.status, 404)
  const head = await fetch(base + '/privacidade', { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal(await head.text(), '')
  const post = await fetch(base + '/', { method: 'POST' })
  assert.equal(post.status, 405)
})
