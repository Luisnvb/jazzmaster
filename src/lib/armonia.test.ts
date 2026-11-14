import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { DIATONICOS, analizar, analizarSecuencia, modoProbable } from './armonia.ts';
import { analizarProgresion, parseAcordeGrado } from './progresiones.ts';

const a = (t: string, modo: 'mayor' | 'menor' = 'mayor') => analizar(parseAcordeGrado(t), modo);

test('diatónicos en mayor y menor', () => {
  assert.deepEqual(['Imaj7', 'IIm7', 'IIIm7', 'IVmaj7', 'V7', 'VIm7', 'VIIm7b5'].map((t) => a(t).funcion), ['T', 'SD', 'T', 'SD', 'D', 'T', 'D']);
  assert.deepEqual(['Im7', 'IIm7b5', 'bIIImaj7', 'IVm7', 'V7', 'bVImaj7', 'VII°7'].map((t) => a(t, 'menor').funcion), ['T', 'SD', 'T', 'SD', 'D', 'SD', 'D']);
  for (const modo of ['mayor', 'menor'] as const) {
    for (const [f, lista] of Object.entries(DIATONICOS[modo])) for (const t of lista) assert.equal(a(t, modo).funcion, f, `${t} en ${modo}`);
  }
});

test('acordes de fuera de la tonalidad', () => {
  assert.equal(a('VI7').papel, 'V7/II');
  assert.equal(a('III7').papel, 'V7/VI');
  assert.equal(a('II7').papel, 'V7/V');
  assert.equal(a('I7').papel, 'I7');
  assert.equal(a('bII7').papel, 'subV7');
  assert.equal(a('IVm7').papel, 'IVm');
  assert.equal(a('bVII7').funcion, 'SD');
  assert.equal(a('#IV°7').funcion, 'D');
  assert.equal(a('V7alt').papel, 'V7');
  assert.equal(a('I/3').papel, 'I/3');
  assert.equal(a('IVm/3').papel, 'IVm/3');
  // Según lo que venga después: I7 → IV es V7/IV; I7 solo, tónica de blues.
  const sec = analizarSecuencia(analizarProgresion(['Imaj7', 'I7', 'IVmaj7']).flat(), 'mayor');
  assert.deepEqual(sec.map((x) => x.papel), ['I', 'V7/IV', 'IV']);
  assert.equal(analizarSecuencia(analizarProgresion(['I7', 'V7']).flat(), 'mayor')[0].funcion, 'T');
});

test('todas las progresiones se analizan y el modo se adivina', () => {
  const ps = parse(readFileSync(new URL('../data/progresiones.yaml', import.meta.url), 'utf8')) as { id: string; compases: string[] }[];
  for (const p of ps) {
    const acordes = analizarProgresion(p.compases).flat();
    const modo = modoProbable(acordes);
    for (const x of acordes) assert.notEqual(analizar(x, modo).funcion, '?', `${p.id}: ${x.texto}`);
  }
  assert.equal(modoProbable(analizarProgresion(['IIm7b5', 'V7alt', 'Im6']).flat()), 'menor');
  assert.equal(modoProbable(analizarProgresion(['IIm7', 'V7', 'Imaj7']).flat()), 'mayor');
});
