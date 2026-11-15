import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRUPOS_CUARTAS, MODOS_CUARTAS, escaleraCuartas, rotulo, secuenciaCuartas, vampEn, type TipoCuartas } from './cuartas.ts';
import { AFINACION } from './secuencias.ts';

const modo = (id: string) => MODOS_CUARTAS.find((m) => m.id === id)!;
const grupo = (tipo: TipoCuartas, id: string) => GRUPOS_CUARTAS[tipo].find((g) => g.id === id)!.cuerdas;
const TIPOS: TipoCuartas[] = ['tres', 'cuatro', 'so-what'];

test('todos los voicings: cuartas (o So What), en la escala, tocables y en escalera', () => {
  for (const m of MODOS_CUARTAS) {
    for (const tipo of TIPOS) {
      for (const g of GRUPOS_CUARTAS[tipo]) {
        for (const tonica of ['C', 'D', 'Eb', 'F#', 'A']) {
          const e = escaleraCuartas(tonica, m, tipo, g.cuerdas);
          assert.ok(e.length >= 2, `${m.id} ${tipo} ${g.id} ${tonica}`);
          for (const v of e) {
            if (tipo === 'so-what') assert.deepEqual(v.intervalos, [5, 5, 5, 4]);
            else assert.ok(v.intervalos.every((s) => s === 5 || s === 6), `${v.notas}: ${v.intervalos}`);
            assert.ok(v.grados.every((x) => m.escala.includes(x)));
            const pisados = v.trastes.filter((t): t is number => t !== 'x' && t > 0);
            assert.ok(Math.max(...pisados) - Math.min(...pisados) <= 3);
            // Las alturas coinciden con los trastes.
            assert.deepEqual(v.trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t])), v.midis);
          }
          for (let i = 1; i < e.length; i++) assert.ok(e[i].midis[0] > e[i - 1].midis[0], 'en escalera');
          assert.ok(e[e.length - 1].midis[0] - e[0].midis[0] <= 12, 'una octava');
        }
      }
    }
  }
});

test('Dm7 dórico: cuartas en las cuerdas 6-5-4 y el acorde de So What', () => {
  const tres = escaleraCuartas('D', modo('dorico'), 'tres', grupo('tres', '654'));
  assert.equal(tres.map((v) => v.notas.join(' ')).join(' | '), 'F B E | G C F | A D G | B E A | C F B | D G C | E A D | F B E');
  // En las cuerdas 6-5-4, las cuartas justas son una cejilla (mismo traste).
  assert.deepEqual(tres.find((v) => v.notas[0] === 'D')!.trastes.slice(0, 3), [10, 10, 10]);
  const sw = escaleraCuartas('D', modo('dorico'), 'so-what', grupo('so-what', '65432'));
  const miles = sw.find((v) => v.notas.join(' ') === 'E A D G B')!;
  assert.deepEqual(miles.rotulos, ['9', '5', '1', '11', '13']);
  assert.deepEqual(miles.trastes, [12, 12, 12, 12, 12, 'x']);
});

test('solo cuartas justas: quita las que tienen la cuarta aumentada', () => {
  const todas = escaleraCuartas('D', modo('dorico'), 'tres', grupo('tres', '543'));
  const justas = escaleraCuartas('D', modo('dorico'), 'tres', grupo('tres', '543'), true);
  assert.ok(justas.length < todas.length);
  assert.ok(justas.every((v) => v.intervalos.every((s) => s === 5)));
  // En D dórico, la aumentada sale entre la 6 (B) y la b3 (F).
  assert.ok(todas.some((v) => v.notas.includes('B') && v.notas.includes('F')));
});

test('rótulos sobre el acorde del vamp y nombre del vamp', () => {
  const d = modo('dorico');
  assert.deepEqual(['1', '2', 'b3', '4', '5', '6', 'b7'].map((g) => rotulo(d, g)), ['1', '9', 'b3', '11', '5', '13', 'b7']);
  assert.equal(rotulo(modo('lidio'), '#4'), '#11');
  assert.equal(vampEn('Eb', d), 'Ebm7');
  assert.equal(vampEn('F', modo('lidio')), 'Fmaj7#11');
});

test('audio: escalera que sube y baja, vecinos alternando, y el bajo pedal', () => {
  const e = escaleraCuartas('D', modo('dorico'), 'tres', grupo('tres', '654'));
  const esc = secuenciaCuartas('D', e, 'escalera', 0, 120);
  assert.deepEqual(esc.orden, [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1]);
  assert.equal(esc.duracion, 14);
  const vec = secuenciaCuartas('D', e, 'vecinos', 2, 120);
  assert.deepEqual(vec.orden, [2, 2, 3, 2, 2, 2, 3, 2]);
  // Pedal en D (D2 = 38 no cabe: entre E2 y D#3 → D3 = 50), uno por compás.
  const pedales = vec.eventos.filter((x) => x.midi === 50 && x.duracion > 1.5);
  assert.equal(pedales.length, 4);
});
