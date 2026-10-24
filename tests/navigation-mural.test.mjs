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


test('o mural exibe botão flutuante e esconde o formulário até abrir o modal', () => {
  const notes = load('src/views/NotesView.vue')
  assert.match(notes, /class="mural-fab"/)
  assert.match(notes, /@click="openComposer"/)
  assert.match(notes, /v-if="composerOpen"/)
  assert.match(notes, /<Teleport to="body">/)
  assert.match(notes, /role="dialog"/)
  assert.match(notes, /aria-modal="true"/)
  assert.match(notes, /class="composer-dialog-body"/)
  assert.match(notes, /class="composer-dialog-footer"/)
  assert.doesNotMatch(notes, /<section v-if="!isProjectMural \|\| projectInfo" class="composer"/)
})

test('editar abre o modal, salvar fecha e cancelar não descarta dados sem querer ao salvar', () => {
  const notes = load('src/views/NotesView.vue')
  assert.match(notes, /function edit\(note\)[\s\S]*?showComposer\(\)/)
  assert.match(notes, /notes\.value = \[\.\.\.notes\.value\][\s\S]*?closeComposer\(true\)/)
  assert.match(notes, /function closeComposer\(force = false\)/)
  assert.match(notes, /if \(saving\.value && !force\) return/)
  assert.match(notes, /@click="closeComposer\(\)"/)
  assert.match(notes, /event\.key === 'Escape'/)
  assert.match(notes, /if \(event\.key !== 'Tab'\) return/)
})

test('botão + fica acima da navegação no celular sem trocar endpoint ou backend', () => {
  const notes = load('src/views/NotesView.vue')
  assert.match(notes, /bottom: calc\(78px \+ env\(safe-area-inset-bottom\)\)/)
  assert.match(notes, /notesApi\.listAll\(\{ projeto: projectId\.value/)
  assert.match(notes, /notesApi\.create\(payloadWithPhoto\(\)\)/)
})
