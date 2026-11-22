import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CIRCULO, armadura, circuloSVG, diatonicos, escala, indiceDe, nombreTonalidad, secundarios, sustitutoTritonal, textoArmadura, vecinas } from './circulo.ts';

const de = (mayor: string) => CIRCULO.find((t) => t.mayor === mayor)!;

test('el círculo: quintas, relativas y armaduras', () => {
  assert.deepEqual(
    CIRCULO.map((t) => t.mayor),
    ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'],
  );
  assert.deepEqual(
    CIRCULO.map((t) => t.menor),
    ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D'],
  );
  assert.deepEqual(de('F#').enarmonica, { mayor: 'Gb', menor: 'Eb', alteraciones: -6 });
  assert.deepEqual(armadura(3), ['F#', 'C#', 'G#']);
  assert.deepEqual(armadura(-2), ['Bb', 'Eb']);
  assert.equal(textoArmadura(-4), '4♭');
  assert.equal(textoArmadura(0), 'sin alteraciones');
});

test('la armadura coincide con las notas alteradas de la escala', () => {
  for (const t of CIRCULO) {
    const alteradas = escala(t, 'mayor').filter((n) => n.length > 1);
    assert.deepEqual([...alteradas].sort(), [...armadura(t.alteraciones)].sort(), t.mayor);
  }
});

test('acordes diatónicos, secundarios y tritono', () => {
  assert.deepEqual(
    diatonicos(de('Bb'), 'mayor').map((a) => a.simbolo),
    ['Bbmaj7', 'Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5'],
  );
  assert.deepEqual(
    diatonicos(de('C'), 'menor').map((a) => a.simbolo),
    ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'E7', 'Fmaj7', 'G7'],
  );
  const s = secundarios(de('C'), 'mayor');
  assert.deepEqual(s[0], { acorde: { grado: 'VI7', simbolo: 'A7' }, destino: { grado: 'IIm7', simbolo: 'Dm7' } });
  assert.equal(sustitutoTritonal(de('C'), 'mayor').simbolo, 'Db7');
});

test('vecinas e índices', () => {
  const v = vecinas(0);
  assert.equal(v.subdominante.mayor, 'F');
  assert.equal(v.dominante.mayor, 'G');
  assert.equal(indiceDe('Gb', 'mayor'), 6);
  assert.equal(indiceDe('Eb', 'menor'), 6);
  assert.equal(indiceDe('C', 'menor'), 9);
  assert.equal(indiceDe('H', 'mayor'), -1);
});

test('el dibujo marca la tonalidad elegida y sus vecinas', () => {
  const svg = circuloSVG({ indice: 2, modo: 'mayor' });
  assert.equal((svg.match(/class="sector [a-z]+ elegido"/g) ?? []).length, 1);
  assert.match(svg, /class="sector mayor elegido" data-indice="2"/);
  assert.match(svg, /class="sector mayor vecino" data-indice="1"/);
  assert.equal((svg.match(/data-indice=/g) ?? []).length, 24);
});

test('en inglés', () => {
  assert.equal(nombreTonalidad(CIRCULO[2], 'mayor', 'en'), 'D major');
  assert.equal(nombreTonalidad(CIRCULO[2], 'menor', 'en'), 'B minor');
  assert.equal(textoArmadura(0, 'en'), 'no sharps or flats');
  assert.match(circuloSVG({ indice: 6, modo: 'mayor' }, 'en'), /aria-label="F# major \(or Gb major\), 6♯"/);
});
