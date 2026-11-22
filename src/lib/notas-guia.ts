// Notas guía: la 3 y la 7 de cada acorde, encadenadas con el menor movimiento
// posible. Forman dos líneas que dibujan la armonía sin la raíz. Funciones puras.
import type { AcordeGrado } from './progresiones.ts';
import { simboloEn } from './progresiones.ts';
import { ligarRepetidos, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

/**
 * Grados que hacen de notas guía en un acorde: la 3 (o la 4 si es sus) y la 7
 * (o la 6). Una tríada no tiene 7: la segunda voz puede ser la raíz o la 5,
 * la que quede más cerca (se devuelven las dos opciones).
 */
export function gradosGuia(formula: readonly string[]): [string, string[]] {
  const num = (g: string) => g.replace(/^[b#]+/, '');
  const tercera = formula.find((g) => num(g) === '3') ?? formula.find((g) => num(g) === '4') ?? formula[1];
  const septima = formula.find((g) => num(g) === '7') ?? formula.find((g) => num(g) === '6');
  return [tercera, septima ? [septima] : ['1', formula.find((g) => num(g) === '5') ?? '1']];
}

export interface VozGuia {
  midi: number;
  nota: string;
  /** Grado en el acorde (3, b3, b7, 7, 6…). */
  grado: string;
  /** Semitonos desde la nota anterior de la misma línea (null en el primer acorde). */
  paso: number | null;
}

export interface AcordeGuia {
  simbolo: string;
  romano: string;
  /** Nota del bajo (MIDI, G2–F#3): la raíz, o la de la inversión. */
  bajo: number;
  /** [grave, aguda]. */
  voces: [VozGuia, VozGuia];
}

/** La altura de una clase de altura más cercana a `cerca`. */
const masCercana = (pc: number, cerca: number) => {
  const d = (((pc - cerca) % 12) + 18) % 12 - 6; // −6…5
  return cerca + d;
};

/**
 * Líneas de notas guía de una progresión ya analizada. `arriba` decide qué nota
 * va en la voz aguda del primer acorde ('3' o '7'); después cada voz va a la
 * nota guía más cercana del acorde siguiente, sin cruzarse, y así la 3 y la 7
 * se van turnando entre las dos líneas.
 */
export function lineasGuia(tonica: string, compases: readonly AcordeGrado[][], arriba: '3' | '7' = '7'): AcordeGuia[] {
  const acordes = compases.flat();
  const res: AcordeGuia[] = [];
  let previas: [number, number] | null = null;
  for (const a of acordes) {
    const raiz = notaDeGrado(tonica, a.grado);
    const pcRaiz = pitchClass(raiz);
    const [g3, otras] = gradosGuia(a.formula);
    const g7 = otras[0];
    const pc = (g: string) => (pcRaiz + semitonosGrado(g)) % 12;
    let grave: string, aguda: string, mGrave: number, mAguda: number;
    if (!previas) {
      // Primer acorde: la voz grave entre E3 y D#4 (registro medio, cuerdas 4ª–2ª).
      [grave, aguda] = arriba === '7' ? [g3, g7] : [g7, g3];
      mGrave = 52 + ((pc(grave) - 4 + 12) % 12);
      mAguda = mGrave + ((pc(aguda) - pc(grave) + 12) % 12 || 12);
    } else {
      // Todas las combinaciones: qué nota guía va en cada voz y en qué octava.
      // Gana la que menos se mueve, sin cruzar voces y sin salir del registro (A2–G5).
      const [pg, pa] = previas;
      let mejor = { x: g3, y: g7, mx: 0, my: 0, coste: Infinity };
      for (const [x, y] of otras.flatMap((o) => [
        [g3, o],
        [o, g3],
      ])) {
        for (const ox of [-12, 0, 12]) {
          for (const oy of [-12, 0, 12]) {
            const mx = masCercana(pc(x), pg) + ox;
            const my = masCercana(pc(y), pa) + oy;
            if (my <= mx || my - mx > 16 || mx < 45 || my > 79) continue;
            // Movimiento total, y una pizca de preferencia por el centro para que la línea no se desvíe.
            const coste = Math.abs(mx - pg) + Math.abs(my - pa) + 0.3 * Math.abs((mx + my) / 2 - 62);
            if (coste < mejor.coste) mejor = { x, y, mx, my, coste };
          }
        }
      }
      ({ x: grave, y: aguda, mx: mGrave, my: mAguda } = mejor);
    }
    const voz = (m: number, g: string, anterior: number | undefined): VozGuia => ({
      midi: m,
      nota: formatNota(notaDeGrado(raiz, g)),
      grado: g,
      paso: anterior === undefined ? null : m - anterior,
    });
    res.push({
      simbolo: simboloEn(tonica, a),
      romano: a.texto,
      // Con inversión (I/3), el bajo es esa nota del acorde.
      bajo: 43 + ((pc(a.bajo ?? '1') - 7 + 12) % 12),
      voces: [voz(mGrave, grave, previas?.[0]), voz(mAguda, aguda, previas?.[1])],
    });
    previas = [mGrave, mAguda];
  }
  return res;
}

/** Cómo se mueve una voz, en palabras cortas: =, ↓½, ↑1, ↓3ª… */
export function textoPaso(paso: number | null, idioma: 'es' | 'en' = 'es'): string {
  if (paso === null) return '';
  if (paso === 0) return '=';
  const flecha = paso < 0 ? '↓' : '↑';
  const n = Math.abs(paso);
  const en = idioma === 'en';
  const nombre = n === 1 ? '½' : n === 2 ? '1' : n <= 4 ? (en ? '3rd' : '3ª') : n === 5 ? (en ? '4th' : '4ª') : n === 6 ? (en ? 'aug. 4th' : '4ª aum.') : `${n} st`;
  return flecha + nombre;
}

/**
 * Audio: en cada acorde, las dos notas guía (y la raíz en el bajo si se pide),
 * repartiendo el compás entre sus acordes como en Progresiones.
 */
export function eventosGuia(
  compases: readonly AcordeGrado[][],
  guia: readonly AcordeGuia[],
  bpm: number,
  pulsos = 4,
  op: { bajo?: boolean; sostenido?: boolean } = {},
): { eventos: Evento[]; tramos: { inicio: number; fin: number }[]; duracion: number } {
  const pulso = 60 / bpm;
  const eventos: Evento[] = [];
  const tramos: { inicio: number; fin: number }[] = [];
  let t = 0;
  let k = 0;
  for (const acordes of compases) {
    const dur = (pulsos * pulso) / acordes.length;
    for (let j = 0; j < acordes.length; j++, k++) {
      const g = guia[k];
      const notas = [...(op.bajo ? [g.bajo] : []), ...g.voces.map((v) => v.midi)];
      for (const midi of notas) eventos.push({ midi, inicio: t, duracion: op.sostenido ? dur : dur * 0.92 });
      tramos.push({ inicio: t, fin: t + dur });
      t += dur;
    }
  }
  return { eventos: op.sostenido ? ligarRepetidos(eventos) : eventos, tramos, duracion: t };
}
