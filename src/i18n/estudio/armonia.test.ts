import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizar, analizarSecuencia, type Modo } from '../../lib/armonia.ts';
import type { AcordeGrado } from '../../lib/progresiones.ts';
import { notaAnalisis } from './armonia.ts';

const GRADOS = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
const GRUPOS = ['maj7', 'm7', 'dom7', 'm7b5', 'dim7', 'aug'];
const MODOS: Modo[] = ['mayor', 'menor'];
const acorde = (grado: string, grupo: string): AcordeGrado => ({ texto: '', grado, sufijo: '', formula: [], grupo });
const todos = GRADOS.flatMap((g) => GRUPOS.map((x) => acorde(g, x)));

test('cada explicación del análisis tiene traducción al inglés', () => {
  const sinTraducir = new Set<string>();
  const comprobar = (nota: string) => {
    if (notaAnalisis(nota, 'en') === nota) sinTraducir.add(nota);
  };
  for (const modo of MODOS) {
    for (const a of todos) comprobar(analizar(a, modo).nota);
    // Secuencias de tres acordes: dominantes secundarios, subV, ii–V secundarios y cromáticos.
    const clave = todos.filter((a) => ['m7', 'dom7', 'm7b5'].includes(a.grupo));
    for (const a of clave) for (const b of clave) for (const c of clave) for (const r of analizarSecuencia([a, b, c], modo)) comprobar(r.nota);
  }
  assert.deepEqual([...sinTraducir], []);
});

test('en español la explicación no cambia', () => {
  assert.equal(notaAnalisis('Tónica: el reposo.', 'es'), 'Tónica: el reposo.');
  assert.equal(notaAnalisis('Dominante secundario: lleva al II.', 'en'), 'Secondary dominant: leads to II.');
});
