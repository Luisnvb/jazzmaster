import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { analizarProgresion } from './progresiones.ts';
import {
  TECNICAS,
  cadenaDominantes,
  disminuidosDePaso,
  dominantesSecundarios,
  iiVSecundarios,
  intercambioModal,
  rearmonizar,
  sustitucionDiatonica,
  sustitucionTritonal,
} from './rearmonizacion.ts';

test('cada técnica', () => {
  assert.deepEqual(sustitucionDiatonica(['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7']), ['Imaj7', 'VIm7', 'IVmaj7', 'IIm7']);
  assert.deepEqual(intercambioModal(['Imaj7', 'IVmaj7', 'IIm7', 'V7']), ['Imaj7', 'IVm7', 'IIm7b5', 'V7']);
  assert.deepEqual(cadenaDominantes(['IIIm7', 'VIm7', 'IIm7', 'V7', 'Imaj7']), ['III7', 'VI7', 'II7', 'V7', 'Imaj7']);
  assert.deepEqual(dominantesSecundarios(['Imaj7', 'IIm7', 'V7', 'Imaj7']), ['Imaj7 VI7', 'IIm7 II7', 'V7', 'Imaj7']);
  assert.deepEqual(sustitucionTritonal(['IIm7', 'V7', 'Imaj7']), ['IIm7', 'bII7', 'Imaj7']);
  assert.deepEqual(disminuidosDePaso(['Imaj7', 'IIm7', 'V7', 'Imaj7']), ['Imaj7 #I°7', 'IIm7', 'V7', 'Imaj7']);
});

test('ii–V secundario hacia el IV y hacia un acorde menor', () => {
  assert.equal(iiVSecundarios(['Imaj7', 'IVmaj7'])[0], 'Imaj7 Imaj7 Vm7 I7');
  assert.equal(iiVSecundarios(['Imaj7', 'IIm7'])[0], 'Imaj7 Imaj7 IIIm7b5 VI7');
});

test('combinadas: todas las progresiones siguen siendo válidas', () => {
  const ps = parse(readFileSync(new URL('../data/progresiones.yaml', import.meta.url), 'utf8')) as { compases: string[] }[];
  const todas = TECNICAS.map((t) => t.id);
  for (const p of ps) {
    for (const ids of [todas, ['tritonal'], ['ii-v', 'tritonal'], ['diatonica', 'modal', 'disminuidos']]) {
      const r = rearmonizar(p.compases, ids);
      assert.equal(r.length, p.compases.length);
      assert.doesNotThrow(() => analizarProgresion(r));
    }
  }
  // Cadena de dominantes y sustitución tritonal: III7 VI7 II7 V7 → bVII7 bIII7 bVI7 bII7.
  assert.deepEqual(rearmonizar(['IIIm7', 'VIm7', 'IIm7', 'V7', 'Imaj7'], ['cadena', 'tritonal']), ['bVII7', 'bIII7', 'bVI7', 'bII7', 'Imaj7']);
});
