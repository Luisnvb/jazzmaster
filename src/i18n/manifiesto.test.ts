import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHIVO_MANIFIESTO, manifiesto } from './manifiesto.ts';

test('manifiesto español: la portada en la raíz', () => {
  const m = manifiesto('es', '/jazzmaster/');
  assert.equal(m.lang, 'es');
  assert.equal(m.id, '/jazzmaster/');
  assert.equal(m.start_url, '/jazzmaster/');
  assert.equal(m.scope, '/jazzmaster/');
  assert.equal(m.icons[0].src, '/jazzmaster/iconos/icono-192.png');
});

test('manifiesto inglés: otra app, que empieza en /en/ y abarca toda la web', () => {
  const m = manifiesto('en', '/jazzmaster');
  assert.equal(m.lang, 'en');
  assert.equal(m.id, '/jazzmaster/en/');
  assert.equal(m.start_url, '/jazzmaster/en/');
  assert.equal(m.scope, '/jazzmaster/');
  assert.match(m.description, /practise guitar/);
  assert.notEqual(m.id, manifiesto('es', '/jazzmaster/').id);
  assert.equal(manifiesto('en', '/').start_url, '/en/');
  assert.equal(ARCHIVO_MANIFIESTO.en, 'manifest.en.webmanifest');
});
