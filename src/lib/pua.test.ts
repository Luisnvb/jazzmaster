import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EJERCICIOS, cambiosDeCuerda, eventosPua, golpes, huecos, marcaEn, planSubida, tabSVG, trasteTonica, type NotaTab } from './pua.ts';
import { TONICAS, parseNota, pitchClass } from './teoria.ts';

const ej = (id: string) => EJERCICIOS.find((e) => e.id === id)!;
const flechas = (gs: string[]) => gs.map((g) => (g === 'abajo' ? 'D' : g === 'arriba' ? 'U' : '-')).join('');

test('la tónica en cada cuerda', () => {
  assert.equal(trasteTonica('A', 0, 3), 5);
  assert.equal(trasteTonica('A', 1, 2), 12);
  assert.equal(trasteTonica('E', 0, 1), 12);
});

test('todos los ejercicios, en todas las tónicas: trastes válidos y la nota que dice la cuerda', () => {
  for (const e of EJERCICIOS) {
    for (const t of TONICAS) {
      const n = e.notas(t);
      assert.ok(n.length > 0);
      for (const x of n) {
        assert.ok(x.traste >= 0 && x.traste <= 20, `${e.id} ${t}: traste ${x.traste}`);
        assert.equal(x.midi, [40, 45, 50, 55, 59, 64][x.cuerda] + x.traste);
      }
    }
    // La primera nota es la tónica (en posición, la tónica está en la 6ª, pero la escala empieza más abajo).
    for (const t of TONICAS) {
      const n = e.notas(t);
      if (e.id === 'posicion') assert.equal(n.find((x) => x.cuerda === 0 && x.midi % 12 === pitchClass(parseNota(t)))!.traste, trasteTonica(t, 0, 2));
      else assert.equal(n[0].midi % 12, pitchClass(parseNota(t)), e.id);
    }
  }
});

test('pentatónica: alternada por dentro al subir y por fuera al bajar', () => {
  const n = ej('pentatonica').notas('A');
  const gs = golpes(n, 'alternada');
  assert.equal(flechas(gs.slice(0, 4)), 'DUDU');
  const subida = cambiosDeCuerda(n.slice(0, 12), gs.slice(0, 12));
  assert.equal(subida.dentro, 5);
  assert.equal(subida.fuera, 1); // la vuelta de la 1ª a la 6ª, contada como en bucle
  const c = cambiosDeCuerda(n, gs);
  assert.equal(c.dentro, 5);
  assert.equal(c.fuera, 5);
  assert.equal(c.barridos, 0);
});

test('tres por cuerda con economy: al subir, cada cuerda empieza hacia abajo; al bajar, hacia arriba', () => {
  const n = ej('tres').notas('C');
  const gs = golpes(n, 'economy');
  assert.equal(flechas(gs.slice(0, 18)), 'DUD'.repeat(6));
  assert.equal(flechas(gs.slice(18)), 'UDU'.repeat(6));
  const c = cambiosDeCuerda(n, gs);
  assert.equal(c.fuera, 0);
  assert.equal(c.dentro, 0);
  assert.equal(c.barridos, 10);
});

test('barrido: un movimiento por sentido, ligados sin púa', () => {
  const n = ej('barrido').notas('A');
  assert.deepEqual(n.slice(0, 7).map((x) => `${6 - x.cuerda}:${x.traste}`), ['5:12', '5:15', '4:14', '3:14', '2:13', '1:12', '1:17']);
  assert.equal(flechas(golpes(n, 'economy')), 'D-DDDD--UUUU');
  assert.equal(flechas(golpes(n, 'alternada')), 'D-UDUD--UDUD');
  // Barridos salvo el giro de arriba: abajo en la 1ª y arriba en la 2ª, por dentro.
  assert.deepEqual(cambiosDeCuerda(n, golpes(n, 'economy')), { dentro: 1, fuera: 0, barridos: 7 });
});

test('cromático: cuatro por cuerda, en alternada cada cuerda empieza hacia abajo', () => {
  const n = ej('arana').notas('G');
  assert.equal(n[0].traste, 3);
  assert.equal(flechas(golpes(n, 'alternada').slice(0, 24)), 'DUDU'.repeat(6));
});

test('plan de subida y audio', () => {
  assert.deepEqual(planSubida(60, 10, 2, 80), [60, 60, 70, 70, 80, 80]);
  assert.deepEqual(planSubida(90, 0, 3, 200), [90, 90, 90]);
  const n: NotaTab[] = ej('posicion').notas('C');
  const total = huecos(n.length, 4);
  assert.equal(total % 4, 0);
  const { eventos, duracion, marcas } = eventosPua(n, 4, [60, 120]);
  // Cuenta (4 s a 60) + vuelta a 60 (total/4 pulsos de 1 s) + vuelta a 120.
  assert.ok(Math.abs(duracion - (4 + total / 4 + total / 8)) < 1e-9);
  assert.equal(eventos.filter((e) => !e.clic).length, n.length * 2);
  assert.equal(eventos.filter((e) => e.clic).length, 4 + (total / 4) * 2);
  assert.equal(marcaEn(marcas, 4.01)!.nota, 0);
  assert.equal(marcaEn(marcas, duracion - 0.01)!.tempo, 120);
  assert.equal(marcaEn(marcas, 1)!.nota, -1);
});

test('tablatura', () => {
  const svg = tabSVG(ej('barrido').notas('A'), 6, 24);
  assert.match(svg, /<svg class="tab-pua"/);
  assert.equal((svg.match(/class="col"/g) ?? []).length, 12);
  assert.ok(svg.includes('eco distinto'));
});
