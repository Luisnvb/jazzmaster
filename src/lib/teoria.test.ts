import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notasDeFormula, semitonosGrado, midi, ajustarARango, notaDeGrado, notaBajoGrado, formatNota } from './teoria.ts';

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

test('nota por debajo de la tónica', () => {
  const bajo = (t: string, g: string) => formatNota(notaBajoGrado(t, g));
  assert.equal(bajo('C', 'b3'), 'A');
  assert.equal(bajo('C', 'b2'), 'B');
  assert.equal(bajo('C', '3'), 'Ab');
  assert.equal(bajo('C', 'b5'), 'F#');
  assert.equal(bajo('F', '4'), 'C');
  assert.equal(bajo('Eb', '7'), 'Fb');
  assert.equal(bajo('D', '7'), 'Eb');
  assert.equal(bajo('C', '8'), 'C');
});

test('midi y rango de guitarra', () => {
  assert.equal(midi('C', 4), 60);
  assert.equal(midi('E', 2), 40);
  assert.equal(midi('B#', 3), 60);
  assert.equal(midi('Cb', 4), 59);
  assert.deepEqual(ajustarARango([28, 32]), [40, 44]);
  assert.deepEqual(ajustarARango([90, 94]), [78, 82]);
});

test('color de acento: legible sobre blanco (texto y fondo de botón)', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');
  const acento = css.match(/--acento:\s*(#[0-9a-f]{6})/i)?.[1];
  assert.ok(acento, 'falta --acento en global.css');
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  assert.ok(1.05 / (lum(acento) + 0.05) >= 4.5, `${acento} con poco contraste`);
});
