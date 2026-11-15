import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESCALAS_DIGITACION, POSICIONES, dedosTres, enPosicion, subeYBaja, tresPorCuerda } from './digitacion.ts';
import { TONICAS, pitchClass, notaDeGrado, semitonosGrado } from './teoria.ts';

const mayor = ESCALAS_DIGITACION[0].formula;
const mod = (n: number) => ((n % 12) + 12) % 12;
const pcsEscala = (t: string, f: readonly string[]) => new Set(f.map((g) => mod(pitchClass(notaDeGrado(t, '1')) + semitonosGrado(g))));

test('C mayor en la posición 7: sin estiramientos, 3-3-3-3-2-3', () => {
  const d = enPosicion('C', mayor, 7);
  assert.equal(d.estiramientos, 0);
  assert.equal(d.cambios, 0);
  assert.deepEqual(d.porCuerda, [3, 3, 3, 3, 2, 3]);
  assert.deepEqual(d.notas.filter((n) => n.cuerda === 0).map((n) => `${n.traste}${n.nota}${n.dedo}`), ['7B1', '8C2', '10D4']);
  assert.equal(d.desde, 7);
  assert.equal(d.hasta, 10);
});

test('posición fija: todas las notas de la escala del rango, una vez, en la ventana', () => {
  for (const e of ESCALAS_DIGITACION) {
    for (const t of TONICAS) {
      const pcs = pcsEscala(t, e.formula);
      for (const p of POSICIONES) {
        const d = enPosicion(t, e.formula, p);
        const alturas = d.notas.map((n) => n.midi);
        assert.deepEqual(alturas, [...alturas].sort((a, b) => a - b));
        assert.equal(new Set(alturas).size, alturas.length, `${t} ${e.id} ${p}: repetidas`);
        for (let m = 40 + p - 1; m <= 64 + p + 4; m++) assert.equal(pcs.has(mod(m)), alturas.includes(m), `${t} ${e.id} ${p}: ${m}`);
        for (const n of d.notas) {
          assert.ok(n.traste >= p - 1 && n.traste <= p + 4, `${t} ${e.id} ${p}: traste ${n.traste}`);
          assert.equal(n.estiramiento, n.traste === p + 4 || (n.traste === p - 1 && n.traste > 0));
          if (!n.estiramiento && n.traste > 0) assert.equal(n.dedo, n.traste - p + 1);
        }
        assert.equal(d.cambios, 0);
      }
    }
  }
});

test('tres notas por cuerda: 18 notas seguidas de la escala, tres en cada cuerda', () => {
  for (const e of ESCALAS_DIGITACION) {
    for (const t of TONICAS) {
      const pcs = pcsEscala(t, e.formula);
      for (let k = 0; k < 7; k++) {
        const d = tresPorCuerda(t, e.formula, k);
        assert.deepEqual(d.porCuerda, [3, 3, 3, 3, 3, 3]);
        assert.equal(d.notas[0].grado, e.formula[k]);
        assert.ok(d.notas[0].traste >= 1 && d.notas[0].traste <= 12);
        const alturas = d.notas.map((n) => n.midi);
        for (let i = 1; i < alturas.length; i++) {
          assert.ok(alturas[i] > alturas[i - 1]);
          for (let m = alturas[i - 1] + 1; m < alturas[i]; m++) assert.ok(!pcs.has(mod(m)), `${t} ${e.id} ${k}: se salta ${m}`);
        }
        assert.ok(d.notas.every((n) => pcs.has(mod(n.midi))));
      }
    }
  }
});

test('dedos con tres notas por cuerda y cambios de posición', () => {
  assert.deepEqual(dedosTres([5, 7, 9]), [1, 2, 4]); // tono-tono
  assert.deepEqual(dedosTres([5, 7, 8]), [1, 3, 4]); // tono-semitono
  assert.deepEqual(dedosTres([5, 6, 8]), [1, 2, 4]); // semitono-tono
  const d = tresPorCuerda('C', mayor, 0); // C en el 8 de la 6ª
  assert.deepEqual(d.notas.slice(0, 3).map((n) => n.traste), [8, 10, 12]);
  assert.ok(d.cambios >= 2, 'la mano sube por el mástil');
  assert.equal(d.hasta - d.desde, 5); // del 8 al 13: la forma sube en diagonal
});

test('sube y baja vuelve a la nota de partida', () => {
  const r = subeYBaja(enPosicion('G', mayor, 2));
  assert.equal(r[0].midi, r[r.length - 1].midi);
  assert.equal(r.length, 2 * enPosicion('G', mayor, 2).notas.length - 1);
});
