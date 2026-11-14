// Ciclos de Mick Goodrick: los acordes diatónicos de una tonalidad mayor
// recorridos según cuánto sube la raíz (ciclo 2 = por grados, ciclo 4 = por
// cuartas…), con conducción de voces mínima entre un acorde y el siguiente.
// Funciones puras, sin DOM.
import type { Evento } from './secuencias.ts';
import { ligarRepetidos } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

export type Ciclo = 2 | 3 | 4 | 5 | 6 | 7;
export const CICLOS: readonly Ciclo[] = [2, 3, 4, 5, 6, 7];

/** Cómo se mueve la raíz en cada ciclo. Los ciclos 2/7, 3/6 y 4/5 son el mismo recorrido al revés. */
export const DESCRIPCION_CICLO: Record<Ciclo, string> = {
  2: 'la raíz sube una segunda (por grados)',
  3: 'la raíz sube una tercera',
  4: 'la raíz sube una cuarta (baja una quinta)',
  5: 'la raíz sube una quinta (baja una cuarta)',
  6: 'la raíz sube una sexta (baja una tercera)',
  7: 'la raíz sube una séptima (baja por grados)',
};

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** Acordes diatónicos de la escala mayor: sufijo y fórmula, en tríadas y cuatriadas. */
const DIATONICOS = {
  triadas: [
    ['', ['1', '3', '5']],
    ['m', ['1', 'b3', '5']],
    ['m', ['1', 'b3', '5']],
    ['', ['1', '3', '5']],
    ['', ['1', '3', '5']],
    ['m', ['1', 'b3', '5']],
    ['°', ['1', 'b3', 'b5']],
  ],
  cuatriadas: [
    ['maj7', ['1', '3', '5', '7']],
    ['m7', ['1', 'b3', '5', 'b7']],
    ['m7', ['1', 'b3', '5', 'b7']],
    ['maj7', ['1', '3', '5', '7']],
    ['7', ['1', '3', '5', 'b7']],
    ['m7', ['1', 'b3', '5', 'b7']],
    ['m7b5', ['1', 'b3', 'b5', 'b7']],
  ],
} as const satisfies Record<string, readonly (readonly [string, readonly string[]])[]>;

export type Tipo = keyof typeof DIATONICOS;

export interface AcordeCiclo {
  /** Grado en romanos con su calidad: IIm7. */
  romano: string;
  /** Cifrado en la tónica: Dm7. */
  simbolo: string;
  /** Voces de grave a agudo (MIDI). */
  voces: number[];
  /** Nombre y grado (respecto a la raíz del acorde) de cada voz, de grave a agudo. */
  notas: { nota: string; grado: string; comun: boolean }[];
}

/** Grados de la escala (0 = I) que recorre un ciclo, del I al I: 8 acordes. */
export function gradosDelCiclo(ciclo: Ciclo): number[] {
  return Array.from({ length: 8 }, (_, i) => (i * (ciclo - 1)) % 7);
}

/** Todas las posiciones cerradas (cada inversión) de unas clases de altura, cerca de `centro`. */
function cerradas(pcs: readonly number[], centro: number): number[][] {
  const res: number[][] = [];
  for (let inv = 0; inv < pcs.length; inv++) {
    const orden = [...pcs.slice(inv), ...pcs.slice(0, inv)];
    for (const base of [centro - 12, centro, centro + 12]) {
      let previa = base - 1;
      const voces = orden.map((pc) => {
        let m = previa + 1 + ((pc - (previa + 1)) % 12 + 12) % 12;
        previa = m;
        return m;
      });
      res.push(voces);
    }
  }
  return res;
}

/** El siguiente acorde en la posición cerrada que menos mueve las voces (suma de distancias). */
function masCercana(anterior: readonly number[], pcs: readonly number[]): number[] {
  const media = anterior.reduce((a, b) => a + b, 0) / anterior.length;
  let mejor: number[] = [];
  let coste = Infinity;
  for (const c of cerradas(pcs, Math.round(media) - 6)) {
    if (c.length !== anterior.length) continue;
    // Distancia total; a igualdad, gana la que deja más voces quietas (notas comunes).
    const d = c.reduce((s, m, i) => s + Math.abs(m - anterior[i]) + (m === anterior[i] ? 0 : 0.1), 0);
    if (d < coste) {
      coste = d;
      mejor = c;
    }
  }
  return mejor;
}

/** Drop 2: la segunda voz empezando por arriba baja una octava (la disposición típica en guitarra). */
export const drop2 = (voces: readonly number[]) => {
  if (voces.length < 4) return [...voces];
  const v = [...voces];
  v[v.length - 2] -= 12;
  return v.sort((a, b) => a - b);
};

/**
 * Secuencia de un ciclo en una tónica: los acordes del I al I con la conducción
 * de voces más cercana. Las voces se calculan en posición cerrada (cada una va a
 * la nota más próxima del acorde siguiente) y, si se pide, se pasan a drop 2.
 */
export function secuenciaCiclo(tonica: string, ciclo: Ciclo, tipo: Tipo, disposicion: 'cerrada' | 'drop2' = 'cerrada'): AcordeCiclo[] {
  const grados = gradosDelCiclo(ciclo);
  const acordes = grados.map((g) => {
    const [sufijo, formula] = DIATONICOS[tipo][g];
    const raiz = notaDeGrado(tonica, ['1', '2', '3', '4', '5', '6', '7'][g]);
    return {
      romano: ROMANOS[g] + sufijo,
      simbolo: formatNota(raiz) + sufijo,
      raiz,
      formula: formula as readonly string[],
      pcs: formula.map((x) => (pitchClass(raiz) + semitonosGrado(x)) % 12),
    };
  });
  // Primer acorde en posición fundamental, con la raíz entre E3 y D#4 (registro medio de la guitarra).
  const pc0 = acordes[0].pcs[0];
  const inicio = 52 + ((pc0 - 4 + 12) % 12);
  let voces = acordes[0].pcs.map((pc) => inicio + ((pc - pc0 + 12) % 12));
  const cerradasSeguidas: number[][] = [voces];
  for (const a of acordes.slice(1)) {
    voces = masCercana(voces, a.pcs);
    cerradasSeguidas.push(voces);
  }
  return acordes.map((a, i) => {
    const v = disposicion === 'drop2' ? drop2(cerradasSeguidas[i]) : cerradasSeguidas[i];
    const previas = i > 0 ? new Set(disposicion === 'drop2' ? drop2(cerradasSeguidas[i - 1]) : cerradasSeguidas[i - 1]) : new Set<number>();
    return {
      romano: a.romano,
      simbolo: a.simbolo,
      voces: v,
      notas: v.map((m) => {
        const k = a.pcs.indexOf(m % 12);
        return { nota: formatNota(notaDeGrado(a.raiz, a.formula[k])), grado: a.formula[k], comun: previas.has(m) };
      }),
    };
  });
}

/** Audio: cada acorde dura `pulsos` pulsos; con `sostenido`, las notas que se repiten se ligan. */
export function eventosCiclo(acordes: readonly AcordeCiclo[], bpm: number, pulsos = 4, sostenido = false): { eventos: Evento[]; duracion: number } {
  const dur = (60 / bpm) * pulsos;
  const eventos = acordes.flatMap((a, i) => a.voces.map((midi) => ({ midi, inicio: i * dur, duracion: sostenido ? dur : dur * 0.92 })));
  return { eventos: sostenido ? ligarRepetidos(eventos) : eventos, duracion: acordes.length * dur };
}
