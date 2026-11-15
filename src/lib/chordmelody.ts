// Chord melody: la melodía arriba y el acorde debajo. Dada una nota de melodía y
// un acorde, busca en el mástil las formas que la llevan en la voz más aguda.
// Funciones puras, sin DOM.
import { AFINACION, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, parseNota, pitchClass, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

export interface CalidadCM {
  id: string;
  sufijo: string;
  nombre: string;
  /** Las dos notas que definen el acorde (deben estar siempre): la 3 y la 7 (o la 6, la 4 del sus…). */
  guia: [string, string];
  /** Otras notas del acorde que pueden ir debajo. */
  otras: string[];
  /** Tensiones que pueden ir debajo si se permiten. */
  tensiones: string[];
}

export const CALIDADES_CM: CalidadCM[] = [
  { id: 'maj7', sufijo: 'maj7', nombre: 'maj7', guia: ['3', '7'], otras: ['1', '5'], tensiones: ['9', '#11', '13'] },
  { id: '6', sufijo: '6', nombre: '6', guia: ['3', '6'], otras: ['1', '5'], tensiones: ['9'] },
  { id: 'm7', sufijo: 'm7', nombre: 'm7', guia: ['b3', 'b7'], otras: ['1', '5'], tensiones: ['9', '11', '13'] },
  { id: 'm6', sufijo: 'm6', nombre: 'm6', guia: ['b3', '6'], otras: ['1', '5'], tensiones: ['9'] },
  { id: '7', sufijo: '7', nombre: '7', guia: ['3', 'b7'], otras: ['1', '5'], tensiones: ['9', '#11', '13'] },
  { id: '7alt', sufijo: '7alt', nombre: '7alt', guia: ['3', 'b7'], otras: ['1'], tensiones: ['b9', '#9', 'b13'] },
  { id: '7sus4', sufijo: '7sus4', nombre: '7sus4', guia: ['4', 'b7'], otras: ['1', '5'], tensiones: ['9', '13'] },
  { id: 'm7b5', sufijo: 'm7b5', nombre: 'm7b5', guia: ['b3', 'b7'], otras: ['1', 'b5'], tensiones: ['11'] },
  { id: 'dim7', sufijo: '°7', nombre: '°7', guia: ['b3', 'bb7'], otras: ['1', 'b5'], tensiones: [] },
];

const mod = (n: number) => ((n % 12) + 12) % 12;
const GRADOS_NOMBRE = ['1', 'b9', '9', 'b3', '3', '11', '#11', '5', 'b13', '13', 'b7', '7'];

/** Grado de una clase de altura sobre la raíz, con el nombre que tiene en esa calidad (b3 o #9, 6 o 13…). */
export function gradoEn(c: CalidadCM, st: number): string {
  const s = mod(st);
  const propio = [...c.guia, ...c.otras, ...c.tensiones].find((g) => mod(semitonosGrado(g)) === s);
  return propio ?? GRADOS_NOMBRE[s];
}

export interface FormaCM {
  trastes: Traste[];
  /** Grado de cada cuerda ('' si no suena), para el diagrama. */
  grados: string[];
  midis: number[];
  /** Cuerda de la melodía (índice 0 = 6ª). */
  cuerdaMelodia: number;
  trasteMelodia: number;
  /** Si la nota más grave es la raíz. */
  raizEnElBajo: boolean;
}

export interface OpcionesCM {
  /** Permite tensiones (9, 13…) en las voces de debajo. */
  tensiones?: boolean;
  /** Número máximo de notas, melodía incluida (3 o 4). */
  maxNotas?: number;
}

/**
 * Formas con la nota `melodia` arriba sobre el acorde (`raiz` + calidad). La
 * melodía va en la 1ª, 2ª o 3ª cuerda; debajo, de 2 a 3 notas distintas del
 * acorde que incluyen sus dos notas guía, más graves que la melodía, en cuerdas por debajo
 * de la suya (como mucho una cuerda saltada) y con una apertura de 4 trastes o menos.
 * Ordenadas por posición en el mástil.
 */
export function buscarFormas(raiz: string, c: CalidadCM, melodia: string, op: OpcionesCM = {}): FormaCM[] {
  const pcRaiz = pitchClass(parseNota(raiz));
  const pcMel = pitchClass(parseNota(melodia));
  const maxNotas = op.maxNotas ?? 4;
  const permitidos = [...c.guia, ...c.otras, ...(op.tensiones ? c.tensiones : [])];
  const pcs = new Map(permitidos.map((g) => [mod(pcRaiz + semitonosGrado(g)), g]));
  const guiaPcs = c.guia.map((g) => mod(pcRaiz + semitonosGrado(g)));
  const res: FormaCM[] = [];
  const vistas = new Set<string>();

  for (const cm of [5, 4, 3]) {
    for (let tm = 1; tm <= 15; tm++) {
      const mMel = AFINACION[cm] + tm;
      if (mod(mMel) !== pcMel) continue;
      // Para cada cuerda de debajo: apagada o un traste cercano con una nota del acorde.
      const opciones: (number | null)[][] = [];
      for (let cu = 0; cu < cm; cu++) {
        const lista: (number | null)[] = [null];
        for (let t = Math.max(1, tm - 4); t <= tm + 4; t++) {
          const m = AFINACION[cu] + t;
          if (m < mMel && pcs.has(mod(m))) lista.push(t);
        }
        opciones.push(lista);
      }
      const elegir = (cu: number, actual: (number | null)[]) => {
        if (cu === cm) {
          const usadas = actual.flatMap((t, i) => (t === null ? [] : [i]));
          const n = usadas.length + 1;
          if (n < 3 || n > maxNotas) return;
          // Como mucho una cuerda apagada entre la más grave usada y la de la melodía.
          const huecos = cm - usadas[0] - usadas.length;
          if (huecos > 1) return;
          const trastes = [...usadas.map((i) => actual[i]!), tm];
          if (Math.max(...trastes) - Math.min(...trastes) > 4) return;
          const midis = [...usadas.map((i) => AFINACION[i] + actual[i]!), mMel];
          // De grave a agudo, sin repetir alturas y con las dos notas guía.
          if (midis.some((m, i) => i > 0 && m <= midis[i - 1])) return;
          const debajo = new Set(midis.slice(0, -1).map(mod));
          // Cada voz, una nota distinta (sin dobles) y ninguna repite la melodía.
          if (debajo.size !== midis.length - 1 || debajo.has(pcMel)) return;
          if (!guiaPcs.every((p) => debajo.has(p) || p === pcMel)) return;
          const t6: Traste[] = ['x', 'x', 'x', 'x', 'x', 'x'];
          const g6 = ['', '', '', '', '', ''];
          usadas.forEach((i) => {
            t6[i] = actual[i]!;
            g6[i] = gradoEn(c, AFINACION[i] + actual[i]! - pcRaiz);
          });
          t6[cm] = tm;
          g6[cm] = gradoEn(c, mMel - pcRaiz);
          const k = t6.join(',');
          if (vistas.has(k)) return;
          vistas.add(k);
          res.push({ trastes: t6, grados: g6, midis, cuerdaMelodia: cm, trasteMelodia: tm, raizEnElBajo: mod(midis[0]) === pcRaiz });
          return;
        }
        for (const t of opciones[cu]) elegir(cu + 1, [...actual, t]);
      };
      elegir(0, []);
    }
  }
  // Por posición en el mástil; a igualdad, primero las de raíz en el bajo y las de más notas.
  const centro = (f: FormaCM) => {
    const p = f.trastes.filter((t): t is number => t !== 'x');
    return Math.min(...p);
  };
  return res.sort((a, b) => centro(a) - centro(b) || Number(b.raizEnElBajo) - Number(a.raizEnElBajo) || b.midis.length - a.midis.length);
}

/** Lo que es la melodía sobre el acorde: '3', '9', 'b9'… */
export const gradoMelodia = (raiz: string, c: CalidadCM, melodia: string) => gradoEn(c, pitchClass(parseNota(melodia)) - pitchClass(parseNota(raiz)));

/** Si la nota de melodía es del acorde, una tensión disponible o una nota «fuera» (que choca). */
export function papelMelodia(raiz: string, c: CalidadCM, melodia: string): 'acorde' | 'tension' | 'fuera' {
  const st = mod(pitchClass(parseNota(melodia)) - pitchClass(parseNota(raiz)));
  const es = (gs: string[]) => gs.some((g) => mod(semitonosGrado(g)) === st);
  if (es([...c.guia, ...c.otras])) return 'acorde';
  if (es(c.tensiones)) return 'tension';
  return 'fuera';
}

/** Las notas que suenan bien como melodía sobre el acorde: las suyas y sus tensiones, de grave a agudo. */
export function melodiasDisponibles(raiz: string, c: CalidadCM): { nota: string; grado: string }[] {
  return [...c.guia, ...c.otras, ...c.tensiones]
    .map((g) => ({ g, st: mod(semitonosGrado(g)) }))
    .sort((a, b) => a.st - b.st)
    .map(({ g }) => ({ nota: formatNota(notaDeGrado(raiz, g)), grado: g }));
}

/**
 * Audio de una forma: el acorde de grave a agudo (rasgueo lento) y la melodía,
 * que se repite sola al final para que se oiga arriba.
 */
export function secuenciaForma(f: FormaCM, bpm: number): { eventos: Evento[]; duracion: number } {
  const pulso = 60 / bpm;
  const eventos: Evento[] = f.midis.map((midi, i) => ({ midi, inicio: i * 0.04, duracion: 3 * pulso }));
  eventos.push({ midi: f.midis[f.midis.length - 1], inicio: 3 * pulso, duracion: pulso * 0.9 });
  return { eventos, duracion: 4 * pulso };
}
