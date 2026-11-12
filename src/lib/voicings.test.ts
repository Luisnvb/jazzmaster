import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cuerdaDelBajo, transportar } from './voicings.ts';

test('cuerda del bajo', () => {
  assert.equal(cuerdaDelBajo([8, 'x', 8, 9, 8, 'x']), 6);
  assert.equal(cuerdaDelBajo(['x', 3, 5, 4, 5, 'x']), 5);
  assert.equal(cuerdaDelBajo(['x', 'x', 10, 11, 10, 11]), 4);
});

test('transportar un dibujo cerrado', () => {
  // Cmaj7 con bajo en 5ª → Fmaj7 sube 5 trastes.
  assert.deepEqual(transportar(['x', 3, 5, 4, 5, 'x'], 'C', 'F'), ['x', 8, 10, 9, 10, 'x']);
  // C7 en traste 8 → G7 baja a traste 3 en vez de subir al 15.
  assert.deepEqual(transportar([8, 'x', 8, 9, 8, 'x'], 'C', 'G'), [3, 'x', 3, 4, 3, 'x']);
  // Cmaj7 en traste 3 → Bbmaj7 baja al traste 1; Bmaj7 ya no cabe abajo y sube.
  assert.deepEqual(transportar(['x', 3, 5, 4, 5, 'x'], 'C', 'Bb'), ['x', 1, 3, 2, 3, 'x']);
  assert.deepEqual(transportar(['x', 3, 5, 4, 5, 'x'], 'C', 'B'), ['x', 2, 4, 3, 4, 'x']);
  assert.deepEqual(transportar(['x', 3, 5, 4, 5, 'x'], 'C', 'Db'), ['x', 4, 6, 5, 6, 'x']);
});

test('dibujo con cuerdas al aire', () => {
  assert.throws(() => transportar([0, 2, 1, 1, 0, 0], 'E', 'F'));
  assert.deepEqual(transportar([0, 2, 1, 1, 0, 0], 'E', 'E'), [0, 2, 1, 1, 0, 0]);
});
