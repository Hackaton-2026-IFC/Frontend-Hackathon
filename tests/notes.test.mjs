import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

globalThis.localStorage = { getItem: () => null }
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: api } = await server.ssrLoadModule('/src/api/config.js')
  const { default: notesApi } = await server.ssrLoadModule('/src/api/notesApi.js')
  let handler
  api.defaults.adapter = async (config) => ({
    data: await handler(config),
    status: 200, statusText: 'OK', headers: {}, config,
  })

  await test('mural carrega todas as páginas do backend', async () => {
    const pages = []
    handler = (config) => {
      pages.push(config.params.page)
      return { results: [{ id: config.params.page, titulo: 'Ideia' }], total_pages: 2 }
    }
    assert.deepEqual((await notesApi.listAll()).map(n => n.id), [1, 2])
    assert.deepEqual(pages, [1, 2])
  })

  await test('mural aceita resposta sem paginação', async () => {
    handler = () => [{ id: 3, link: 'https://example.com' }]
    const notes = await notesApi.listAll()
    assert.equal(notes[0].link, 'https://example.com')
  })

  await test('ideias com imagem são enviadas por multipart FormData', async () => {
    handler = (config) => {
      assert.equal(config.method, 'post')
      assert.equal(config.url, 'notas/')
      assert.ok(config.data instanceof FormData)
      assert.equal(config.data.get('titulo'), 'Ideia de mural')
      assert.equal(config.data.get('link'), 'https://example.com')
      assert.equal(config.data.get('etiquetas'), '["hackathon"]')
      assert.equal(config.data.get('imagem').name, 'ideia.png')
      return { id: 9, titulo: 'Ideia de mural', imagem_url: 'https://example.com/ideia.png' }
    }
    const form = new FormData()
    form.append('titulo', 'Ideia de mural')
    form.append('link', 'https://example.com')
    form.append('etiquetas', '["hackathon"]')
    form.append('imagem', new Blob(['imagem-teste'], { type: 'image/png' }), 'ideia.png')
    const { data } = await notesApi.create(form)
    assert.equal(data.id, 9)
  })

  await test('ideias de texto ou link usam JSON e permitem limpar imagem', async () => {
    handler = (config) => {
      assert.equal(config.method, 'patch')
      assert.equal(config.url, 'notas/12/')
      const body = JSON.parse(config.data)
      assert.equal(body.link, 'https://example.org')
      assert.equal(body.imagem, null)
      return { id: 12, imagem_url: null, link: body.link }
    }
    const { data } = await notesApi.update(12, { link: 'https://example.org', imagem: null })
    assert.equal(data.imagem_url, null)
  })
} finally {
  await server.close()
}
