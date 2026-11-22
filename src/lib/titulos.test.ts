import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esCifrado, marcarCifrado } from './titulos.ts';

test('qué palabras son cifrado', () => {
  for (const p of ['Cmaj7', 'Dm7', 'm7b5', 'ii–V', 'Bb', 'F#m', 'b9', 'iii']) assert.ok(esCifrado(p), p);
  for (const p of ['Drop', 'MAJ7', 'Ritmo', 'Today&#39;s', 'Rock&amp;roll', 'C']) assert.ok(!esCifrado(p), p);
});

test('marca el cifrado sin romper las entidades ni las etiquetas', () => {
  assert.equal(marcarCifrado('Cmaj7 y Dm7'), '<span class="cifra">Cmaj7</span> y <span class="cifra">Dm7</span>');
  assert.equal(marcarCifrado('Today&#39;s material'), 'Today&#39;s material');
  assert.equal(marcarCifrado('<em>ii–V</em> &amp; Bb'), '<em><span class="cifra">ii–V</span></em> &amp; <span class="cifra">Bb</span>');
});
