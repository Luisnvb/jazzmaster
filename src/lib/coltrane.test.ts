import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { analizarProgresion } from './progresiones.ts';
import { centros, centrosDistintos, cicloSVG, guiaSencilla, salto, simboloSencillo } from './coltrane.ts';

const ps = parse(readFileSync(new URL('../data/progresiones.yaml', import.meta.url), 'utf8')) as { id: string; compases: string[] }[];
const prog = (id: string) => analizarProgresion(ps.find((p) => p.id === id)!.compases);

test('Giant Steps en B (el original): cifrados con grafía sencilla', () => {
  const simbolos = prog('giant-steps').flat().map((a) => simboloSencillo('B', a));
  assert.deepEqual(simbolos.slice(0, 9), ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Am7', 'D7', 'Gmaj7', 'Bb7']);
  assert.ok(simbolos.includes('Fm7') && simbolos.includes('C#m7') && simbolos.includes('F#7'));
  assert.ok(!simbolos.some((s) => /^(A#|D#|E#|B#|Cb|Fb)/.test(s)), simbolos.join(' '));
});

test('tres centros a distancia de 3ª mayor', () => {
  for (const id of ['coltrane-ciclo', 'coltrane-ii-v', 'giant-steps']) {
    for (const tonica of ['C', 'B', 'Eb', 'F#']) {
      const c = centros(tonica, prog(id));
      // El último IIm7 V7 de Giant Steps vuelve al principio, y el V7 final del ciclo al I: tres centros en todos.
      const distintos = centrosDistintos(c);
      assert.equal(distintos.length, 3, `${id} ${tonica}: ${distintos}`);
      // Siempre el mismo salto de 3ª mayor (Coltrane baja: B → G → Eb son 8 semitonos hacia arriba cada vez).
      const intervalos = distintos.map((pc, i) => (distintos[(i + 1) % 3] - pc + 12) % 12);
      assert.ok(intervalos.every((x) => x === intervalos[0]) && [4, 8].includes(intervalos[0]), `${id} ${tonica}: ${intervalos}`);
    }
  }
  const gs = centros('B', prog('giant-steps'));
  assert.deepEqual(gs.slice(0, 5).map((c) => `${c.papel} de ${c.nombre}`), ['Imaj7 de B', 'V7 de G', 'Imaj7 de G', 'V7 de Eb', 'Imaj7 de Eb']);
  assert.equal(salto(11, 7), 'baja una 3ª mayor');
  assert.equal(salto(11, 7, 'en'), 'down a major 3rd');
});

test('notas guía con nombres sencillos y movimiento corto', () => {
  const g = guiaSencilla('B', prog('giant-steps'));
  assert.equal(g[3].simbolo, 'Bb7');
  // Las notas guía de Bb7: D y Ab; las de Bmaj7, D# y A# (no Eb y Bb: es B mayor).
  assert.deepEqual(g[3].voces.map((v) => v.nota).sort(), ['Ab', 'D']);
  assert.deepEqual(g[0].voces.map((v) => v.nota).sort(), ['A#', 'D#']);
  // Cada voz se mueve como mucho una 3ª mayor (las líneas guía de Coltrane cambian rápido, pero sin saltos grandes).
  for (const x of g.slice(1)) for (const v of x.voces) assert.ok(Math.abs(v.paso!) <= 4, `${x.simbolo}: ${v.paso}`);
});

test('ciclo de quintas: los centros marcados y el triángulo', () => {
  const svg = cicloSVG([11, 7, 3], 7);
  assert.equal((svg.match(/class="tono centro"/g) ?? []).length, 2);
  assert.equal((svg.match(/class="tono activo"/g) ?? []).length, 1);
  assert.match(svg, /<polygon class="triangulo"/);
});
