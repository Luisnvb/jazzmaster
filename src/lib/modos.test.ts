import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MADRES, eventosModo, modosEn } from './modos.ts';
import { semitonosGrado } from './teoria.ts';

const mod = (n: number) => ((n % 12) + 12) % 12;

test('cada modo es la escala madre empezando en su grado', () => {
  for (const madre of MADRES) {
    const semMadre = madre.formula.map((g) => semitonosGrado(g));
    madre.modos.forEach((m, k) => {
      const esperado = semMadre.map((_, i) => mod(semMadre[(k + i) % 7] - semMadre[k]));
      assert.deepEqual(m.formula.map((g) => mod(semitonosGrado(g))), esperado, `${madre.nombre}: ${m.nombre}`);
      for (const c of m.caracteristicas) assert.ok(m.formula.includes(c), `${m.nombre}: ${c}`);
    });
  }
});

test('relativos: mismas notas; paralelos: misma tónica', () => {
  const mayor = MADRES[0];
  const rel = modosEn(mayor, 'C', 'relativa');
  assert.deepEqual(rel.map((m) => m.tonica), ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  for (const m of rel) assert.deepEqual([...m.notas].sort(), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  const par = modosEn(mayor, 'D', 'paralela');
  assert.deepEqual(par.map((m) => m.nombre), ['Lidio', 'Jónico', 'Mixolidio', 'Dórico', 'Eólico', 'Frigio', 'Locrio']);
  assert.ok(par.every((m) => m.tonica === 'D'));
  assert.deepEqual(par[0].notas, ['D', 'E', 'F#', 'G#', 'A', 'B', 'C#']);
  // Menor melódica en La: el 7º modo es G# superlocrio.
  const alt = modosEn(MADRES[1], 'A', 'relativa')[6];
  assert.equal(alt.tonica, 'G#');
  const { eventos } = eventosModo(par[0], 120);
  assert.equal(eventos.length, 16);
});
