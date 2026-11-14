import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarProgresion } from './progresiones.ts';
import { eventosGuia, gradosGuia, lineasGuia, textoPaso } from './notas-guia.ts';

test('qué notas son las guía en cada calidad', () => {
  assert.deepEqual(gradosGuia(['1', 'b3', '5', 'b7']), ['b3', ['b7']]);
  assert.deepEqual(gradosGuia(['1', '3', '5', '6']), ['3', ['6']]);
  assert.deepEqual(gradosGuia(['1', '4', '5', 'b7']), ['4', ['b7']]);
  assert.deepEqual(gradosGuia(['1', 'b3', 'b5', 'bb7']), ['b3', ['bb7']]);
  assert.deepEqual(gradosGuia(['1', '3', '5']), ['3', ['1', '5']]);
});

test('ii–V–I: la 7 baja medio tono a la 3 y la 3 se queda como 7', () => {
  const g = lineasGuia('C', analizarProgresion(['IIm7', 'V7', 'Imaj7']), '7');
  assert.deepEqual(g.map((a) => a.simbolo), ['Dm7', 'G7', 'Cmaj7']);
  // Dm7: F abajo, C arriba → G7: F se queda (b7), C baja a B (3) → Cmaj7: F baja a E (3), B se queda (7).
  assert.deepEqual(g.map((a) => a.voces.map((v) => v.nota)), [['F', 'C'], ['F', 'B'], ['E', 'B']]);
  assert.deepEqual(g.map((a) => a.voces.map((v) => v.grado)), [['b3', 'b7'], ['b7', '3'], ['3', '7']]);
  assert.deepEqual(g[1].voces.map((v) => v.paso), [0, -1]);
  assert.equal(textoPaso(-1), '↓½');
  assert.equal(textoPaso(0), '=');
});

test('las líneas se mueven poco y no se cruzan en una progresión larga', () => {
  const c = analizarProgresion(['Imaj7 VIm7', 'IIm7 V7', 'IIIm7 VI7', 'IIm7 V7', 'III7', 'VI7', 'II7', 'V7', 'Imaj7']);
  for (const arriba of ['3', '7'] as const) {
    const g = lineasGuia('Eb', c, arriba);
    for (const a of g) {
      assert.ok(a.voces[0].midi < a.voces[1].midi);
      assert.ok(a.voces.every((v) => v.midi >= 45 && v.midi <= 79));
      for (const v of a.voces) if (v.paso !== null) assert.ok(Math.abs(v.paso) <= 6);
    }
  }
  const { eventos, tramos } = eventosGuia(c, lineasGuia('C', c), 120, 4, { bajo: true });
  assert.equal(tramos.length, 13);
  assert.equal(eventos.length, 13 * 3);
});
