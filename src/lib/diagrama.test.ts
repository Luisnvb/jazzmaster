import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagramaSVG, trasteInicial } from './diagrama.ts';
import { compases, normalizar } from './cifrado.ts';

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
