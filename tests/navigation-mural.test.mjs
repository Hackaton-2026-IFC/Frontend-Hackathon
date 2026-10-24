import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const load = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

test('sidebar não apresenta mais a página de notas pessoais', () => {
  const component = load('src/components/layout/appSidebarComponent.vue')
  assert.doesNotMatch(component, /to:\s*['"]\/notes['"]/)
  assert.doesNotMatch(component, /label:\s*['"]Notas['"]/)
  assert.match(component, /to:\s*['"]\/projects['"]/)
})

test('/notes redireciona sem apagar notas e mantém mural por projeto', () => {
  const router = load('src/router/index.js')
  assert.match(router, /path:\s*['"]\/notes['"],\s*redirect:\s*\{\s*name:\s*['"]projects['"]/)
  assert.match(router, /path:\s*['"]\/projects\/:id\/mural['"]/)
  assert.match(router, /name:\s*['"]project-mural['"]/)
  assert.match(router, /component:\s*NotesView/)
})

test('projeto mantém acesso ao mural e cabeçalho reconhece a página', () => {
  const details = load('src/views/DetalhesProjetoView.vue')
  const header = load('src/components/layout/appHeaderComponent.vue')
  assert.match(details, /name:\s*['"]project-mural['"]/)
  assert.match(header, /route\.name === ['"]project-mural['"]/)
  assert.match(header, /Mural de ideias/)
})
