import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACORDES_PENTA, FORMULA_PENTA, esTension, letrasPenta, nombrePenta, notasPenta, relativa } from './pentatonicas.ts';
import { semitonosGrado } from './teoria.ts';

const pc = (g: string) => ((semitonosGrado(g) % 12) + 12) % 12;
const acorde = (id: string) => ACORDES_PENTA.find((a) => a.id === id)!;
const opcion = (a: string, id: string) => acorde(a).opciones.find((o) => o.id === id)!;

test('cada opción: sus grados sobre el acorde son la pentatónica desde su raíz', () => {
  for (const a of ACORDES_PENTA) {
    for (const o of a.opciones) {
      const esperado = FORMULA_PENTA[o.tipo].map((g) => (pc(o.grado) + pc(g)) % 12);
      assert.deepEqual(o.notas.map(pc), esperado, `${a.id} ${o.id}`);
    }
  }
});

test('sin choques: la 4 no va sobre la 3 (salvo en el dominante, por el blues) ni la 7 mayor sobre la b7', () => {
  for (const a of ACORDES_PENTA) {
    for (const o of a.opciones) {
      const tieneTercera = a.formula.includes('3');
      if (tieneTercera && a.id !== '7') assert.ok(!o.notas.some((g) => pc(g) === 5), `${a.id} ${o.id}: la 4 choca con la 3`);
      // La 7 mayor nunca sobre un acorde con b7.
      if (a.formula.includes('b7')) assert.ok(!o.notas.some((g) => pc(g) === 11), `${a.id} ${o.id}: 7 mayor sobre b7`);
    }
  }
});

test('nombres, letras y relativa en C', () => {
  const alt = opcion('7alt', 'alt-b5');
  assert.equal(nombrePenta('C', alt), 'Gb mayor');
  assert.deepEqual(letrasPenta('C', alt), ['Gb', 'Ab', 'Bb', 'Db', 'Eb']);
  assert.equal(relativa('C', alt), 'Eb menor');
  const lidia = opcion('maj7', 'maj7-2');
  assert.deepEqual(letrasPenta('C', lidia), ['D', 'E', 'F#', 'A', 'B']);
  assert.equal(relativa('C', lidia), 'B menor');
  const loc = opcion('m7b5', 'm7b5-b3');
  assert.equal(nombrePenta('C', loc), 'Eb menor');
  assert.equal(relativa('C', loc), 'Gb mayor');
  // Las dos del alterado son la misma pentatónica (relativas).
  assert.deepEqual(new Set(alt.notas.map(pc)), new Set(opcion('7alt', 'alt-s9').notas.map(pc)));
});

test('la raíz de la pentatónica, con la grafía con que se piensa', () => {
  const alt = opcion('7alt', 'alt-b5');
  // La b5 de Bb es Fb: la pentatónica es la de E.
  assert.equal(nombrePenta('Bb', alt), 'E mayor');
  assert.deepEqual(letrasPenta('Bb', alt), ['E', 'F#', 'G#', 'B', 'C#']);
  assert.equal(relativa('Bb', alt), 'C# menor');
  assert.equal(nombrePenta('Bb', opcion('7alt', 'alt-s9')), 'C# menor');
  // La b3 de Gb es Bbb: A menor.
  assert.equal(nombrePenta('Gb', opcion('m7b5', 'm7b5-b3')), 'A menor');
  // Las de grafía normal no cambian.
  assert.equal(nombrePenta('Db', opcion('maj7', 'maj7-5')), 'Ab mayor');
  assert.equal(nombrePenta('F#', opcion('maj7', 'maj7-2')), 'G# mayor');
});

test('tensiones y notas del acorde', () => {
  const m = acorde('maj7');
  assert.deepEqual(opcion('maj7', 'maj7-2').notas.filter((g) => esTension(m, g)), ['9', '#11', '13']);
  assert.deepEqual(opcion('maj7', 'maj7-1').notas.filter((g) => !esTension(m, g)), ['1', '3', '5']);
});

test('en el mástil: grados sobre el acorde y notas del acorde marcadas', () => {
  const a = acorde('maj7');
  const notas = notasPenta('C', a, opcion('maj7', 'maj7-5')); // G A B D E sobre Cmaj7
  assert.deepEqual([...new Set(notas.map((n) => n.nota))].sort(), ['A', 'B', 'D', 'E', 'G']);
  const g = notas.find((n) => n.nota === 'G')!;
  assert.equal(g.grado, '5');
  assert.equal(g.delAcorde, true);
  assert.equal(notas.find((n) => n.nota === 'A')!.delAcorde, false);
});

test('nombres de pentatónicas en inglés', () => {
  const alt = ACORDES_PENTA.find((a) => a.id === '7alt')!.opciones[0];
  assert.equal(nombrePenta('C', alt, 'en'), 'Gb major');
  assert.equal(relativa('C', alt, 'en'), 'Eb minor');
});
