import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIMETRICAS, acordesComunes, esSimetrica, moverPosicion } from './simetricas.ts';
import { notasFormula, ordenadas } from './arpegios.ts';

test('cada escala se repite a su periodo y no antes', () => {
  for (const s of SIMETRICAS) {
    assert.ok(esSimetrica(s.formula, s.periodo), s.id);
    for (let k = 1; k < s.periodo; k++) assert.ok(!esSimetrica(s.formula, k), `${s.id} a ${k}`);
    assert.equal(s.ejes.length * s.periodo, 12);
  }
});

test('acordes que comparten la escala', () => {
  const st = SIMETRICAS.find((s) => s.id === 'semitono-tono')!;
  assert.deepEqual(acordesComunes('C', st), ['C7b9', 'Eb7b9', 'Gb7b9', 'A7b9']);
  const te = SIMETRICAS.find((s) => s.id === 'tonos-enteros')!;
  assert.deepEqual(acordesComunes('C', te), ['C7#5', 'D7#5', 'E7#5', 'F#7#5', 'G#7#5', 'Bb7#5']);
});

test('el dibujo de una posición se repite al moverla el periodo', () => {
  for (const s of SIMETRICAS) {
    const n = notasFormula('C', s.formula, s.acorde);
    const forma = (desde: number) =>
      ordenadas(n, { tipo: 'posicion', desde }).map((x) => `${x.cuerda}:${x.traste - desde}`);
    // Desde el traste 3, sin las cuerdas al aire, y comparando con la posición siguiente.
    const a = n.filter((x) => x.traste >= 3 && x.traste <= 7).map((x) => `${x.cuerda}:${x.traste - 3}`);
    const b = n.filter((x) => x.traste >= 3 + s.periodo && x.traste <= 7 + s.periodo).map((x) => `${x.cuerda}:${x.traste - 3 - s.periodo}`);
    assert.deepEqual(a, b, s.id);
    assert.ok(forma(3).length > 0);
  }
  assert.equal(moverPosicion(11, 3, 1), 2);
  assert.equal(moverPosicion(1, 2, -1), 11);
});
