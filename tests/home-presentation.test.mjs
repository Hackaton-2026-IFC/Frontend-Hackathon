import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  topUrgentTasks,
  daysUntilDeadline,
  deadlineLabel,
  lastActiveProject,
  newestNotes,
} from '../src/utils/homePresentation.js'

test('tarefas concluídas não aparecem e vencimentos próximos ficam à frente', () => {
  const tasks = [
    { id: 1, titulo: 'Depois', status: 'planejado', urgencia: 'baixa', dias_para_prazo: 12 },
    { id: 2, titulo: 'Hoje', status: 'planejado', urgencia: 'muito_alta', dias_para_prazo: 0 },
    { id: 3, titulo: 'Concluída', status: 'concluido', urgencia: 'muito_alta', dias_para_prazo: -3 },
    { id: 4, titulo: 'Ontem', status: 'em_andamento', urgencia: 'alta', dias_para_prazo: -1 },
  ]
  assert.deepEqual(topUrgentTasks(tasks, 3).map((t) => t.id), [4, 2, 1])
  assert.deepEqual(topUrgentTasks([], 4), [])
})

test('usa o prazo antecipado quando não há prazo calculado', () => {
  const today = new Date(2026, 9, 24)
  assert.equal(daysUntilDeadline({ prazo_antecipado: '2026-10-25', data_limite: '2026-10-30' }, today), 1)
  assert.equal(deadlineLabel({ data_limite: '2026-10-24' }, today), 'Vence hoje')
  assert.equal(deadlineLabel({}, today), 'Sem prazo')
})

test('identifica o projeto com última atividade, não só o último criado', () => {
  const projects = [
    { id: 2, name: 'Novo', data_criacao: '2026-10-20' },
    { id: 1, name: 'Movimentado', data_criacao: '2026-10-01' },
  ]
  const result = lastActiveProject(projects, {
    '1': { criado_em: '2026-10-23T15:00:00-03:00' },
  })
  assert.equal(result.project.id, 1)
  assert.ok(result.lastActivityAt)
  assert.equal(lastActiveProject(projects, {}).project.id, 2)
  assert.equal(lastActiveProject([], {}), null)
})

test('mostra apenas notas não arquivadas mais recentemente alteradas', () => {
  const notes = [
    { id: 1, atualizada_em: '2026-10-01T10:00:00Z' },
    { id: 2, atualizada_em: '2026-10-03T10:00:00Z', arquivada: true },
    { id: 3, atualizada_em: '2026-10-02T10:00:00Z' },
  ]
  assert.deepEqual(newestNotes(notes, 2).map((n) => n.id), [3, 1])
})
