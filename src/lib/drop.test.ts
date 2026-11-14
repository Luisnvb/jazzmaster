import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { analizarProgresion, parseAcordeGrado } from './progresiones.ts';
import { AFINACION } from './secuencias.ts';
import { cuatroNotas, dropProgresion, escaleraInversiones, eventosDrop } from './drop.ts';

const N = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const notas = (t: (number | 'x')[]) => t.flatMap((f, c) => (f === 'x' ? [] : [N[(AFINACION[c] + f) % 12]]));

test('cuatro notas de cada acorde', () => {
  assert.deepEqual(cuatroNotas(['1', '3', '5', '7']), ['1', '3', '5', '7']);
  assert.deepEqual(cuatroNotas(['1', '3', '5']), ['1', '3', '5', '1']);
  assert.deepEqual(cuatroNotas(['1', '3', '5', 'b7', 'b9']), ['1', '3', 'b7', 'b9']);
  assert.deepEqual(cuatroNotas(['1', '3', 'b7', '#9', 'b13']), ['3', 'b7', '#9', 'b13']);
});

test('Cmaj7 en 4-3-2-1: las cuatro inversiones, de grave a agudo', () => {
  const inv = escaleraInversiones('C', parseAcordeGrado('Imaj7'), '4321');
  assert.equal(inv.length, 4);
  // La inversión la da el bajo: C G B E (x x 10 12 12 12) es la fundamental, con la 3 arriba;
  // G C E B (x x 5 5 5 7) es la 2ª inversión, con la 7 arriba.
  const f = inv.find((d) => d.inversion === 'Fundamental')!;
  assert.deepEqual(f.trastes, ['x', 'x', 10, 12, 12, 12]);
  assert.equal(f.arriba, '3');
  const s2 = inv.find((d) => d.inversion === '2ª inversión')!;
  assert.deepEqual(s2.trastes, ['x', 'x', 5, 5, 5, 7]);
  assert.equal(s2.arriba, '7');
  for (const d of inv) {
    assert.deepEqual(notas(d.trastes).sort(), ['B', 'C', 'E', 'G']);
    // Drop 2: entre la voz grave y la aguda hay más de una octava.
    const m = d.trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t]));
    assert.ok(m[3] - m[0] > 12);
  }
  assert.deepEqual(new Set(inv.map((d) => d.inversion)).size, 4);
});

test('progresiones en drop 2 en los tres grupos de cuerdas', () => {
  const ps = parse(readFileSync(new URL('../data/progresiones.yaml', import.meta.url), 'utf8')) as { compases: string[] }[];
  for (const p of ps) {
    for (const g of ['4321', '5432', '6543'] as const) {
      const v = dropProgresion('Bb', analizarProgresion(p.compases), g);
      for (const d of v) assert.equal(d.trastes.filter((t) => t !== 'x').length, 4);
    }
  }
  const c = analizarProgresion(['IIm7', 'V7', 'Imaj7']);
  const v = dropProgresion('C', c, '4321');
  // ii–V–I: la voz aguda se mueve poco (como mucho un tono entre acordes).
  const arriba = v.map((d) => AFINACION[5] + (d.trastes[5] as number));
  for (let i = 1; i < arriba.length; i++) assert.ok(Math.abs(arriba[i] - arriba[i - 1]) <= 2);
  assert.equal(eventosDrop(v, [4, 4, 4], 120).duracion, 6);
});

test('drop 3: la tercera voz desde arriba al bajo, con una cuerda saltada', () => {
  const inv = escaleraInversiones('C', parseAcordeGrado('Imaj7'), '6432');
  assert.equal(inv.length, 4);
  // Fundamental en 6-4-3-2: C B E G (8 x 9 9 8 x).
  const f = inv.find((d) => d.inversion === 'Fundamental')!;
  assert.deepEqual(f.trastes, [8, 'x', 9, 9, 8, 'x']);
  assert.equal(f.arriba, '5');
  for (const d of [...inv, ...escaleraInversiones('C', parseAcordeGrado('Im7b5'), '5321')]) {
    assert.equal(d.trastes.filter((t) => t !== 'x').length, 4);
  }
  // Progresión alternando los dos grupos de drop 3.
  const v = dropProgresion('C', analizarProgresion(['IIm7', 'V7', 'Imaj7']), ['6432', '5321']);
  assert.equal(v.length, 3);
});

test('drop 3 con la raíz en el bajo: alterna 5ª y 6ª cuerda en el ii–V–I', () => {
  const v = dropProgresion('C', analizarProgresion(['IIm7', 'V7', 'Imaj7']), ['6432', '5321'], 5, true);
  assert.deepEqual(v.map((d) => d.trastes.join('')), ['x5x565', '3x343x', 'x3x453']);
});
