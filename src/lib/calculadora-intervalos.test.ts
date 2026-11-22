import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRADOS_CALCULADORA, enarmonicos, intervaloDe, intervaloEntre, inversion, nombreIntervalo, notaA } from './calculadora-intervalos.ts';
import { semitonosGrado } from './teoria.ts';

const nombre = (a: string, b: string) => intervaloEntre(a, b).nombre;

test('nombre exacto según la escritura', () => {
  assert.equal(nombre('C', 'E'), '3ª mayor');
  assert.equal(nombre('C', 'Eb'), '3ª menor');
  assert.equal(nombre('C', 'D#'), '2ª aumentada');
  assert.equal(nombre('C', 'F'), '4ª justa');
  assert.equal(nombre('C', 'F#'), '4ª aumentada');
  assert.equal(nombre('C', 'Gb'), '5ª disminuida');
  assert.equal(nombre('C', 'E#'), '3ª aumentada');
  assert.equal(nombre('C', 'Bbb'), '7ª disminuida');
  assert.equal(nombre('B', 'C#'), '2ª mayor');
  assert.equal(nombre('E', 'C'), '6ª menor');
  assert.equal(nombre('C', 'C'), 'unísono');
  assert.equal(nombre('C', 'Cb'), '8ª disminuida');
  assert.equal(nombre('C', 'C#'), 'unísono aumentado');
  assert.equal(intervaloEntre('G', 'G', true).nombre, '8ª justa');
  assert.equal(nombre('C', 'B#'), '7ª aumentada');
});

test('grado y semitonos', () => {
  assert.deepEqual([intervaloEntre('D', 'C').grado, intervaloEntre('D', 'C').semitonos], ['b7', 10]);
  assert.equal(intervaloEntre('C', 'F#').grado, '#4');
  assert.equal(intervaloEntre('A', 'Gb').grado, 'bb7');
  assert.equal(intervaloDe(9, 13).nombre, '9ª menor');
  assert.equal(intervaloDe(11, 18).grado, '#11');
});

test('inversiones', () => {
  const inv = (a: string, b: string) => inversion(intervaloEntre(a, b)).nombre;
  assert.equal(inv('C', 'E'), '6ª menor');
  assert.equal(inv('C', 'F#'), '5ª disminuida');
  assert.equal(inv('C', 'C'), '8ª justa');
  assert.equal(inversion(intervaloDe(8, 12)).nombre, 'unísono');
  assert.equal(inversion(intervaloDe(9, 14)).nombre, '7ª menor');
});

test('la nota a un intervalo, hacia arriba y hacia abajo', () => {
  assert.equal(notaA('C', 'b3', 'arriba'), 'Eb');
  assert.equal(notaA('C', 'b3', 'abajo'), 'A');
  assert.equal(notaA('F#', '#4', 'arriba'), 'B#');
  assert.equal(notaA('Bb', '9', 'arriba'), 'C');
  assert.equal(notaA('E', 'b2', 'abajo'), 'D#');
});

test('enarmónicos e intervalos de la lista', () => {
  assert.deepEqual(enarmonicos(intervaloEntre('C', 'F#')).map((i) => i.nombre), ['5ª disminuida']);
  assert.deepEqual(enarmonicos(intervaloEntre('C', 'Eb')).map((i) => i.nombre), ['2ª aumentada']);
  // Cada grado de la lista da un intervalo con su mismo grado.
  for (const g of GRADOS_CALCULADORA) {
    const n = Number(g.replace(/[b#]/g, ''));
    assert.equal(intervaloDe(n, semitonosGrado(g)).grado, g);
  }
});

test('nombres en inglés', () => {
  const en = (a: string, b: string) => nombreIntervalo(intervaloEntre(a, b), 'en');
  assert.equal(en('C', 'E'), 'major 3rd');
  assert.equal(en('C', 'F#'), 'augmented 4th');
  assert.equal(en('C', 'Gb'), 'diminished 5th');
  assert.equal(en('C', 'C'), 'unison');
  assert.equal(en('C', 'C#'), 'augmented unison');
  assert.equal(nombreIntervalo(intervaloEntre('G', 'G', true), 'en'), 'perfect octave');
  assert.equal(nombreIntervalo(intervaloDe(9, 13), 'en'), 'minor 9th');
  assert.equal(nombreIntervalo(intervaloDe(11, 18), 'en'), 'augmented 11th');
  assert.equal(nombreIntervalo(intervaloDe(13, 21), 'en'), 'major 13th');
  assert.equal(nombreIntervalo(intervaloEntre('C', 'E'), 'es'), '3ª mayor');
});
