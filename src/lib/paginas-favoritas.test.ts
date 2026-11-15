import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conReciente, ordenarConFavoritas } from './paginas-favoritas.ts';

test('favoritas primero, cada parte en su orden de siempre', () => {
  const favs = new Set(['/d/', '/b/']);
  assert.deepEqual(ordenarConFavoritas(['/a/', '/b/', '/c/', '/d/'], (h) => favs.has(h)), ['/b/', '/d/', '/a/', '/c/']);
  assert.deepEqual(ordenarConFavoritas(['/a/', '/b/'], () => false), ['/a/', '/b/']);
});

test('recientes: la última delante, sin repetir y como mucho ocho', () => {
  assert.deepEqual(conReciente(['/a/', '/b/', '/c/'], '/b/'), ['/b/', '/a/', '/c/']);
  const llena = Array.from({ length: 8 }, (_, i) => `/${i}/`);
  const nueva = conReciente(llena, '/x/');
  assert.equal(nueva.length, 8);
  assert.equal(nueva[0], '/x/');
  assert.ok(!nueva.includes('/7/'));
});
