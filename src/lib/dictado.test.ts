import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarProgresion } from './progresiones.ts';
import { AFINACION } from './secuencias.ts';
import { semitonosGrado } from './teoria.ts';
import { escalaBebopDe, gradosFuertes } from './bebop.ts';
import {
  ASPECTOS,
  CONTEXTOS,
  DIFICULTADES,
  digitarEnPosicion,
  generarFrase,
  materialLenguaje,
  notasLenguaje,
  notasMastilFrase,
  registro,
  secuenciaDictado,
  trastesPosicion,
  type Aspecto,
  type Dificultad,
} from './dictado.ts';

const mod = (n: number) => ((n % 12) + 12) % 12;

/** Todas las combinaciones de contexto, aspecto, dificultad y unas cuantas semillas y posiciones. */
function* todas() {
  for (const c of CONTEXTOS) {
    const compases = analizarProgresion(c.compases);
    for (const a of ASPECTOS) {
      for (const d of DIFICULTADES) {
        for (let s = 1; s <= 12; s++) {
          const posicion = 1 + ((s * 5) % 12);
          const tonica = ['C', 'F', 'Bb', 'E', 'Ab', 'G'][s % 6];
          const compas = compases[s % compases.length];
          yield { contexto: c.id, compas, aspecto: a.id, dificultad: d.id, posicion, tonica, semilla: s, frase: generarFrase(tonica, compas, a.id, d.id, posicion, s) };
        }
      }
    }
  }
}

test('los contextos se leen y cada compás tiene uno o dos acordes', () => {
  for (const c of CONTEXTOS) {
    const compases = analizarProgresion(c.compases);
    assert.ok(compases.every((x) => x.length >= 1 && x.length <= 2), c.id);
  }
});

test('la frase cabe en el compás, en su registro y en la posición', () => {
  for (const x of todas()) {
    const { frase, posicion, dificultad } = x;
    const etiqueta = `${x.contexto} ${x.aspecto} ${dificultad} ${x.tonica} pos ${posicion} s${x.semilla}`;
    const { min, max } = registro(posicion, dificultad);
    const { desde, hasta } = trastesPosicion(posicion);
    assert.ok(frase.notas.length >= 2, etiqueta);
    let anterior = -1;
    for (const n of frase.notas) {
      assert.ok(n.inicio > anterior, `${etiqueta}: corcheas en orden`);
      anterior = n.inicio;
      assert.ok(n.dur >= 1 && n.inicio + n.dur <= frase.corcheas, `${etiqueta}: dentro del compás`);
      // Las aproximaciones pueden quedar medio tono fuera del registro.
      assert.ok(n.midi >= min - 1 && n.midi <= max + 2, `${etiqueta}: ${n.midi} fuera de ${min}–${max}`);
      assert.equal(AFINACION[n.cuerda] + n.traste, n.midi, etiqueta);
      assert.ok(n.traste >= desde && n.traste <= hasta, `${etiqueta}: traste ${n.traste} fuera de ${desde}–${hasta}`);
      assert.ok(n.nota && n.grado, etiqueta);
    }
  }
});

test('la misma semilla da la misma frase', () => {
  const compas = analizarProgresion(['IIm7 V7'])[0];
  const a = generarFrase('C', compas, 'bebop', 'media', 5, 42);
  const b = generarFrase('C', compas, 'bebop', 'media', 5, 42);
  assert.deepEqual(a, b);
  const distintas = new Set(Array.from({ length: 20 }, (_, s) => generarFrase('C', compas, 'escala', 'media', 5, s + 1).notas.map((n) => n.midi).join(',')));
  assert.ok(distintas.size > 10, 'la melodía varía con la semilla');
});

const enGrados = (pc: number, raiz: number, grados: readonly string[]) => grados.some((g) => mod(raiz + semitonosGrado(g)) === pc);
const raizPc = (tonica: string, grado: string) => {
  const t = { C: 0, F: 5, Bb: 10, E: 4, Ab: 8, G: 7 }[tonica]!;
  return mod(t + semitonosGrado(grado));
};

