import assert from 'node:assert/strict'
import { test } from 'node:test'
import { profilePhotoUrl } from '../src/utils/profilePhoto.js'
import { DEFAULT_PROJECT_COLOR, projectIconTextColor } from '../src/utils/projectColors.js'

test('prioriza foto manual e usa Google como fallback', () => {
  assert.equal(profilePhotoUrl({ profile_image: { url: 'https://cdn.example/foto.png' }, google_photo_url: 'https://google.example/face.png' }), 'https://cdn.example/foto.png')
  assert.equal(profilePhotoUrl({ profile_image: null, google_photo_url: 'https://google.example/face.png' }), 'https://google.example/face.png')
  assert.equal(profilePhotoUrl({ profile_image: 'https://cdn.example/photo.jpg' }), 'https://cdn.example/photo.jpg')
  assert.equal(profilePhotoUrl({ profileImage: 'https://cdn.example/photo.jpg' }), 'https://cdn.example/photo.jpg')
})
test('sem foto válida o componente usa as iniciais', () => {
  assert.equal(profilePhotoUrl({ profile_image: { url: 'javascript:alert(1)' } }), null)
  assert.equal(profilePhotoUrl({ profile_image: '' }), null)
  assert.equal(profilePhotoUrl(null), null)
})
test('preto como padrão e contraste adequado nas cores personalizadas', () => {
  assert.equal(DEFAULT_PROJECT_COLOR, '#000000')
  assert.equal(projectIconTextColor('#000000'), '#ffffff')
  assert.equal(projectIconTextColor('#FFFFFF'), '#111111')
  assert.equal(projectIconTextColor('#fff475'), '#111111')
  assert.equal(projectIconTextColor('#123456'), '#ffffff')
})
