import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alternarTraste, buscarAcordes, buscarEnMastil, gradosDeTrastes, leerNota, leerNotas, midisAcorde, nombrarIntervalo, notasDeTrastes, sinTrastes, trastesValidos } from './buscador-acordes.ts';
import { formatNota } from './teoria.ts';

const mejor = (texto: string) => buscarAcordes(leerNotas(texto).notas)[0]?.simbolo;
const todos = (texto: string) => buscarAcordes(leerNotas(texto).notas).map((c) => c.simbolo);

test('lee notas en cifrado americano y latino, con cualquier alteración', () => {
  assert.equal(formatNota(leerNota('c')!), 'C');
  assert.equal(formatNota(leerNota('eb')!), 'Eb');
  assert.equal(formatNota(leerNota('F♯')!), 'F#');
  assert.equal(formatNota(leerNota('Sol')!), 'G');
  assert.equal(formatNota(leerNota('sib')!), 'Bb');
  assert.equal(formatNota(leerNota('Re#')!), 'D#');
  assert.equal(leerNota('H'), null);
  assert.equal(leerNota('Cmaj7'), null);
});

test('separa, quita sonidos repetidos y avisa de lo que no entiende', () => {
  assert.deepEqual(leerNotas('C, E - G  Bb; c'), { notas: ['C', 'E', 'G', 'Bb'], errores: [] });
  assert.deepEqual(leerNotas('C Db C#'), { notas: ['C', 'Db'], errores: [] });
  assert.deepEqual(leerNotas('C X E'), { notas: ['C', 'E'], errores: ['X'] });
});

test('acordes habituales en posición fundamental', () => {
  assert.equal(mejor('C E G'), 'C');
  assert.equal(mejor('C Eb G'), 'Cm');
  assert.equal(mejor('C E G B'), 'Cmaj7');
  assert.equal(mejor('C E G Bb'), 'C7');
  assert.equal(mejor('D F A C'), 'Dm7');
  assert.equal(mejor('B D F A'), 'Bm7b5');
  assert.equal(mejor('C Eb Gb A'), 'C°7');
  assert.equal(mejor('C E G Bb D'), 'C9');
  assert.equal(mejor('do mi sol la'), 'C6');
  assert.equal(mejor('C F G Bb'), 'C7sus4');
});

test('el bajo decide: la misma colección con otra nota abajo', () => {
  assert.equal(mejor('A C E G'), 'Am7');
  assert.equal(mejor('C A E G'), 'C6');
  assert.ok(todos('C A E G').includes('Am7/C'));
  assert.equal(mejor('E C G'), 'C/E');
  assert.equal(mejor('G C E'), 'C/G');
});

test('voicings de jazz sin raíz o con tensiones', () => {
  assert.equal(mejor('C E Bb D A'), 'C13');
  assert.equal(mejor('C E Bb Eb'), 'C7(#9)');
});

test('menos de tres sonidos: sin acorde; con dos, el intervalo', () => {
  assert.deepEqual(buscarAcordes(['C', 'G']), []);
  assert.equal(nombrarIntervalo('C', 'G'), '5ª justa');
  assert.equal(nombrarIntervalo('E', 'C'), '6ª menor');
});

test('cada nota con su grado sobre la raíz', () => {
  const [c] = buscarAcordes(['E', 'C', 'G']);
  assert.deepEqual(c.notas, [
    { nota: 'E', grado: '3' },
    { nota: 'C', grado: '1' },
    { nota: 'G', grado: '5' },
  ]);
});

test('audio: el bajo abajo y el resto subiendo en el orden escrito', () => {
  assert.deepEqual(midisAcorde(['C', 'E', 'G', 'Bb']), [48, 52, 55, 58]);
  assert.deepEqual(midisAcorde(['E', 'C', 'G']), [40, 60, 67]);
  const m = midisAcorde(['A', 'C', 'E', 'G']);
  assert.ok(m.every((x, i) => i === 0 || x > m[i - 1]));
});

test('mástil: un traste por cuerda, y pulsar el mismo lo quita', () => {
  let t = sinTrastes();
  t = alternarTraste(t, 1, 3);
  assert.deepEqual(t, ['x', 3, 'x', 'x', 'x', 'x']);
  t = alternarTraste(t, 1, 5);
  assert.deepEqual(t, ['x', 5, 'x', 'x', 'x', 'x']);
  assert.deepEqual(alternarTraste(t, 1, 5), sinTrastes());
  assert.deepEqual(trastesValidos([0, 'a', 3, 30, -1, 2]), [0, 'x', 3, 'x', 'x', 2]);
  assert.deepEqual(trastesValidos('nada'), sinTrastes());
});

test('mástil: notas de grave a agudo y el acorde que forman', () => {
  // C maj7 en la 5ª cuerda: x 3 5 4 5 x
  const { midis, notas } = notasDeTrastes(['x', 3, 5, 4, 5, 'x']);
  assert.deepEqual(midis, [48, 55, 59, 64]);
  assert.deepEqual(notas, ['C', 'G', 'B', 'E']);
  assert.equal(buscarAcordes(notas)[0].simbolo, 'Cmaj7');
  // Mi mayor al aire: 0 2 2 1 0 0 (E repetido no cuenta dos veces)
  assert.deepEqual(notasDeTrastes([0, 2, 2, 1, 0, 0]).notas, ['E', 'B', 'Ab']);
  // …pero se escribe según el acorde: la 3 de E es G#.
  const e = buscarEnMastil([0, 2, 2, 1, 0, 0]);
  assert.deepEqual(e.notas, ['E', 'B', 'G#']);
  assert.equal(e.candidatos[0].simbolo, 'E');
  assert.deepEqual(gradosDeTrastes([0, 2, 2, 1, 0, 0], e.candidatos[0]), ['1', '5', '1', '3', '5', '1']);
  // D7/F#: 2 x 0 2 1 2
  assert.equal(buscarEnMastil([2, 'x', 0, 2, 1, 2]).candidatos[0].simbolo, 'D7/F#');
});
