import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordenarConFavoritas } from './paginas-favoritas.ts';

test('favoritas primero, cada parte en su orden de siempre', () => {
  const favs = new Set(['/d/', '/b/']);
  assert.deepEqual(ordenarConFavoritas(['/a/', '/b/', '/c/', '/d/'], (h) => favs.has(h)), ['/b/', '/d/', '/a/', '/c/']);
  assert.deepEqual(ordenarConFavoritas(['/a/', '/b/'], () => false), ['/a/', '/b/']);
});
