import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drop2, gradosDelCiclo, secuenciaCiclo } from './ciclos.ts';

test('recorrido de cada ciclo, del I al I', () => {
  assert.deepEqual(gradosDelCiclo(2), [0, 1, 2, 3, 4, 5, 6, 0]);
  assert.deepEqual(gradosDelCiclo(4), [0, 3, 6, 2, 5, 1, 4, 0]);
  assert.deepEqual(gradosDelCiclo(5), [0, 4, 1, 5, 2, 6, 3, 0]);
  assert.deepEqual(secuenciaCiclo('C', 4, 'cuatriadas').map((a) => a.simbolo), ['Cmaj7', 'Fmaj7', 'Bm7b5', 'Em7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
  assert.deepEqual(secuenciaCiclo('Bb', 3, 'triadas').map((a) => a.romano), ['I', 'IIIm', 'V', 'VII°', 'IIm', 'IV', 'VIm', 'I']);
});

test('conducción de voces: cada acorde con sus notas y moviéndose poco', () => {
  for (const ciclo of [2, 3, 4, 5, 6, 7] as const) {
    const s = secuenciaCiclo('C', ciclo, 'cuatriadas');
    for (const a of s) assert.equal(new Set(a.voces.map((m) => m % 12)).size, 4, `${a.simbolo} con 4 notas distintas`);
    for (let i = 1; i < s.length; i++) {
      // Ninguna voz salta más de una tercera mayor.
      s[i].voces.forEach((m, k) => assert.ok(Math.abs(m - s[i - 1].voces[k]) <= 4, `ciclo ${ciclo}: ${s[i - 1].simbolo} → ${s[i].simbolo}`));
    }
  }
  // Ciclo 4 en cuatriadas: dos notas comunes y dos que bajan por grado (Dm7 → G7: D y F se quedan).
  const c4 = secuenciaCiclo('C', 4, 'cuatriadas');
  const g7 = c4.find((a) => a.simbolo === 'G7')!;
  assert.deepEqual(g7.notas.filter((n) => n.comun).map((n) => n.nota).sort(), ['D', 'F']);
  // Ciclo 2 en cuatriadas: una nota común (Cmaj7 → Dm7: la C se queda).
  assert.deepEqual(secuenciaCiclo('C', 2, 'cuatriadas')[1].notas.filter((n) => n.comun).map((n) => n.nota), ['C']);
  // Ciclo 3 en cuatriadas: tres notas comunes.
  assert.equal(secuenciaCiclo('C', 3, 'cuatriadas')[1].notas.filter((n) => n.comun).length, 3);
});

test('drop 2 baja la segunda voz desde arriba', () => {
  assert.deepEqual(drop2([60, 64, 67, 71]), [55, 60, 64, 71]);
  const s = secuenciaCiclo('C', 4, 'cuatriadas', 'drop2');
  assert.ok(s.every((a) => a.voces[3] - a.voces[0] > 12));
});
