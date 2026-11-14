import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMULA_TRIADA, PARES, letrasTriada, lineaPar, nombreTriada, notasPar } from './pares-triadas.ts';
import { semitonosGrado } from './teoria.ts';

const pc = (g: string) => ((semitonosGrado(g) % 12) + 12) % 12;

test('cada par: dos tríadas bien formadas y sin notas comunes', () => {
  for (const p of PARES) {
    for (const t of [p.a, p.b]) {
      // Los grados de la tríada respecto al acorde coinciden con su fórmula desde su raíz.
      const esperado = FORMULA_TRIADA[t.tipo].map((g) => (pc(t.grado) + pc(g)) % 12);
      assert.deepEqual(t.notas.map(pc), esperado, `${p.id}: ${t.grado}${t.tipo}`);
    }
    const a = new Set(p.a.notas.map(pc));
    assert.ok(p.b.notas.every((g) => !a.has(pc(g))), `${p.id}: notas comunes`);
  }
});

test('nombres y letras con ortografía de la tríada', () => {
  const alt = PARES.find((p) => p.id === 'alterado')!;
  assert.equal(nombreTriada('C', alt.a), 'Gb');
  assert.deepEqual(letrasTriada('C', alt.b), ['Ab', 'C', 'Eb']);
  const lidio = PARES.find((p) => p.id === 'lidio')!;
  assert.deepEqual(letrasTriada('C', lidio.a), ['D', 'F#', 'A']);
});

test('línea alternada en una posición', () => {
  const p = PARES.find((x) => x.id === 'lidio')!;
  const n = notasPar('C', p);
  assert.equal(new Set(n.map((x) => x.midi % 12)).size, 6);
  const linea = lineaPar(n, { tipo: 'posicion', desde: 7 });
  assert.ok(linea.length >= 12 && linea.length % 3 === 0);
  // Grupos de tres de la misma tríada, alternando A y B.
  for (let k = 0; k < 4; k++) {
    const g = linea.slice(k * 3, k * 3 + 3);
    assert.ok(g.every((x) => x.triada === (k % 2 === 0 ? 'a' : 'b')));
    assert.ok(g[0].midi < g[1].midi && g[1].midi < g[2].midi);
  }
  // Acaba en el primer grupo, de bajada.
  assert.equal(linea.at(-1)!.midi, linea[0].midi);
  const alterna = lineaPar(n, { tipo: 'posicion', desde: 7 }, 'alterna');
  assert.ok(alterna[3].midi > alterna[4].midi);
});
