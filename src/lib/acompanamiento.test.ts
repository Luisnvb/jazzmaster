import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPASES_BUCLE, ESTILOS_ACOMPANAMIENTO, alturasAcompanamiento, estiloValido, secuenciaAcompanamiento } from './acompanamiento.ts';

const mod = (n: number) => ((n % 12) + 12) % 12;

test('alturas: bajo entre E2 y D#3, la 5 del acorde y el acorde entre G3 y F#4', () => {
  assert.deepEqual(alturasAcompanamiento('C', ['1', '3', '5', '7']), { bajo: 48, quinta: 55, acorde: [55, 59, 60, 64] });
  assert.deepEqual(alturasAcompanamiento('E', ['1', 'b3', 'b5', 'b7']).quinta - 40, 6); // Em7b5: la b5
  for (const raiz of ['C', 'F#', 'Bb', 'E', 'Eb']) {
    const { bajo, acorde } = alturasAcompanamiento(raiz, ['1', 'b3', '5', 'b7']);
    assert.ok(bajo >= 40 && bajo <= 51, raiz);
    assert.ok(acorde.every((m) => m >= 55 && m <= 66), raiz);
  }
});

test('cada estilo: dos compases, solo notas del acorde, dentro de la vuelta', () => {
  const formula = ['1', '3', '5', 'b7'];
  const pcs = new Set([0, 4, 7, 10].map((x) => mod(x + 7))); // G7
  for (const { id } of ESTILOS_ACOMPANAMIENTO) {
    const { eventos, duracion } = secuenciaAcompanamiento('G', formula, id, 120);
    assert.equal(duracion, COMPASES_BUCLE * 2); // 2 compases de 4 a 120 = 4 s
    assert.ok(eventos.length > 0, id);
    for (const e of eventos) {
      assert.ok(pcs.has(mod(e.midi)), `${id}: ${e.midi}`);
      assert.ok(e.inicio >= 0 && e.inicio < duracion && e.inicio + e.duracion <= duracion + 1e-9, `${id}: ${e.inicio}+${e.duracion}`);
    }
  }
});

test('swing: charlestón en el 1 y en la corchea de swing del 2; clic en 2 y 4', () => {
  const { eventos } = secuenciaAcompanamiento('C', ['1', '3', '5', '7'], 'swing', 60, { metronomo: true });
  const golpes = [...new Set(eventos.filter((e) => !e.clic && e.midi >= 55).map((e) => Math.round(e.inicio * 3) / 3))];
  assert.deepEqual(golpes.slice(0, 2), [0, 5 / 3].map((x) => Math.round(x * 3) / 3));
  assert.deepEqual(eventos.filter((e) => e.clic).map((e) => e.inicio), [1, 3, 5, 7]);
});

test('con un instrumento sostenido, el pedal suena una vez toda la vuelta', () => {
  const { eventos, duracion } = secuenciaAcompanamiento('D', ['1', 'b3', '5', 'b7'], 'pedal', 100, { sostenido: true });
  assert.equal(eventos.length, 2);
  assert.ok(eventos.every((e) => e.inicio === 0 && e.duracion === duracion));
  assert.equal(estiloValido('lo-que-sea'), 'swing');
});
