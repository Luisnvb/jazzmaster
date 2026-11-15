import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CUALIDADES_CAPAS, FORMAS_CAGED, acordeCaged, capas, cualidadCapas, eventosCapa, mastilCapasSVG, zonaCaged, zonasCaged } from './capas.ts';
import { parseAcordeGrado } from './progresiones.ts';
import { TONICAS, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

const mod = (n: number) => ((n % 12) + 12) % 12;
const forma = (t: (number | null)[]) => t.map((x) => (x === null ? 'x' : String(x))).join(' ');
const acorde = (raiz: string, romano: string, letra: 'C' | 'A' | 'G' | 'E' | 'D') => forma(acordeCaged(raiz, parseAcordeGrado(romano), letra).trastes);

test('zonas CAGED de C: C al aire, A en el 3, G en el 5, E en el 8, D en el 10', () => {
  assert.deepEqual(
    zonasCaged('C').map((z) => `${z.letra}${z.cejilla}`),
    ['C0', 'A3', 'G5', 'E8', 'D10'],
  );
  assert.deepEqual(zonaCaged('C', 'C'), { letra: 'C', cejilla: 0, posicion: 1, desde: 0, hasta: 5 });
  assert.deepEqual(zonaCaged('C', 'E'), { letra: 'E', cejilla: 8, posicion: 8, desde: 7, hasta: 12 });
});

test('acordes mayores: las formas al aire desplazadas', () => {
  assert.equal(acorde('C', 'I', 'C'), 'x 3 2 0 1 0');
  assert.equal(acorde('C', 'I', 'A'), 'x 3 5 5 5 3');
  assert.equal(acorde('C', 'I', 'E'), '8 10 10 9 8 8');
  assert.equal(acorde('G', 'I', 'G'), '3 2 0 0 0 3');
  assert.equal(acorde('D', 'I', 'D'), 'x x 0 2 3 2');
});

test('otras cualidades con las formas de siempre', () => {
  assert.equal(acorde('E', 'Im', 'E'), '0 2 2 0 0 0');
  assert.equal(acorde('A', 'Im', 'A'), 'x 0 2 2 1 0');
  assert.equal(acorde('E', 'I7', 'E'), '0 2 0 1 0 0');
  assert.equal(acorde('E', 'Imaj7', 'E'), '0 2 1 1 0 0');
  assert.equal(acorde('E', 'Im7', 'E'), '0 2 0 0 0 0');
  assert.equal(acorde('A', 'I7', 'A'), 'x 0 2 0 2 0');
  assert.equal(acorde('A', 'Imaj7', 'A'), 'x 0 2 1 2 0');
  assert.equal(acorde('A', 'I6', 'A'), 'x 0 2 2 2 2');
  assert.equal(acorde('C', 'I7', 'C'), 'x 3 2 3 1 0');
  assert.equal(acorde('C', 'Imaj7', 'C'), 'x 3 2 0 0 0');
  assert.equal(acorde('G', 'I7', 'G'), '3 2 0 0 0 1');
  assert.equal(acorde('D', 'I7', 'D'), 'x x 0 2 1 2');
  assert.equal(acorde('D', 'Im7b5', 'D'), 'x x 0 1 1 1');
  assert.equal(acorde('D', 'Isus4', 'D'), 'x x 0 2 3 3');
});

test('cada acorde CAGED: solo notas del acorde, la raíz en el bajo y la cuarta nota si la hay', () => {
  for (const t of TONICAS) {
    for (const c of CUALIDADES_CAPAS) {
      const a = parseAcordeGrado(c.romano);
      const pcs = new Set(a.formula.map((g) => mod(pitchClass(notaDeGrado(t, '1')) + semitonosGrado(g))));
      for (const f of FORMAS_CAGED) {
        const { trastes, grados } = acordeCaged(t, a, f.letra);
        const tocadas = trastes.flatMap((x, i) => (x === null ? [] : [{ x, i, g: grados[i] }]));
        assert.ok(tocadas.length >= 3, `${t}${c.id} ${f.letra}: ${forma(trastes)}`);
        assert.equal(tocadas[0].g, '1', `${t}${c.id} ${f.letra}: bajo`);
        for (const { x, i } of tocadas) assert.ok(pcs.has(mod([40, 45, 50, 55, 59, 64][i] + x)), `${t}${c.id} ${f.letra}: ${forma(trastes)}`);
        const necesarias = a.formula.filter((g) => !(a.formula.length > 3 && g === '5'));
        for (const g of necesarias) assert.ok(tocadas.some((n) => n.g === g), `${t}${c.id} ${f.letra}: falta ${g} en ${forma(trastes)}`);
        const pisadas = tocadas.filter((n) => n.x > 0).map((n) => n.x);
        assert.ok(Math.max(...pisadas) - Math.min(...pisadas) <= 4, `${t}${c.id} ${f.letra}: ${forma(trastes)} muy abierto`);
      }
    }
  }
});

test('capas: todas las notas dentro de la zona y del material de la capa', () => {
  for (const t of TONICAS) {
    for (const c of CUALIDADES_CAPAS) {
      for (const f of FORMAS_CAGED) {
        const z = zonaCaged(t, f.letra);
        const lista = capas(t, c, f.letra);
        assert.deepEqual(
          lista.map((x) => x.id),
          ['raiz', 'triadas', 'arpegio', 'abiertas', ...(c.penta ? ['pentatonica'] : []), 'escala', 'acorde'],
        );
        for (const capa of lista) {
          for (const n of capa.notas) {
            assert.ok(n.traste >= z.desde && n.traste <= z.hasta, `${t}${c.id} ${f.letra} ${capa.id}: traste ${n.traste}`);
          }
        }
        assert.ok(lista[0].notas.length >= 2, `${t}${c.id} ${f.letra}: raíces`);
        assert.ok(lista[0].notas.every((n) => n.grado === '1'));
        assert.ok(lista[1].formas.length >= 1, `${t}${c.id} ${f.letra}: sin tríadas cerradas`);
        assert.ok(lista[1].formas.every((x) => x.length === 3));
      }
    }
  }
});

test('escala de la capa: se puede cambiar y marca las notas del acorde', () => {
  const m7 = cualidadCapas('m7');
  const dorica = capas('D', m7, 'E', 0).find((c) => c.id === 'escala')!;
  const eolica = capas('D', m7, 'E', 1).find((c) => c.id === 'escala')!;
  assert.ok(dorica.notas.some((n) => n.grado === '6'));
  assert.ok(eolica.notas.some((n) => n.grado === 'b6'));
  assert.ok(dorica.notas.filter((n) => n.delAcorde).every((n) => ['1', 'b3', '5', 'b7'].includes(n.grado)));
  assert.ok(dorica.notas.some((n) => n.delAcorde === false));
});

test('audio: notas sueltas suben y bajan; los voicings, arpegiados y juntos', () => {
  const lista = capas('C', cualidadCapas('mayor'), 'A');
  const raiz = eventosCapa(lista[0], 120);
  const alturas = raiz.eventos.map((e) => e.midi);
  assert.equal(alturas[0], Math.min(...alturas));
  assert.equal(alturas[alturas.length - 1], alturas[0]);
  const triadas = eventosCapa(lista[1], 120);
  assert.equal(triadas.pasos.length, lista[1].formas.length * 4);
  assert.equal(triadas.eventos.length, lista[1].formas.length * 6);
  const una = eventosCapa(lista[1], 120, 1);
  assert.equal(una.eventos.length, 6);
  assert.deepEqual(una.pasos[3].notas.map((n) => n.midi), [...lista[1].formas[1]].map((n) => n.midi).sort((a, b) => a - b));
});

test('dibujo: la capa actual delante, las anteriores atenuadas o fuera', () => {
  const lista = capas('C', cualidadCapas('mayor'), 'A');
  const conTodo = mastilCapasSVG(lista, 2, zonaCaged('C', 'A'));
  assert.match(conTodo, /class="nota[^"]*anterior/);
  assert.match(conTodo, /class="zona"/);
  const solo = mastilCapasSVG(lista, 2, zonaCaged('C', 'A'), false);
  assert.doesNotMatch(solo, /anterior/);
  assert.match(mastilCapasSVG(lista, 1, zonaCaged('C', 'A')), /<polyline class="forma"/);
  const unaSola = mastilCapasSVG(lista, 1, zonaCaged('C', 'A'), false, 'grado', 0);
  assert.equal(unaSola.match(/<polyline/g)!.length, 1);
  assert.equal(unaSola.match(/class="nota[^"]*actual/g)!.length, 3);
});
