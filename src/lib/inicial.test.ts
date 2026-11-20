import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compararIniciales, inicial } from './inicial.ts';

test('inicial: mayúscula, sin tilde, y «#» para números y símbolos', () => {
  assert.equal(inicial('autumn Leaves'), 'A');
  assert.equal(inicial('  Ésta'), 'E');
  assert.equal(inicial('Ñandú'), 'N');
  assert.equal(inicial('500 Miles High'), '#');
  assert.equal(inicial('¿Qué?'), '#');
  assert.equal(inicial(''), '#');
});

test('compararIniciales: «#» delante y luego por orden alfabético', () => {
  assert.deepEqual(['C', '#', 'A', 'B'].sort(compararIniciales), ['#', 'A', 'B', 'C']);
});