test('arpegios: solo notas del acorde', () => {
  for (const x of todas()) {
    if (x.aspecto !== 'arpegios') continue;
    for (const n of x.frase.notas) {
      const a = x.frase.acordes[n.acorde].acorde;
      assert.ok(enGrados(mod(n.midi), raizPc(x.tonica, a.grado), a.formula), `${x.contexto} ${x.tonica} ${a.texto}: ${n.nota} (${n.grado})`);
    }
  }
});

test('bebop y aproximaciones: en los tiempos, notas del acorde', () => {
  for (const x of todas()) {
    if (x.aspecto !== 'bebop' && x.aspecto !== 'aproximaciones') continue;
    for (const n of x.frase.notas) {
      if (n.inicio % 2) continue;
      const a = x.frase.acordes[n.acorde].acorde;
      const grados: readonly string[] = x.aspecto === 'bebop' ? gradosFuertes(escalaBebopDe(a)) : a.formula;
      assert.ok(enGrados(mod(n.midi), raizPc(x.tonica, a.grado), grados), `${x.aspecto} ${x.contexto} ${a.texto} s${x.semilla}: ${n.nota} (${n.grado}) en la corchea ${n.inicio}`);
    }
  }
});

test('notas guía: en los tiempos, la 3 o la 7 del acorde', () => {
  for (const x of todas()) {
    if (x.aspecto !== 'notas-guia') continue;
    for (const n of x.frase.notas) {
      if (n.inicio % 2) continue;
      const a = x.frase.acordes[n.acorde].acorde;
      const guia = a.formula.filter((g) => /^(b?3|4|b{0,2}7|6)$/.test(g));
      assert.ok(enGrados(mod(n.midi), raizPc(x.tonica, a.grado), guia), `${a.texto}: ${n.nota} (${n.grado})`);
    }
  }
});

test('blues: todas las notas en la escala de blues de la tonalidad', () => {
  for (const x of todas()) {
    if (x.aspecto !== 'blues') continue;
    for (const n of x.frase.notas) assert.ok(enGrados(mod(n.midi), raizPc(x.tonica, '1'), ['1', 'b3', '4', 'b5', '5', 'b7']), `${x.tonica}: ${n.nota}`);
  }
});

test('tensiones: casi siempre hay alguna y resuelve por grado', () => {
  let con = 0;
  let total = 0;
  for (const x of todas()) {
    if (x.aspecto !== 'tensiones') continue;
    total++;
    const notas = x.frase.notas;
    if (notas.some((n) => n.tipo === 'tension')) con++;
    notas.forEach((n, i) => {
      const sig = notas[i + 1];
      if (n.tipo !== 'tension' || !sig || n.inicio % 2 || sig.acorde !== n.acorde) return;
      assert.ok(Math.abs(sig.midi - n.midi) <= 2, `${x.contexto} s${x.semilla}: ${n.nota} → ${sig.nota}`);
    });
  }
  assert.ok(con / total > 0.7, `${con} de ${total}`);
});

test('grados y nombres de nota sobre el acorde', () => {
  const compas = analizarProgresion(['V7alt'])[0];
  for (let s = 1; s <= 30; s++) {
    for (const n of generarFrase('C', compas, 'tensiones', 'media', 5, s).notas) {
      // Sobre G7alt: la b9 es Ab, la #9 A#, la b13 Eb.
      if (n.grado === 'b9') assert.equal(n.nota, 'Ab');
      if (n.grado === '#9') assert.equal(n.nota, 'A#');
      if (n.grado === 'b13') assert.equal(n.nota, 'Eb');
    }
  }
});

test('digitación: la cuerda más cómoda dentro de la posición', () => {
  // Posición 5 (trastes 4–9): A2 en la 6ª traste 5, C4 en la 3ª traste 5, E4 en la 2ª traste 5.
  assert.deepEqual(digitarEnPosicion([45, 60, 64], 5), [
    { cuerda: 0, traste: 5 },
    { cuerda: 3, traste: 5 },
    { cuerda: 4, traste: 5 },
  ]);
  // Posición 1: cuerdas al aire.
  assert.deepEqual(digitarEnPosicion([40], 1), [{ cuerda: 0, traste: 0 }]);
});

