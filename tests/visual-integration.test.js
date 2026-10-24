import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('visual da integração mantém filtros, Kanban mobile e estilos globais', () => {
  const project = read('../src/views/ProjectView.vue')
  assert.match(project, /project-tasks__filter-toolbar/)
  assert.match(project, /project-tasks__mobile-list/)
  assert.match(project, /<ProjectTaskCard/)
  assert.match(read('../src/main.js'), /internal-pages\.css/)
})

test('criação de tarefas mantém o formulário compartilhado com a DEV', () => {
  const project = read('../src/views/ProjectView.vue')
  const tasks = read('../src/views/TasksView.vue')
  assert.match(project, /<TaskForm[\s\S]*@saved="addTask"/)
  assert.doesNotMatch(project, /<ProjectTaskModal/)
  assert.match(tasks, /<TaskForm[\s\S]*@saved="savedTask"/)
  assert.match(project, /async function addTask\(\{ task \}\)/)
})

test('recursos e ações de notas da DEV continuam disponíveis', () => {
  const project = read('../src/views/ProjectView.vue')
  const notes = read('../src/views/NotesView.vue')
  assert.match(project, /<ProjectResources/)
  assert.match(project, /async function addResource/)
  assert.match(notes, /async function archive\(note\)/)
  assert.match(notes, /@click="archive\(note\)"/)
})

test('links legais publicados permanecem acessíveis', () => {
  const app = read('../src/App.vue')
  assert.match(app, /to="\/privacidade"/)
  assert.match(app, /to="\/termos"/)
})
