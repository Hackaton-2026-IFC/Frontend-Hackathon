import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const src = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const form = src('../src/components/tasks/TaskForm.vue')
const project = src('../src/views/ProjectView.vue')
const tasks = src('../src/views/TasksView.vue')

test('ambos os botões utilizam o mesmo TaskForm', () => {
  assert.match(project, /import TaskForm from '@\/components\/tasks\/TaskForm\.vue'/)
  assert.match(project, /<TaskForm[\s\S]*:projects="taskFormProjects"[\s\S]*:project-id="Number\(id\)"[\s\S]*@saved="addTask"/)
  assert.doesNotMatch(project, /<ProjectTaskModal/)
  assert.match(tasks, /import TaskForm from '@\/components\/tasks\/TaskForm\.vue'/)
  assert.match(tasks, /<TaskForm[\s\S]*@saved="savedTask"/)
})

test('um único formulário oferece todos os campos que existiam nos dois modais', () => {
  for (const field of ['titulo', 'descricao', 'status', 'data_limite', 'prioridade', 'clima_influencia', 'localizacao']) {
    assert.match(form, new RegExp('form\\.' + field), field)
  }
  assert.match(form, /selectedAssigneeIds/)
  assert.match(form, /inviteProjectMember/)
  assert.match(form, /store\.create\(payload\)/)
  assert.match(form, /store\.update\(props\.task\.id, payload\)/)
})

test('clima exige cidade e prazo; payload contém prioridade e clima', () => {
  assert.match(form, /form\.clima_influencia && \(!form\.localizacao\.trim\(\) \|\| !form\.data_limite\)/)
  assert.match(form, /prioridade: form\.prioridade/)
  assert.match(form, /clima_influencia: Boolean\(form\.clima_influencia\)/)
  assert.match(form, /localizacao: form\.clima_influencia \? form\.localizacao\.trim\(\) : ''/)
})

test('após criar no projeto, fecha modal, informa sucesso e recarrega o Kanban', () => {
  assert.match(project, /async function addTask\(\{ task \}\)/)
  assert.match(project, /toast\.success\('Tarefa criada com sucesso\.'\)/)
  assert.match(project, /await load\(\)/)
})
