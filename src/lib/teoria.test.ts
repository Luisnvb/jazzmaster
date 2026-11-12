import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notasDeFormula, semitonosGrado, midi, ajustarARango, notaDeGrado, formatNota } from './teoria.ts';

test('ortografía de escalas', () => {
  assert.deepEqual(notasDeFormula('C', ['1', '2', '3', '4', '5', '6', '7']), ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  assert.deepEqual(notasDeFormula('F', ['1', '2', '3', '4', '5', '6', '7']), ['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
  assert.deepEqual(notasDeFormula('Eb', ['1', '2', 'b3', '4', '5', '6', 'b7']), ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db']);
  assert.deepEqual(notasDeFormula('C', ['1', 'b2', '#2', '3', 'b5', '#5', 'b7']), ['C', 'Db', 'D#', 'E', 'Gb', 'G#', 'Bb']);
  assert.deepEqual(notasDeFormula('F#', ['1', '2', '3', '#4', '5', '6', '7']), ['F#', 'G#', 'A#', 'B#', 'C#', 'D#', 'E#']);
});

test('arpegios y dobles alteraciones', () => {
  assert.deepEqual(notasDeFormula('C', ['1', 'b3', 'b5', 'bb7']), ['C', 'Eb', 'Gb', 'Bbb']);
  assert.deepEqual(notasDeFormula('Bb', ['1', '3', '5', 'b7']), ['Bb', 'D', 'F', 'Ab']);
  assert.deepEqual(notasDeFormula('B', ['1', 'b3', 'b5', 'b7']), ['B', 'D', 'F', 'A']);
});

test('tensiones por encima de la octava', () => {
  assert.equal(semitonosGrado('9'), 14);
  assert.equal(semitonosGrado('#11'), 18);
  assert.equal(semitonosGrado('b13'), 20);
  assert.equal(semitonosGrado('8'), 12);
  assert.equal(formatNota(notaDeGrado('G', 'b9')), 'Ab');
  assert.equal(formatNota(notaDeGrado('C', '8')), 'C');
});

test('midi y rango de guitarra', () => {
  assert.equal(midi('C', 4), 60);
  assert.equal(midi('E', 2), 40);
  assert.equal(midi('B#', 3), 60);
  assert.equal(midi('Cb', 4), 59);
  assert.deepEqual(ajustarARango([28, 32]), [40, 44]);
  assert.deepEqual(ajustarARango([90, 94]), [78, 82]);
});