test('mástil: una nota por sitio; con «orden», todos sus números', () => {
  const compas = analizarProgresion(['Imaj7'])[0];
  const f = generarFrase('C', compas, 'arpegios', 'facil', 5, 3);
  f.notas = [f.notas[0], { ...f.notas[1] }, { ...f.notas[0], inicio: 6 }];
  const notas = notasMastilFrase(f, 'orden');
  assert.equal(notas.length, 2);
  assert.equal(notas[0].rotulo, '1·3');
  assert.equal(notasMastilFrase(f, 'grado')[0].rotulo, f.notas[0].grado);
});

test('audio: la frase en la llamada y el compás de respuesta sin melodía', () => {
  const compas = analizarProgresion(['IIm7 V7'])[0];
  const f = generarFrase('C', compas, 'bebop', 'dificil', 5, 7);
  const bpm = 120;
  const s = secuenciaDictado(f, 'C', bpm, { acompanamiento: 'acorde', metronomo: true, cuenta: true, swing: 0.62 });
  assert.equal(s.compas, 2);
  assert.equal(s.llamada, 2);
  assert.equal(s.duracion, 6);
  const melodia = s.eventos.filter((e) => !e.clic && e.volumen === undefined);
  assert.equal(melodia.length, f.notas.length);
  assert.ok(melodia.every((e) => e.inicio >= s.llamada && e.inicio + e.duracion <= s.llamada + s.compas + 1e-9));
  // El acompañamiento suena en los dos compases, más bajo.
  const acomp = s.eventos.filter((e) => !e.clic && e.volumen !== undefined);
  assert.ok(acomp.some((e) => e.inicio < s.llamada + s.compas) && acomp.some((e) => e.inicio >= s.llamada + s.compas));
  assert.ok(acomp.every((e) => e.volumen! < 1));
  // Cuenta: cuatro clics antes de la llamada.
  assert.equal(s.eventos.filter((e) => e.clic && e.inicio < s.llamada).length, 4);
  // Solo la llamada, sin cuenta ni acompañamiento.
  const sola = secuenciaDictado(f, 'C', bpm, { soloLlamada: true });
  assert.equal(sola.duracion, 2);
  assert.equal(sola.eventos.length, f.notas.length);
});

test('compás de 3/4: la frase cabe en seis corcheas', () => {
  const compas = analizarProgresion(['Imaj7'])[0];
  for (const d of ['facil', 'media', 'dificil'] as Dificultad[]) {
    for (const a of ASPECTOS.map((x) => x.id) as Aspecto[]) {
      const f = generarFrase('C', compas, a, d, 5, 9, 3);
      assert.equal(f.corcheas, 6);
      assert.ok(f.notas.every((n) => n.inicio + n.dur <= 6), `${a} ${d}`);
    }
  }
});

test('notas del lenguaje: en la posición, y cada nota de la frase sale de ellas', () => {
  const pcs = (notas: { midi: number }[]) => new Set(notas.map((n) => n.midi % 12));
  for (const c of CONTEXTOS) {
    for (const compas of analizarProgresion(c.compases)) {
      for (const aspecto of ['arpegios', 'escala', 'bebop', 'tensiones', 'blues'] as Aspecto[]) {
        for (let semilla = 1; semilla <= 10; semilla++) {
          const f = generarFrase('F', compas, aspecto, 'media', 5, semilla);
          f.notas.forEach((n) => {
            const material = pcs(notasLenguaje('F', compas[n.acorde], aspecto, 5, 'grado'));
            assert.ok(material.has(n.midi % 12), `${c.id} ${aspecto}: ${n.nota} fuera del material`);
          });
        }
      }
    }
  }
  const [iim7] = analizarProgresion(['IIm7'])[0];
  const { desde, hasta } = trastesPosicion(5);
  const notas = notasLenguaje('C', iim7, 'escala', 5, 'nota');
  assert.ok(notas.every((n) => n.traste >= desde && n.traste <= hasta));
  // Dm7 dórico: 7 notas; las del acorde (D F A C), rellenas.
  assert.equal(pcs(notas).size, 7);
  assert.deepEqual(new Set(notas.filter((n) => n.delAcorde).map((n) => n.rotulo)), new Set(['D', 'F', 'A', 'C']));
  assert.deepEqual(new Set(notasLenguaje('C', iim7, 'notas-guia', 5, 'grado').map((n) => n.grado)), new Set(['b3', 'b7']));
  assert.equal(materialLenguaje('C', iim7, 'blues').sobreTonica, true);
});
