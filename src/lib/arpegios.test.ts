import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAcordeGrado } from './progresiones.ts';
import { enZona, eventosArpegio, mastilSVG, notasArpegio, recorrido } from './arpegios.ts';

test('notas de Cmaj7 en el mástil', () => {
  const n = notasArpegio('C', parseAcordeGrado('Imaj7'));
  // En cada cuerda, 4 notas por octava: trastes 0–15 dan entre 5 y 6 por cuerda.
  for (let c = 0; c < 6; c++) {
    const k = n.filter((x) => x.cuerda === c).length;
    assert.ok(k >= 5 && k <= 6, `cuerda ${6 - c}: ${k}`);
  }
  // 6ª cuerda: E (0), G (3), B (7), C (8), E (12), G (15).
  assert.deepEqual(n.filter((x) => x.cuerda === 0).map((x) => `${x.traste}${x.nota}${x.grado}`), ['0E3', '3G5', '7B7', '8C1', '12E3', '15G5']);
});

test('zonas y recorrido', () => {
  const n = notasArpegio('C', parseAcordeGrado('Im7'));
  const pos = { tipo: 'posicion' as const, desde: 7 };
  assert.ok(n.filter((x) => enZona(x, pos)).every((x) => x.traste >= 7 && x.traste <= 11));
  const r = recorrido(n, pos, '3');
  // Empieza en la b3 más grave, sube, baja y vuelve a la de partida.
  assert.equal(r[0].grado, 'b3');
  assert.equal(r[r.length - 1].midi, r[0].midi);
  const alturas = r.map((x) => x.midi);
  const cima = alturas.indexOf(Math.max(...alturas));
  assert.ok(alturas.slice(0, cima + 1).every((m, i, a) => i === 0 || m > a[i - 1]));
  // Una cuerda: solo notas de esa cuerda.
  assert.ok(recorrido(n, { tipo: 'cuerda', cuerda: 5 }).every((x) => x.cuerda === 5));
  const { eventos } = eventosArpegio(r, 120);
  assert.equal(eventos.length, r.length);
  assert.match(mastilSVG(n, pos), /<svg class="mastil"/);
});
