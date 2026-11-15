import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALIDADES_CM, buscarFormas, gradoMelodia, melodiasDisponibles, papelMelodia, secuenciaForma } from './chordmelody.ts';
import { AFINACION } from './secuencias.ts';
import { semitonosGrado } from './teoria.ts';

const q = (id: string) => CALIDADES_CM.find((c) => c.id === id)!;
const mod = (n: number) => ((n % 12) + 12) % 12;

test('todas las formas: la melodía arriba, notas del acorde debajo, sin dobles y tocables', () => {
  for (const c of CALIDADES_CM) {
    for (const raiz of ['C', 'F', 'Bb', 'E']) {
      for (const { nota } of melodiasDisponibles(raiz, c)) {
        for (const tensiones of [false, true]) {
          const formas = buscarFormas(raiz, c, nota, { tensiones });
          assert.ok(formas.length > 0, `${raiz}${c.sufijo} con ${nota} arriba (tensiones: ${tensiones})`);
          for (const f of formas) {
            const ultima = f.midis[f.midis.length - 1];
            assert.ok(f.midis.slice(0, -1).every((m) => m < ultima), 'la melodía es la más aguda');
            assert.equal(f.trastes[f.cuerdaMelodia], f.trasteMelodia);
            assert.ok(f.cuerdaMelodia >= 3, 'melodía en las cuerdas 1ª, 2ª o 3ª');
            assert.ok(f.trastes.slice(f.cuerdaMelodia + 1).every((t) => t === 'x'), 'nada por encima de la melodía');
            assert.equal(new Set(f.midis.map(mod)).size, f.midis.length, 'sin notas repetidas');
            const p = f.trastes.filter((t): t is number => t !== 'x');
            assert.ok(Math.max(...p) - Math.min(...p) <= 4, 'apertura');
            assert.ok(f.midis.length >= 3 && f.midis.length <= 4);
            assert.deepEqual(f.trastes.flatMap((t, i) => (t === 'x' ? [] : [AFINACION[i] + t])), f.midis);
            // Las dos notas guía están (o una de ellas es la melodía).
            const pcRaiz = mod(f.midis[0] - semitonosGrado(f.grados.find(Boolean)!));
            for (const g of c.guia) assert.ok(f.midis.some((m) => mod(m - pcRaiz) === mod(semitonosGrado(g))), `${raiz}${c.sufijo}: falta la ${g}`);
          }
        }
      }
    }
  }
});

test('Cmaj7 con E arriba: incluye x3545x (C G B E, la 3 en la 2ª cuerda)', () => {
  const formas = buscarFormas('C', q('maj7'), 'E');
  const f = formas.find((x) => x.trastes.join('') === 'x3545x')!;
  assert.ok(f);
  assert.deepEqual(f.grados.filter(Boolean), ['1', '5', '7', '3']);
  assert.equal(f.raizEnElBajo, true);
});

test('tensiones: la 9 sobre Cmaj7 solo con ellas permitidas debajo; la b9 sobre G7alt', () => {
  const sin = buscarFormas('C', q('maj7'), 'D');
  assert.ok(sin.every((f) => !f.grados.slice(0, f.cuerdaMelodia).includes('13')));
  assert.ok(buscarFormas('C', q('maj7'), 'D', { tensiones: true }).some((f) => f.grados.slice(0, f.cuerdaMelodia).includes('13')));
  assert.ok(buscarFormas('G', q('7alt'), 'Ab', { tensiones: true }).some((f) => f.trastes.join('') === '3231xx'));
});

test('papel y grado de la nota de melodía', () => {
  assert.equal(gradoMelodia('C', q('maj7'), 'E'), '3');
  assert.equal(papelMelodia('C', q('maj7'), 'D'), 'tension');
  assert.equal(papelMelodia('C', q('maj7'), 'F'), 'fuera');
  assert.equal(gradoMelodia('C', q('m7'), 'Eb'), 'b3');
  assert.equal(gradoMelodia('C', q('7alt'), 'Eb'), '#9');
  assert.equal(gradoMelodia('C', q('6'), 'A'), '6');
  assert.deepEqual(melodiasDisponibles('C', q('7')).map((x) => x.nota), ['C', 'D', 'E', 'F#', 'G', 'A', 'Bb']);
});

test('audio: el acorde y la melodía repetida arriba', () => {
  const f = buscarFormas('C', q('maj7'), 'E')[0];
  const { eventos, duracion } = secuenciaForma(f, 120);
  assert.equal(duracion, 2);
  assert.equal(eventos.length, f.midis.length + 1);
  assert.equal(eventos[eventos.length - 1].midi, f.midis[f.midis.length - 1]);
});
