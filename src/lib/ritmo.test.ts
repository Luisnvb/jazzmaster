import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PATRONES_RITMO, acordeGolpe, celdasPorCompas, etiquetaCelda, eventosRitmo, posicionCelda } from './ritmo.ts';

test('patrones dentro de su rejilla', () => {
  for (const p of PATRONES_RITMO) {
    const total = celdasPorCompas(p) * p.compases;
    assert.ok(p.golpes.every((g) => g >= 0 && g < total), p.id);
  }
});

test('etiquetas y swing', () => {
  assert.deepEqual([0, 1, 2, 3].map((k) => etiquetaCelda(2, k)), ['1', 'y', '2', 'y']);
  assert.deepEqual([0, 1, 2, 3].map((k) => etiquetaCelda(4, k)), ['1', 'e', 'y', 'a']);
  assert.deepEqual([0, 1, 2, 3].map((k) => etiquetaCelda(3, k)), ['1', 'tri', 'pa', '2']);
  const r = { division: 2 as const, pulsos: 4, compases: 1, golpes: [] };
  assert.equal(posicionCelda(r, 3, 0.5), 1.5);
  assert.ok(Math.abs(posicionCelda(r, 3, 2 / 3) - 5 / 3) < 1e-9);
});

test('eventos: charlestón a 120 con swing de tresillo y metrónomo en 2 y 4', () => {
  const p = PATRONES_RITMO.find((x) => x.id === 'charleston')!;
  const { eventos, duracion } = eventosRitmo(p, 120, { swing: 2 / 3, metronomo: 'dos-cuatro', acorde: acordeGolpe('C') });
  assert.equal(duracion, 2);
  const golpes = [...new Set(eventos.filter((e) => !e.clic).map((e) => e.inicio))];
  assert.equal(golpes.length, 2);
  assert.ok(Math.abs(golpes[1] - (5 / 3) * 0.5) < 1e-9);
  assert.deepEqual(eventos.filter((e) => e.clic).map((e) => e.inicio), [0.5, 1.5]);
  // C13 sin quinta: C Bb E A.
  assert.deepEqual(acordeGolpe('C').map((m) => m % 12), [0, 10, 4, 9]);
});
