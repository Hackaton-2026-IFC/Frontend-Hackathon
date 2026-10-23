import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

globalThis.localStorage = { getItem: () => null }
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const {
    taskIsOverdue,
    responsibleForTask,
    taskCompletionDate,
    taskDueDate,
  } = await server.ssrLoadModule('/src/utils/taskPresentation.js')

  await test('destaca tarefas atrasadas sem marcar concluídas como atrasadas', () => {
    assert.equal(taskIsOverdue({ status: 'planejado', data_limite: '2000-01-01' }), true)
    assert.equal(taskIsOverdue({ status: 'concluido', data_limite: '2000-01-01' }), false)
    assert.equal(taskIsOverdue({ status: 'planejado', atrasada: true }), true)
    assert.equal(taskIsOverdue({ status: 'planejado', atrasada: false, data_limite: '2000-01-01' }), false)
  })

  await test('mostra o nome do responsável pelos participantes do projeto', () => {
    const projects = [{ id: 8, participantes: [
      { usuario: 5, usuario_detalhes: { name: 'Vitória' } },
    ] }]
    assert.equal(responsibleForTask({ projeto: 8, responsavel: 5 }, projects), 'Vitória')
    assert.equal(responsibleForTask({ projeto: 8, responsavel: null }, projects), 'Sem responsável')
    assert.equal(
      responsibleForTask({ projeto: 8, responsavel: 42 }, projects),
      'Responsável não identificado',
    )
  })

  await test('mostra data real de conclusão sem inventar histórico inexistente', () => {
    assert.equal(
      taskCompletionDate({ status: 'concluido', data_conclusao: '2026-10-23T15:00:00Z' }),
      '23/10/2026',
    )
    assert.equal(taskCompletionDate({ status: 'concluido' }), 'Data não registrada')
    assert.equal(taskCompletionDate({ status: 'planejado', data_conclusao: null }), null)
  })

  await test('exibe prazo efetivo quando fornecido pelo backend', () => {
    assert.equal(
      taskDueDate({ data_limite: '2026-10-30', prazo_efetivo: '2026-10-27' }),
      '27/10/2026',
    )
  })
} finally {
  await server.close()
}
