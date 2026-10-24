import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

globalThis.localStorage = { getItem: () => null }
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: api } = await server.ssrLoadModule('/src/api/config.js')
  const {
    default: taskApi,
    isOverdue,
    safeResourceUrl,
  } = await server.ssrLoadModule('/src/api/taskApi.js')
  const { useTaskStore } = await server.ssrLoadModule('/src/stores/taskStore.js')
  let handler
  api.defaults.adapter = async (config) => ({
    data: await handler(config),
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })

  await test('loads all project pages using backend total_pages pagination', async () => {
    const pages = []
    handler = (config) => {
      pages.push(config.params.page)
      return { results: [{ id: config.params.page }], page: config.params.page, total_pages: 3 }
    }
    assert.equal((await taskApi.projects()).length, 3)
    assert.deepEqual(pages, [1, 2, 3])
  })
  await test('supports unpaginated project responses', async () => {
    handler = () => [{ id: 4 }]
    assert.deepEqual(await taskApi.projects(), [{ id: 4 }])
  })
  await test('loads all three task statuses and accessible projects', async () => {
    setActivePinia(createPinia())
    const store = useTaskStore()
    handler = (config) =>
      config.url === 'tarefas/kanban/'
        ? {
            planejado: [{ id: 1, status: 'planejado' }],
            em_andamento: [{ id: 2, status: 'em_andamento' }],
            concluido: [{ id: 3, status: 'concluido' }],
          }
        : []
    await store.load()
    assert.equal(store.tasks.length, 3)
    assert.equal(store.loading, false)
  })
  await test('CRUD changes state only after API success; validation errors are visible', async () => {
    setActivePinia(createPinia())
    const store = useTaskStore()
    handler = (config) => ({ ...JSON.parse(config.data), id: 12 })
    await store.create({ titulo: 'Teste', projeto: 1, status: 'planejado' })
    assert.equal(store.tasks[0].titulo, 'Teste')
    await store.update(12, { titulo: 'Editada', status: 'em_andamento' })
    assert.equal(store.tasks[0].status, 'em_andamento')
    handler = () => {
      throw { response: { data: { status: ['Conclua todas as microtarefas primeiro.'] } } }
    }
    await assert.rejects(store.update(12, { status: 'concluido' }))
    assert.equal(store.tasks[0].status, 'em_andamento')
    assert.match(store.error, /microtarefas/)
    assert.equal(store.busy, false)
    handler = () => null
    await store.remove(12)
    assert.equal(store.tasks.length, 0)
  })
  await test('checklist fetches the recalculated parent status', async () => {
    setActivePinia(createPinia())
    const store = useTaskStore()
    store.tasks = [{ id: 9, status: 'planejado', microtarefas: [] }]
    const calls = []
    handler = (config) => {
      calls.push(config.url)
      return config.url === 'tarefas/9/'
        ? { id: 9, status: 'concluido', microtarefas: [{ id: 2, concluida: true }] }
        : {}
    }
    await store.checklist(9, { id: 2, concluida: false })
    assert.deepEqual(calls, ['microtarefas/2/', 'tarefas/9/'])
    assert.equal(store.tasks[0].status, 'concluido')
  })
  await test('overdue comparison respects local date and excludes completed tasks', () => {
    const today = new Date(2026, 9, 23, 1)
    assert.equal(isOverdue({ data_limite: '2026-10-22', status: 'planejado' }, today), true)
    assert.equal(isOverdue({ data_limite: '2026-10-23', status: 'planejado' }, today), false)
    assert.equal(isOverdue({ data_limite: '2026-10-22', status: 'concluido' }, today), false)
  })
  await test('resource links allow only HTTP and HTTPS', () => {
    assert.equal(safeResourceUrl('javascript:alert(1)'), null)
    assert.equal(safeResourceUrl('data:text/html,test'), null)
    assert.equal(safeResourceUrl('https://example.com/doc'), 'https://example.com/doc')
  })
  await test('resource requests run through the store and stay scoped to each task', async () => {
    setActivePinia(createPinia())
    const store = useTaskStore()
    const calls = []
    handler = (config) => {
      calls.push(`${config.method} ${config.url}`)
      if (config.method === 'get') {
        return [{ id: 8, titulo: 'Material existente', tarefa: 20 }]
      }
      return { id: 9, tarefa: 20, ...JSON.parse(config.data) }
    }
    await store.loadResources(20)
    assert.equal(store.resourcesByTask[20][0].id, 8)
    assert.deepEqual(store.resourcesByTask[21] || [], [])
    await store.addResource(20, { titulo: 'Novo link', url: 'https://example.com', tipo: 'link' })
    assert.deepEqual(store.resourcesByTask[20].map((item) => item.id), [9, 8])
    assert.deepEqual(calls, ['get tarefas/20/recursos/', 'post tarefas/20/recursos/'])
    assert.equal(store.resourcesLoading[20], false)
    assert.equal(store.busy, false)
  })
  await test('resource API errors remain in the store without inserting fake entries', async () => {
    setActivePinia(createPinia())
    const store = useTaskStore()
    handler = () => {
      throw { response: { data: { url: ['Use um link HTTP ou HTTPS.'] } } }
    }
    await assert.rejects(store.loadResources(30))
    assert.match(store.resourceErrors[30], /url/)
    assert.equal(store.resourcesLoading[30], false)
    await assert.rejects(store.addResource(30, { titulo: 'Inválido', url: 'ftp://x', tipo: 'link' }))
    assert.match(store.resourceErrors[30], /HTTPS/)
    assert.deepEqual(store.resourcesByTask[30] || [], [])
    assert.equal(store.busy, false)
  })
} finally {
  await server.close()
}
