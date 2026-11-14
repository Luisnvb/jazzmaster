import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { analizarSecuencia, modoProbable } from './armonia.ts';
import { VARIANTES, cambiados } from './blues.ts';
import { analizarProgresion } from './progresiones.ts';

const ps = parse(readFileSync(new URL('../data/progresiones.yaml', import.meta.url), 'utf8')) as { id: string; compases: string[] }[];
const compases = (id: string) => ps.find((p) => p.id === id)!.compases;
const papeles = (id: string) => {
  const acordes = analizarProgresion(compases(id)).flat();
  return analizarSecuencia(acordes, modoProbable(acordes)).map((x) => x.papel);
};

test('las variantes están en progresiones.yaml y tienen 12 compases', () => {
  for (const v of VARIANTES) {
    assert.ok(ps.some((p) => p.id === v.id), v.id);
    assert.equal(compases(v.id).length, 12, v.id);
  }
});

test('análisis de las variantes', () => {
  assert.deepEqual(papeles('blues-basico').slice(0, 4), ['V7/IV', 'IV7', 'I7', 'V7/IV']);
  // Bird blues: ii–V secundarios y los ii–V cromáticos de los compases 7 y 8.
  const bird = papeles('blues-bird');
  assert.deepEqual(bird.slice(0, 5), ['I', 'VIIø', 'V7/VI', 'VIm', 'V7/V']);
  assert.deepEqual(bird.slice(10, 15), ['IIIm', 'V7/II', 'bIIIm', 'V7/bII', 'IIm']);
  // Blues menor: bVI7 baja medio tono al V7.
  assert.ok(papeles('blues-menor').includes('subV7/V'));
});

test('ii–V sustituto', () => {
  const acordes = analizarProgresion(['bVIm7 bII7', 'Imaj7']).flat();
  const r = analizarSecuencia(acordes, 'mayor');
  assert.equal(r[0].funcion, 'SD');
  assert.match(r[0].nota, /sustituto hacia el I:/);
  assert.equal(r[1].papel, 'subV7');
});

test('acordes cambiados respecto a otra versión', () => {
  assert.deepEqual(cambiados('Vm7 I7', 'I7'), [true, false]);
  assert.deepEqual(cambiados('IV7', 'IV7'), [false]);
});
