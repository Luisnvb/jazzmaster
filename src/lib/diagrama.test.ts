import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagramaSVG, trasteInicial } from './diagrama.ts';
import { analizarAcorde, compases, normalizar } from './cifrado.ts';

test('traste inicial', () => {
  assert.equal(trasteInicial(['x', 3, 5, 4, 5, 'x']), 3);
  assert.equal(trasteInicial(['x', 1, 3, 2, 3, 'x']), 1);
  assert.equal(trasteInicial([0, 2, 1, 1, 0, 0]), 1);
  assert.equal(trasteInicial([8, 'x', 8, 9, 8, 'x']), 8);
});

test('diagrama con traste inicial y grados', () => {
  const svg = diagramaSVG({ trastes: [8, 'x', 8, 9, 8, 'x'], grados: ['1', '', 'b7', '3', '5', ''] });
  assert.equal(svg.match(/<circle/g)?.length, 4);
  assert.equal(svg.match(/×/g)?.length, 2);
  assert.match(svg, />8<\/text>/);
  assert.doesNotMatch(svg, /cejuela/);
  assert.match(svg, /class="nota raiz"/);
});

test('diagrama con cejuela y cuerdas al aire', () => {
  const svg = diagramaSVG({ trastes: [0, 2, 2, 1, 0, 0], grados: ['1', '5', '1', '3', '5', '1'] });
  assert.match(svg, /cejuela/);
  assert.equal(svg.match(/al-aire/g)?.length, 3);
});

test('compases del cifrado', () => {
  assert.deepEqual(compases('Fmaj7 | Gm7 C7 | Am7 D7 | Gm7 C7'), [['Fmaj7'], ['Gm7', 'C7'], ['Am7', 'D7'], ['Gm7', 'C7']]);
  assert.deepEqual(compases('| Cm7 | F7 |'), [['Cm7'], ['F7']]);
  assert.deepEqual(compases('Cm7 | | F7'), [['Cm7'], [], ['F7']]);
  assert.deepEqual(compases(''), []);
});

test('normalizar', () => {
  assert.equal(normalizar('Jónico'), 'jonico');
  assert.equal(normalizar('Antônio'), 'antonio');
});

test('analizar acordes del cifrado', () => {
  const grupo = (s: string) => analizarAcorde(s)?.grupo ?? null;
  const casos: Record<string, string | null> = {
    Cmaj7: 'maj7', CΔ7: 'maj7', CM7: 'maj7', C6: 'maj7', C69: 'maj7', C: 'maj7', Cmaj9: 'maj7', 'Cmaj7#11': 'maj7',
    Dm7: 'm7', 'D-7': 'm7', Dm: 'm7', Dm6: 'm7', Dm9: 'm7', Dmin7: 'm7',
    CmMaj7: 'mmaj7', 'Cm(maj7)': 'mmaj7', 'C-Δ7': 'mmaj7', 'Cm^7': 'mmaj7',
    G7: 'dom7', G9: 'dom7', G13: 'dom7', G7sus4: 'dom7', Gsus: 'dom7', 'G7#11': 'dom7',
    G7alt: 'alt7', G7b9: 'alt7', 'G7#9': 'alt7', G7b13: 'alt7', 'G7#5': 'alt7', 'G+7': 'alt7', G13b9: 'alt7',
    Bm7b5: 'm7b5', 'Bø': 'm7b5', 'Bø7': 'm7b5', 'B-7b5': 'm7b5',
    'C°7': 'dim7', 'C°': 'dim7', Cdim7: 'dim7', Co7: 'dim7',
    Cxyz: null,
  };
  for (const [simbolo, esperado] of Object.entries(casos)) assert.equal(grupo(simbolo), esperado, simbolo);
  assert.deepEqual(analizarAcorde('F#m7b5/C'), { tonica: 'F#', grupo: 'm7b5' });
  assert.deepEqual(analizarAcorde('Ebmaj7'), { tonica: 'Eb', grupo: 'maj7' });
  assert.equal(analizarAcorde('N.C.'), null);
  assert.equal(analizarAcorde('%'), null);
});
