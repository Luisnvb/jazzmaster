import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { etiquetaGrupo, gruposDelPatron, notaDePaso, parsePaso, secuenciaPatron, type Patron } from './patrones.ts';

const JONICO = ['1', '2', '3', '4', '5', '6', '7'];
const MAJ7 = ['1', '3', '5', '7'];

test('pasos con aproximación cromática', () => {
  assert.deepEqual(parsePaso(2), { indice: 2, cromatico: 0 });
  assert.deepEqual(parsePaso('0-'), { indice: 0, cromatico: -1 });
  assert.deepEqual(parsePaso('1+'), { indice: 1, cromatico: 1 });
  assert.throws(() => parsePaso('x'), /no válido/);
});

test('grupos de 3 sobre una escala: sube y baja', () => {
  const p: Patron = { id: 'g3', nombre: 'Grupos de 3', sobre: 'escala', celula: [0, 1, 2] };
  const grupos = gruposDelPatron(p, 7);
  assert.equal(grupos.length, 16);
  assert.equal(etiquetaGrupo(JONICO, grupos[0]), '1-2-3');
  assert.equal(etiquetaGrupo(JONICO, grupos[1]), '2-3-4');
  // Bajando, la célula se invierte: desde la octava, 1-7-6.
  assert.equal(etiquetaGrupo(JONICO, grupos[8]), '1-7-6');
  assert.deepEqual(
    grupos[0].map((paso) => notaDePaso('F', JONICO, paso)),
    ['F', 'G', 'A'],
  );
});

test('arpegio por inversiones y cromatismos con ortografía', () => {
  const inv = gruposDelPatron({ id: 'i', nombre: 'i', sobre: 'arpegio', celula: [0, 1, 2, 3], idaYVuelta: false }, 4);
  assert.deepEqual(
    inv.map((g) => g.map((paso) => notaDePaso('C', MAJ7, paso)).join(' ')),
    ['C E G B', 'E G B C', 'G B C E', 'B C E G', 'C E G B'],
  );
  const crom = gruposDelPatron({ id: 'c', nombre: 'c', sobre: 'arpegio', celula: ['0-', 0], idaYVuelta: false }, 4);
  assert.deepEqual(
    crom[1].map((paso) => notaDePaso('C', MAJ7, paso)),
    ['D#', 'E'],
  );
  assert.equal(etiquetaGrupo(MAJ7, crom[1]), '↓3-3');
});

test('secuencia en corcheas, dentro del rango y con un tramo por grupo', () => {
  const grupos = gruposDelPatron({ id: 't', nombre: 't', sobre: 'escala', celula: [0, 2] }, 7);
  const { eventos, tramos } = secuenciaPatron('C', JONICO, grupos, 120);
  assert.equal(eventos.length, grupos.length * 2);
  assert.equal(eventos[1].inicio, 0.25);
  assert.equal(tramos.length, grupos.length);
  assert.equal(tramos[1].inicio, 0.5);
  assert.ok(eventos.every((e) => e.midi >= 40 && e.midi <= 88));
  // 1-3 en C: C3 y E3.
  assert.deepEqual([eventos[0].midi, eventos[1].midi], [48, 52]);
});

test('los patrones del repositorio son válidos', () => {
  const datos = parse(readFileSync(new URL('../data/patrones.yaml', import.meta.url), 'utf8')) as Patron[];
  assert.ok(datos.length >= 8);
  for (const p of datos) assert.doesNotThrow(() => gruposDelPatron(p, 7), p.id);
});
