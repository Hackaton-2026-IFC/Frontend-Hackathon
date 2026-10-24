import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  activityAction,
  activityChanges,
  activityDate,
  activityTaskTitle,
} from '../src/utils/projectActivity.js'

test('exibe rótulos legíveis das ações enviadas pelo backend', () => {
  assert.equal(activityAction('tarefa_criada'), 'criou a tarefa')
  assert.equal(activityAction('tarefa_alterada'), 'atualizou a tarefa')
  assert.equal(activityAction('tarefa_excluida'), 'excluiu a tarefa')
  assert.equal(activityAction('comentario_criado'), 'comentou na tarefa')
  assert.equal(activityAction('comentario_editado'), 'editou um comentário na tarefa')
  assert.equal(activityAction('comentario_excluido'), 'excluiu um comentário da tarefa')
  assert.equal(activityAction('evento_desconhecido'), 'registrou uma atividade em')
})

test('traduz alterações e não mostra texto completo de descrições', () => {
  const event = {
    alteracoes: {
      status: { antes: 'planejado', depois: 'em_andamento' },
      descricao: { antes: 'texto privado', depois: 'texto atualizado' },
      data_limite: { antes: null, depois: '2026-11-01' },
    },
  }
  assert.deepEqual(activityChanges(event), [
    'Status: Planejada → Em andamento',
    'Descrição atualizada',
    'Prazo: Não definido → 01/11/2026',
  ])
  assert.deepEqual(activityChanges(event, 1), ['Status: Planejada → Em andamento'])
  assert.deepEqual(activityChanges({ alteracoes: {} }), [])
  assert.deepEqual(activityChanges({ alteracoes: null }), [])
})

test('mantém título mesmo depois de a tarefa ser excluída', () => {
  assert.equal(activityTaskTitle({ tarefa: null, tarefa_titulo: 'Entregar relatório' }), 'Entregar relatório')
  assert.equal(activityTaskTitle({ tarefa: null, tarefa_id_original: 12 }), 'Tarefa #12')
  assert.equal(activityTaskTitle({}), 'uma tarefa')
})

test('retorna data vazia em eventos sem horário válido', () => {
  assert.equal(activityDate(''), '')
  assert.equal(activityDate('data inválida'), '')
  assert.notEqual(activityDate('2026-10-24T14:00:00Z'), '')
})
