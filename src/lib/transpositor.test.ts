import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectarTono,
  esLineaDeAcordes,
  transponerAcorde,
  transponerNota,
  transponerTexto,
  transporteEntreTonos,
  transporteInstrumento,
  transporteSemitonos,
} from './transpositor.ts';

test('de tono a tono, con la ortografía del tono nuevo', () => {
  const t = transporteEntreTonos('Bb', 'D');
  assert.equal(t.grado, '3');
  assert.equal(transponerAcorde('Ebmaj7', t), 'Gmaj7');
  assert.equal(transponerAcorde('Cm7', t), 'Em7');
  assert.equal(transponerAcorde('F7(b9)', t), 'A7(b9)');
  const aEb = transporteEntreTonos('C', 'Eb');
  assert.equal(transponerAcorde('F#m7b5', aEb), 'Am7b5');
  assert.equal(transponerAcorde('Am7/G', aEb), 'Cm7/Bb');
  assert.equal(transponerAcorde('C6/9', aEb), 'Eb6/9');
});

test('sin notas raras: E#, B#, Fb, Cb y dobles alteraciones se reescriben', () => {
  const t = transporteEntreTonos('C', 'F#');
  assert.equal(transponerNota('B', t), 'F'); // E# → F
  assert.equal(transponerNota('Bb', t), 'E');
  assert.equal(transponerNota('Db', transporteEntreTonos('C', 'Gb')), 'G'); // Abb → G
  assert.equal(transponerNota('A', transporteEntreTonos('C', 'Db'), 'sostenidos'), 'A#');
  assert.equal(transponerNota('A', transporteEntreTonos('C', 'C#'), 'bemoles'), 'Bb');
});

test('instrumentos transpositores', () => {
  // Sonido real Bbmaj7 → para trompeta (Bb) se escribe Cmaj7; para alto (Eb), Gmaj7.
  assert.equal(transponerAcorde('Bbmaj7', transporteInstrumento('2', true)), 'Cmaj7');
  assert.equal(transponerAcorde('Bbmaj7', transporteInstrumento('6', true)), 'Gmaj7');
  assert.equal(transponerAcorde('Gmaj7', transporteInstrumento('6', false)), 'Bbmaj7');
  assert.equal(transponerAcorde('C7', transporteInstrumento('5', true)), 'G7');
});

test('por semitonos', () => {
  assert.equal(transponerAcorde('C7', transporteSemitonos(1)), 'Db7');
  assert.equal(transponerAcorde('C7', transporteSemitonos(-2)), 'Bb7');
  assert.equal(transponerAcorde('C7', transporteSemitonos(12)), 'C7');
});

test('líneas de acordes y líneas de letra', () => {
  assert.ok(esLineaDeAcordes('| Dm7 G7 | Cmaj7 % |'));
  assert.ok(esLineaDeAcordes('Am7      D7       Gmaj7'));
  assert.ok(!esLineaDeAcordes('Fly me to the moon'));
  assert.ok(!esLineaDeAcordes('A day in the life'));
  assert.ok(!esLineaDeAcordes(''));
  const hoja = 'Am7      D7\nFly me to the moon\n| Dm7 G7 | Cmaj7 |';
  assert.equal(transponerTexto(hoja, transporteEntreTonos('C', 'F')), 'Dm7      G7\nFly me to the moon\n| Gm7 C7 | Fmaj7 |');
});

test('el tono probable: el último acorde', () => {
  assert.deepEqual(detectarTono('Dm7 G7 | Cmaj7'), { tonica: 'C', menor: false });
  assert.deepEqual(detectarTono('Bm7b5 E7 | Am6\nletra de la canción'), { tonica: 'A', menor: true });
  assert.equal(detectarTono('solo letra'), null);
});
