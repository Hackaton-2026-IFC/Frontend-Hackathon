import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

globalThis.localStorage = { getItem: () => null }
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const {
    automaticPriority,
    taskIsOverdue,
    responsibleForTask,
    assigneeMembers,
    assigneeDisplayName,
    assigneePhotoUrl,
    taskCompletionDate,
    taskDueDate,
  } = await server.ssrLoadModule('/src/utils/taskPresentation.js')

  await test('calcula automaticamente a prioridade pela proximidade do prazo', () => {
    const today = new Date(2026, 9, 23, 12)
    const priority = (date) => automaticPriority({ data_limite: date, status: 'planejado' }, today)
    assert.equal(priority('2026-10-01'), 'muito_alta')
    assert.equal(priority('2026-10-23'), 'muito_alta')
    assert.equal(priority('2026-10-24'), 'alta')
    assert.equal(priority('2026-10-25'), 'alta')
    assert.equal(priority('2026-10-26'), 'neutra')
    assert.equal(priority('2026-10-30'), 'neutra')
    assert.equal(priority('2026-10-31'), 'baixa')
    assert.equal(priority('2026-11-06'), 'baixa')
    assert.equal(priority('2026-11-07'), 'muito_baixa')
    assert.equal(automaticPriority({ status: 'planejado' }, today), 'neutra')
    assert.equal(automaticPriority({ status: 'concluido', data_limite: '2026-10-20' }, today), null)
  })

  await test('prioriza prazo antecipado e ignora prioridade manual anterior', () => {
    const today = new Date(2026, 9, 23, 12)
    assert.equal(automaticPriority({
      status: 'planejado',
      data_limite: '2026-12-20',
      prazo_antecipado: '2026-10-24',
      prioridade: 'muito_baixa',
    }, today), 'alta')
  })

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
    assert.equal(responsibleForTask({ projeto: 8, responsavel: 42 }, projects), 'Responsável não identificado')
  })

  await test('resolve vários responsáveis e fotos a partir dos membros do projeto', () => {
    const members = [
      { usuario: 5, usuario_detalhes: { name: 'Vitória', profile_image: { url: 'https://example.org/vitoria.png' } } },
      { usuario: 6, usuario_detalhes: { name: 'Lucas', profile_image: null } },
    ]
    const projects = [{ id: 8, participantes: members }]
    const task = { id: 20, projeto: 8, responsavel: 5 }
    const selected = assigneeMembers(task, projects, { '20': ['6', '5', '6'] })
    assert.deepEqual(selected.map((member) => member.usuario), [5, 6])
    assert.equal(assigneeDisplayName(selected[0]), 'Vitória')
    assert.equal(assigneePhotoUrl(selected[0]), 'https://example.org/vitoria.png')
    assert.equal(assigneePhotoUrl(selected[1]), null)
    assert.deepEqual(assigneeMembers(task, projects, {} ).map((member) => member.usuario), [5])
    assert.deepEqual(assigneeMembers({ id: 99, projeto: 8, responsavel: null }, projects, {}), [])
    assert.equal(assigneePhotoUrl({ usuario_detalhes: { profile_image: { url: 'javascript:alert(1)' } } }), null)
  })

  await test('mostra a data real de conclusão sem inventar histórico', () => {
    assert.equal(taskCompletionDate({ status: 'concluido', data_conclusao: '2026-10-23T15:00:00Z' }), '23/10/2026')
    assert.equal(taskCompletionDate({ status: 'concluido' }), 'Data não registrada')
    assert.equal(taskCompletionDate({ status: 'planejado', data_conclusao: null }), null)
  })

  await test('exibe prazo efetivo quando fornecido pelo backend', () => {
    assert.equal(taskDueDate({ data_limite: '2026-10-30', prazo_efetivo: '2026-10-27' }), '27/10/2026')
  })
} finally {
  await server.close()
}
