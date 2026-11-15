import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACORDES_OUT, CELULAS, TECNICAS, frasesOutside, secuenciaOutside } from './outside.ts';

const acorde = (id: string) => ACORDES_OUT.find((a) => a.id === id)!;
const tecnica = (id: string) => TECNICAS.find((t) => t.id === id)!;
const nombres = (notas: { nota: string }[]) => notas.map((n) => n.nota).join(' ');

test('la original va toda dentro; la salida, dentro salvo el compás 2', () => {
  for (const a of ACORDES_OUT) {
    for (const { id: c } of CELULAS) {
      for (const t of TECNICAS) {
        for (const tonica of ['C', 'D', 'F#', 'Bb']) {
          const { original, salida } = frasesOutside(tonica, a, c, t);
          assert.ok(original.every((x) => !x.fuera && x.notas.every((n) => n.dentro)), `${a.id} ${c} ${t.id} ${tonica}`);
          assert.deepEqual(salida.map((x) => x.fuera), [false, true, false, false]);
          for (const i of [0, 2, 3]) assert.ok(salida[i].notas.every((n) => n.dentro));
          // Cada compás dura 8 corcheas.
          for (const x of [...original, ...salida]) assert.equal(x.notas.reduce((s, n) => s + n.dur, 0), 8);
          // El compás de fuera tiene al menos la mitad de sus notas fuera de la escala.
          const fuera = salida[1].notas.filter((n) => !n.dentro).length;
          assert.ok(fuera >= 4, `${a.id} ${c} ${t.id} ${tonica}: solo ${fuera} notas fuera`);
        }
      }
    }
  }
});

test('medio tono arriba sobre Dm7: la misma frase en Ebm7', () => {
  const { original, salida } = frasesOutside('D', acorde('m7'), 'pentatonica', tecnica('arriba'));
  assert.equal(nombres(original[1].notas), 'D F G A C A G F');
  assert.equal(nombres(salida[1].notas), 'Eb Gb Ab Bb Db Bb Ab Gb');
  assert.equal(salida[1].piensa, 'Ebm7');
  assert.deepEqual(salida[1].notas.map((n, k) => n.midi - original[1].notas[k].midi), [1, 1, 1, 1, 1, 1, 1, 1]);
  // Final: cuatro corcheas y la raíz larga.
  assert.equal(nombres(salida[3].notas), 'D F G A D');
  assert.equal(salida[3].notas[4].dur, 4);
});

test('medio tono abajo con sostenidos; escalera y tritono', () => {
  const abajo = frasesOutside('D', acorde('m7'), 'pentatonica', tecnica('abajo')).salida[1];
  assert.equal(abajo.piensa, 'C#m7');
  assert.equal(nombres(abajo.notas), 'C# E F# G# B G# F# E');
  const esc = frasesOutside('D', acorde('m7'), 'pentatonica', tecnica('escalera')).salida[1];
  assert.equal(esc.piensa, 'Ebm7 → Em7');
  assert.equal(nombres(esc.notas), 'Eb Gb Ab Bb E G A B');
  // A un tritono de C7: F#7 (F# A# C# E) se lee mejor que Gb7 (Gb Bb Db Fb).
  const tri = frasesOutside('C', acorde('7'), 'arpegio', tecnica('tritono')).salida[1];
  assert.equal(tri.piensa, 'F#7');
  assert.equal(nombres(tri.notas.slice(0, 4)), 'F# A# C# E');
  // Medio tono arriba de Cm7: C#m (C# E F# G# B), no Dbm (Db Fb Gb Ab Cb).
  const cm = frasesOutside('C', acorde('m7'), 'pentatonica', tecnica('arriba')).salida[1];
  assert.equal(cm.piensa, 'C#m7');
  assert.equal(nombres(cm.notas), 'C# E F# G# B G# F# E');
});

test('audio: dos frases seguidas son ocho compases, con fondo en cada compás', () => {
  const { original, salida } = frasesOutside('D', acorde('m7'), 'arpegio', tecnica('arriba'));
  const { eventos, tiempos, duracion } = secuenciaOutside([original, salida], 'D', acorde('m7'), 120, { fondo: true });
  assert.equal(duracion, 16);
  assert.equal(tiempos.length, 2 * (8 * 3 + 5));
  assert.equal(eventos.length, tiempos.length + 8 * 4);
  assert.equal(tiempos[tiempos.length - 1].frase, 1);
});
