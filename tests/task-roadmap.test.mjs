import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

globalThis.localStorage = { getItem: () => null }
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const {
    orderedRoadmapSteps,
    roadmapCanToggle,
    roadmapProgress,
  } = await server.ssrLoadModule('/src/utils/taskRoadmap.js')

  await test('organiza etapas pelo campo ordem, nunca pela ordem recebida', () => {
    const steps = orderedRoadmapSteps({ microtarefas: [
      { id: 8, ordem: 3, titulo: 'Testes' },
      { id: 6, ordem: 1, titulo: 'Planejamento' },
      { id: 7, ordem: 2, titulo: 'Implementação' },
    ] })
    assert.deepEqual(steps.map((item) => item.id), [6, 7, 8])
    assert.deepEqual(orderedRoadmapSteps({}), [])
  })

  await test('permite conclusão apenas da próxima etapa sequencial', () => {
    const steps = [
      { id: 1, concluida: true },
      { id: 2, concluida: false },
      { id: 3, concluida: false },
    ]
    assert.equal(roadmapCanToggle(steps, 0), true)
    assert.equal(roadmapCanToggle(steps, 1), true)
    assert.equal(roadmapCanToggle(steps, 2), false)
    const complete = steps.map((step) => ({ ...step, concluida: true }))
    assert.equal(roadmapCanToggle(complete, 0), false)
    assert.equal(roadmapCanToggle(complete, 1), false)
    assert.equal(roadmapCanToggle(complete, 2), true)
    assert.equal(roadmapCanToggle(steps, 50), false)
  })

  await test('exibe progresso sem divisão por zero', () => {
    assert.deepEqual(roadmapProgress([]), { finished: 0, total: 0, percent: 0 })
    assert.deepEqual(roadmapProgress([{ concluida: true }, { concluida: false }]), {
      finished: 1, total: 2, percent: 50,
    })
  })

  await test('componentes novos e TasksView compilam como SFC', async () => {
    for (const modulePath of [
      '/src/components/tasks/TaskRoadmap.vue',
      '/src/components/tasks/TaskWorkspace.vue',
      '/src/components/tasks/TaskCommentsModal.vue',
      '/src/views/TasksView.vue',
    ]) {
      const module = await server.ssrLoadModule(modulePath)
      assert.ok(module.default, modulePath)
    }
  })
} finally {
  await server.close()
}
