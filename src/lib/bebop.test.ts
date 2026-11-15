import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarProgresion } from './progresiones.ts';
import { ESCALAS_BEBOP, RECURSOS, gradosFuertes, lineaBebop, notasEscalaBebop, secuenciaBebop, type BloqueLinea } from './bebop.ts';

const PROGRESIONES: Record<string, string[]> = {
  'ii-v-i-mayor': ['IIm7', 'V7', 'Imaj7', 'Imaj7'],
  'ii-v-i-menor': ['IIm7b5', 'V7alt', 'Im6', 'Im6'],
  'ii-v-corto': ['IIm7 V7', 'Imaj7'],
  'blues-jazz': ['I7', 'IV7', 'I7', 'Vm7 I7', 'IV7', '#IV°7', 'I7', 'VI7alt', 'IIm7', 'V7', 'I7 VI7', 'IIm7 V7'],
  'rhythm-changes-a': ['Imaj7 VIm7', 'IIm7 V7', 'Imaj7 VIm7', 'IIm7 V7', 'Imaj7 I7', 'IVmaj7 #IV°7', 'IIIm7 VI7', 'IIm7 V7'],
  'blues-bird': ['Imaj7', 'VIIm7b5 III7b9', 'VIm7 II7', 'Vm7 I7', 'IV7', 'IVm7 bVII7', 'IIIm7 VI7', 'bIIIm7 bVI7', 'IIm7', 'V7', 'Imaj7 VI7', 'IIm7 V7'],
};

const linea = (id: string, recurso: (typeof RECURSOS)[number]['id'], tonica = 'C', semilla = 1) =>
  lineaBebop(tonica, analizarProgresion(PROGRESIONES[id]), 4, recurso, semilla);

const nombres = (b: BloqueLinea) => b.notas.map((n) => n.nota).join(' ');

test('escalas bebop: la nota de paso deja las notas del acorde en las posiciones pares', () => {
  const de = (id: string) => ESCALAS_BEBOP.find((e) => e.id === id)!;
  assert.equal(notasEscalaBebop('C', de('dominante')).map((n) => n.nota).join(' '), 'C D E F G A Bb B');
  assert.equal(notasEscalaBebop('C', de('mayor')).map((n) => n.nota).join(' '), 'C D E F G G# A B');
  assert.equal(notasEscalaBebop('C', de('menor')).map((n) => n.nota).join(' '), 'C D Eb F G A Bb B');
  assert.deepEqual(gradosFuertes(de('dominante')), ['1', '3', '5', 'b7']);
  assert.deepEqual(gradosFuertes(de('mayor')), ['1', '3', '5', '6']);
  assert.deepEqual(gradosFuertes(de('menor')), ['1', 'b3', '5', 'b7']);
  assert.deepEqual(gradosFuertes(de('semidisminuida')), ['1', 'b3', 'b5', 'b7']);
  assert.deepEqual(gradosFuertes(de('disminuida')), ['1', 'b3', 'b5', '6']);
});

test('cada acorde tiene tantas corcheas como pulsos × 2, y la línea no sale del registro', () => {
  for (const id of Object.keys(PROGRESIONES)) {
    for (const { id: r } of RECURSOS) {
      for (const tonica of ['C', 'F#', 'Bb', 'E']) {
        const bloques = linea(id, r, tonica);
        const compases = analizarProgresion(PROGRESIONES[id]);
        assert.equal(bloques.length, compases.flat().length, `${id} ${r}`);
        const total = bloques.reduce((s, b) => s + b.notas.length, 0);
        assert.equal(total, compases.length * 8, `${id} ${r} ${tonica}`);
        for (const b of bloques) for (const n of b.notas) assert.ok(n.midi >= 50 && n.midi <= 88, `${id} ${r} ${tonica}: ${n.nota} ${n.midi}`);
      }
    }
  }
});

test('escala y arpegio: una nota del acorde en cada tiempo', () => {
  for (const id of Object.keys(PROGRESIONES)) {
    for (const r of ['escala', 'arpegio'] as const) {
      for (const semilla of [1, 2, 3, 7, 42]) {
        for (const b of linea(id, r, 'Eb', semilla)) {
          b.notas.forEach((n, k) => {
            if (k % 2 === 0) assert.equal(n.tipo, 'acorde', `${id} ${r} ${b.simbolo} pos ${k}: ${n.nota} (${n.grado})`);
          });
        }
      }
    }
  }
});

test('encierros y mezcla: nota del acorde al empezar cada acorde y en los tiempos 1 y 3', () => {
  for (const id of Object.keys(PROGRESIONES)) {
    for (const r of ['encierros', 'mezcla'] as const) {
      for (const semilla of [1, 5, 9]) {
        for (const b of linea(id, r, 'G', semilla)) {
          b.notas.forEach((n, k) => {
            if (k === 0 || (b.inicio + k) % 4 === 0) assert.equal(n.tipo, 'acorde', `${id} ${r} ${b.simbolo} pos ${k}: ${n.nota}`);
          });
        }
      }
    }
  }
});

test('de la 3 a la 9: en el V7 que resuelve, b9 (B D F Ab sobre G7)', () => {
  const [dm, g7] = linea('ii-v-i-mayor', 'arpegio');
  assert.deepEqual(dm.notas.slice(0, 4).map((n) => n.nota), ['F', 'A', 'C', 'E']);
  assert.deepEqual(g7.notas.slice(0, 4).map((n) => `${n.nota}:${n.grado}`), ['B:3', 'D:5', 'F:b7', 'Ab:b9']);
  // Después, la raíz y la escala bebop bajando: G F# F E.
  assert.deepEqual(g7.notas.slice(4).map((n) => n.nota), ['G', 'F#', 'F', 'E']);
  assert.deepEqual(g7.notas.map((n) => n.tipo), ['acorde', 'acorde', 'acorde', 'tension', 'acorde', 'escala', 'acorde', 'escala']);
});

test('encierros: las dos corcheas antes de cada objetivo lo encierran (escala arriba, medio tono abajo)', () => {
  const bloques = linea('ii-v-i-mayor', 'encierros');
  const todas = bloques.flatMap((b) => b.notas);
  for (let k = 4; k < todas.length; k += 4) {
    const [a, c, obj] = [todas[k - 2], todas[k - 1], todas[k]];
    assert.equal(obj.midi - c.midi, 1, `cromática abajo antes de ${obj.nota}`);
    assert.ok(a.midi > obj.midi && a.midi - obj.midi <= 2, `escala arriba antes de ${obj.nota}`);
  }
});

test('la misma semilla da la misma línea', () => {
  assert.deepEqual(linea('blues-jazz', 'mezcla', 'F', 11).map(nombres), linea('blues-jazz', 'mezcla', 'F', 11).map(nombres));
});

test('audio: corcheas con swing y acorde de fondo', () => {
  const bloques = linea('ii-v-corto', 'escala');
  const { eventos, notas, duracion } = secuenciaBebop(bloques, 'C', 120, { swing: 2 / 3, acorde: true });
  assert.equal(notas.length, 16);
  assert.equal(duracion, 4); // 2 compases de 4/4 a 120
  // La corchea larga dura 2/3 del pulso (0,5 s): la segunda nota empieza en 1/3 s.
  assert.ok(Math.abs(notas[1].inicio - 1 / 3) < 1e-9);
  assert.ok(Math.abs(notas[2].inicio - 0.5) < 1e-9);
  // Fondo: bajo y dos notas guía por acorde (3 acordes).
  assert.equal(eventos.length, 16 + 3 * 3);
});
