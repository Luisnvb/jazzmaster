import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradosDeCalidad, leerCifrado, partesCifrado } from './cifrado-acorde.ts';

const g = (calidad: string) => gradosDeCalidad(calidad)?.join(' ') ?? null;

test('calidades habituales', () => {
  assert.equal(g(''), '1 3 5');
  assert.equal(g('m'), '1 b3 5');
  assert.equal(g('7'), '1 3 5 b7');
  assert.equal(g('maj7'), '1 3 5 7');
  assert.equal(g('Δ7'), '1 3 5 7');
  assert.equal(g('M7'), '1 3 5 7');
  assert.equal(g('m7'), '1 b3 5 b7');
  assert.equal(g('-7'), '1 b3 5 b7');
  assert.equal(g('m7b5'), '1 b3 b5 b7');
  assert.equal(g('ø'), '1 b3 b5 b7');
  assert.equal(g('°7'), '1 b3 b5 bb7');
  assert.equal(g('dim'), '1 b3 b5');
  assert.equal(g('+'), '1 3 #5');
  assert.equal(g('mMaj7'), '1 b3 5 7');
  assert.equal(g('m(maj7)'), '1 b3 5 7');
  assert.equal(g('6'), '1 3 5 6');
  assert.equal(g('m6'), '1 b3 5 6');
  assert.equal(g('6/9'), '1 3 5 6 9');
  assert.equal(g('5'), '1 5');
  assert.equal(g('sus4'), '1 4 5');
  assert.equal(g('7sus4'), '1 4 5 b7');
  assert.equal(g('sus2'), '1 2 5');
  assert.equal(g('add9'), '1 3 5 9');
});

test('extensiones y alteraciones', () => {
  assert.equal(g('9'), '1 3 5 b7 9');
  assert.equal(g('maj9'), '1 3 5 7 9');
  assert.equal(g('m11'), '1 b3 5 b7 9 11');
  assert.equal(g('13'), '1 3 5 b7 9 13');
  assert.equal(g('7b9'), '1 3 5 b7 b9');
  assert.equal(g('7(#9)'), '1 3 5 b7 #9');
  assert.equal(g('13(b9)'), '1 3 5 b7 13 b9');
  assert.equal(g('7(b9,#11)'), '1 3 5 b7 b9 #11');
  assert.equal(g('maj7#11'), '1 3 5 7 #11');
  assert.equal(g('7#5'), '1 3 #5 b7');
  assert.equal(g('7b5'), '1 3 b5 b7');
  assert.equal(g('7alt'), '1 3 b7 b9 #9 #11 b13');
  assert.equal(g('9sus4'), '1 4 5 b7 9');
  assert.equal(g('+7'), '1 3 #5 b7');
});

test('lo que no es un acorde', () => {
  assert.equal(g('xyz'), null);
  assert.equal(g('7hola'), null);
  assert.equal(leerCifrado('H7'), null);
  assert.equal(leerCifrado('Hola'), null);
});

test('cifrado completo: notas, bajo y 6/9', () => {
  assert.deepEqual(leerCifrado('Bb7(b9)')!.notas, ['Bb', 'D', 'F', 'Ab', 'Cb']);
  assert.deepEqual(leerCifrado('F#m7b5')!.notas, ['F#', 'A', 'C', 'E']);
  assert.deepEqual(leerCifrado('Am7/G')!.notas, ['A', 'C', 'E', 'G']);
  assert.deepEqual(leerCifrado('C/E')!, { raiz: 'C', bajo: 'E', calidad: '', grados: ['1', '3', '5'], notas: ['C', 'E', 'G'] });
  assert.deepEqual(leerCifrado('D/C')!.notas, ['C', 'D', 'F#', 'A']);
  assert.deepEqual(partesCifrado('C6/9'), { raiz: 'C', calidad: '6/9', bajo: null });
  assert.equal(leerCifrado('E♭maj7')!.raiz, 'Eb');
});
