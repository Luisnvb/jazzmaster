import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASES, INTERVALOS, TRIADAS, UTILES, combinar, nombrarAcorde, notasTriada, secuenciaSlash, type IdBase, type TipoTriada } from './slash.ts';

const nombre = (base: IdBase, intervalo: string, tipo: TipoTriada, bajo = 'C') => combinar({ bajo, base, intervalo, tipo }).analisis.simbolo;

test('nombrador: acordes conocidos por sus semitonos', () => {
  assert.equal(nombrarAcorde('C', [4, 7, 11]).simbolo, 'Cmaj7');
  assert.equal(nombrarAcorde('C', [3, 7, 10]).simbolo, 'Cm7');
  assert.equal(nombrarAcorde('C', [3, 6, 10]).simbolo, 'Cm7b5');
  assert.equal(nombrarAcorde('C', [3, 6, 9]).simbolo, 'C°7');
  assert.equal(nombrarAcorde('C', [5, 7, 10]).simbolo, 'C7sus4');
  assert.equal(nombrarAcorde('C', [4, 7, 9, 2]).simbolo, 'C6/9');
  assert.equal(nombrarAcorde('C', [4, 10, 2, 9]).simbolo, 'C13');
  assert.equal(nombrarAcorde('C', [3, 7, 11]).simbolo, 'CmMaj7');
  assert.equal(nombrarAcorde('C', [4, 8]).simbolo, 'C+');
  assert.equal(nombrarAcorde('C', [2, 7]).simbolo, 'Csus2');
});

test('estructuras superiores sobre C7', () => {
  assert.equal(nombre('dom', '2', 'mayor'), 'C13(#11)');
  assert.equal(nombre('dom', '6', 'mayor'), 'C13(b9)');
  assert.equal(nombre('dom', 'b5', 'mayor'), 'C7(b9,#11)');
  assert.equal(nombre('dom', 'b6', 'mayor'), 'C7(#9,b13)');
  assert.equal(nombre('dom', 'b3', 'mayor'), 'C7(#9)');
  assert.equal(nombre('dom', 'b2', 'menor'), 'C7(b9,b13)');
});

test('sobre maj7 y m7', () => {
  assert.equal(nombre('maj', '5', 'mayor'), 'Cmaj9');
  assert.equal(nombre('maj', '2', 'mayor'), 'Cmaj13(#11)');
  assert.equal(nombre('maj', '7', 'menor'), 'Cmaj9(#11)');
  assert.equal(nombre('men', '4', 'mayor'), 'Cm13');
  assert.equal(nombre('men', 'b7', 'mayor'), 'Cm11');
});

test('slash sobre el bajo: acordes nuevos, sin 3ª e inversiones', () => {
  const d = combinar({ bajo: 'C', base: 'bajo', intervalo: '2', tipo: 'mayor' });
  assert.equal(d.escrito, 'D/C');
  assert.equal(d.analisis.simbolo, 'C6/9(#11)');
  assert.equal(d.analisis.sinTercera, true);
  assert.deepEqual(d.deTriada, ['9', '#11', '6']);
  assert.equal(nombre('bajo', 'b7', 'mayor'), 'C9sus4');
  assert.equal(nombre('bajo', 'b2', 'mayor'), 'Csus4(b9,b13)');
  assert.equal(nombre('bajo', '3', 'mayor'), 'Cmaj7#5');
  assert.equal(nombre('bajo', '5', 'menor'), 'C9');
  assert.equal(nombre('bajo', 'b3', 'mayor'), 'Cm7');
  // F/G y D/E: el 9sus4 en otras tónicas.
  assert.equal(combinar({ bajo: 'G', base: 'bajo', intervalo: 'b7', tipo: 'mayor' }).escrito, 'F/G');
  assert.equal(nombre('bajo', 'b7', 'mayor', 'G'), 'G9sus4');
  // Si el bajo es nota de la tríada, es una inversión y se nombra como tal.
  const ab = combinar({ bajo: 'C', base: 'bajo', intervalo: 'b6', tipo: 'mayor' });
  assert.equal(ab.inversion, true);
  assert.equal(ab.analisis.simbolo, 'Ab/C');
  assert.equal(nombre('bajo', '1', 'menor'), 'Cm');
});

test('grafía de la tríada: la b5 de F es B, no Cb', () => {
  assert.deepEqual(notasTriada('F', 'b5', 'mayor'), ['B', 'D#', 'F#']);
  assert.deepEqual(notasTriada('C', 'b6', 'mayor'), ['Ab', 'C', 'Eb']);
  assert.equal(combinar({ bajo: 'F', base: 'dom', intervalo: 'b5', tipo: 'mayor' }).escrito, 'B sobre F7');
});

test('todas las combinaciones tienen nombre y grados para cada nota', () => {
  for (const b of BASES) {
    for (const i of INTERVALOS) {
      for (const t of TRIADAS) {
        for (const bajo of ['C', 'F#', 'Bb']) {
          const r = combinar({ bajo, base: b.id, intervalo: i, tipo: t.id });
          assert.ok(r.analisis.simbolo.length > 0);
          assert.ok(r.analisis.grados.every((g) => g.grado), `${bajo} ${b.id} ${i} ${t.id}: ${JSON.stringify(r.analisis.grados)}`);
          assert.ok(!/undefined|NaN/.test(r.analisis.simbolo + r.escrito));
        }
      }
    }
  }
  // Las útiles de cada base existen en las listas.
  for (const [b, lista] of Object.entries(UTILES)) {
    for (const u of lista) assert.ok(INTERVALOS.includes(u.intervalo) && TRIADAS.some((t) => t.id === u.tipo), `${b} ${u.intervalo}`);
  }
});

test('audio: la base sola, todo junto y arpegiado', () => {
  const c = { bajo: 'C', base: 'dom' as IdBase, intervalo: '2', tipo: 'mayor' as TipoTriada };
  assert.equal(secuenciaSlash(c, 120, 'base').eventos.length, 3);
  const todo = secuenciaSlash(c, 120, 'todo');
  assert.equal(todo.eventos.length, 6);
  assert.equal(todo.duracion, 2);
  // La tríada va por encima de la base.
  const alturas = todo.eventos.map((e) => e.midi);
  assert.ok(Math.min(...alturas.slice(3)) > Math.max(...alturas.slice(0, 3)));
  assert.equal(secuenciaSlash(c, 120, 'arpegio').eventos.length, 6);
});
