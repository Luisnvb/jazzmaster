// Cambios de Coltrane: progresiones que recorren tres tonalidades a distancia de
// tercera mayor (I, bVI, III), cada una con su dominante. Aquí: el centro tonal de
// cada acorde, la grafía sencilla de las raíces y el ciclo de quintas con el
// triángulo de los centros. Funciones puras, sin DOM.
import { lineasGuia, type AcordeGuia } from './notas-guia.ts';
import type { AcordeGrado } from './progresiones.ts';
import { formatNota, notaDeGrado, parseNota, pitchClass, type Nota } from './teoria.ts';

const mod = (n: number) => ((n % 12) + 12) % 12;
const NATURALES: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };
/** Nombre de cada tonalidad mayor por su clase de altura, como se suele escribir. */
export const NOMBRE_TONALIDAD = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Nota sin grafías raras: ni dobles alteraciones ni E#, B#, Fb, Cb (A# y D# se quedan: son notas de B mayor). */
export function sencilla(n: Nota): Nota {
  const pc = pitchClass(n);
  if (n.alteracion === 0) return n;
  if (NATURALES[pc] !== undefined) return parseNota(NATURALES[pc]);
  if (Math.abs(n.alteracion) > 1) return parseNota(NOMBRE_TONALIDAD[pc]);
  return n;
}

/** Raíz de un acorde como se nombran las tonalidades: Bb7 y no A#7, Ebmaj7 y no D#maj7. */
export const raizSencilla = (tonica: string, a: AcordeGrado) => {
  const n = sencilla(notaDeGrado(tonica, a.grado));
  return /^(A#|D#|G#)$/.test(formatNota(n)) ? parseNota(NOMBRE_TONALIDAD[pitchClass(n)]) : n;
};

/** Cifrado con la raíz en grafía sencilla: (B, VII7) → Bb7 y no A#7. */
export const simboloSencillo = (tonica: string, a: AcordeGrado) => formatNota(raizSencilla(tonica, a)) + a.sufijo;

export interface Centro {
  /** Clase de altura de la tonalidad a la que pertenece el acorde. */
  pc: number;
  nombre: string;
  /** Papel en esa tonalidad: 'Imaj7', 'V7', 'IIm7'. */
  papel: string;
}

/**
 * Centro tonal de cada acorde: un maj7 es un centro; un dominante va a la
 * tonalidad una cuarta por encima; un m7 es el II de la tonalidad un tono por
 * debajo (el de su ii–V). Lo demás, su propia raíz.
 */
export function centros(tonica: string, compases: readonly AcordeGrado[][]): Centro[] {
  return compases.flat().map((a) => {
    const r = pitchClass(notaDeGrado(tonica, a.grado));
    const [pc, papel] =
      a.grupo === 'dom7' || a.grupo === 'alt7' ? [mod(r + 5), 'V7'] : a.grupo === 'm7' ? [mod(r - 2), 'IIm7'] : [r, a.grupo === 'maj7' ? 'Imaj7' : a.sufijo];
    return { pc, nombre: NOMBRE_TONALIDAD[pc], papel };
  });
}

/** Las tonalidades distintas de la progresión, en el orden en que aparecen. */
export const centrosDistintos = (cs: readonly Centro[]) => [...new Set(cs.map((c) => c.pc))];

/** Notas guía de la progresión, con los nombres de las notas en grafía sencilla. */
export function guiaSencilla(tonica: string, compases: readonly AcordeGrado[][]): AcordeGuia[] {
  const acordes = compases.flat();
  return lineasGuia(tonica, compases).map((g, i) => {
    const raiz = raizSencilla(tonica, acordes[i]);
    return {
      ...g,
      simbolo: simboloSencillo(tonica, acordes[i]),
      voces: g.voces.map((v) => ({ ...v, nota: formatNota(sencilla(notaDeGrado(raiz, v.grado))) })) as AcordeGuia['voces'],
    };
  });
}

/** Distancia entre dos centros, en palabras: 'baja una 3ª mayor', 'sube una 4ª'… */
export function salto(de: number, a: number): string {
  const s = mod(a - de);
  const NOMBRES: Record<number, string> = {
    1: 'sube medio tono',
    2: 'sube un tono',
    3: 'sube una 3ª menor',
    4: 'sube una 3ª mayor',
    5: 'sube una 4ª',
    6: 'tritono',
    7: 'baja una 4ª',
    8: 'baja una 3ª mayor',
    9: 'baja una 3ª menor',
    10: 'baja un tono',
    11: 'baja medio tono',
  };
  return NOMBRES[s] ?? 'el mismo';
}

/**
 * Ciclo de quintas con los centros de la progresión unidos (en los cambios de
 * Coltrane, un triángulo equilátero: una tríada aumentada). `activo` resalta uno.
 */
export function cicloSVG(centrosPc: readonly number[], activo: number | null = null): string {
  const R = 92;
  const c = 120;
  const pos = (pc: number) => {
    // Orden del ciclo de quintas: C arriba, G a la derecha…
    const k = mod(pc * 7);
    const ang = (k / 12) * 2 * Math.PI - Math.PI / 2;
    return [c + R * Math.cos(ang), c + R * Math.sin(ang)];
  };
  const linea = centrosPc.length > 1
    ? `<polygon class="triangulo" points="${centrosPc.map((pc) => pos(pc).map((x) => x.toFixed(1)).join(',')).join(' ')}" />`
    : '';
  const puntos = NOMBRE_TONALIDAD.map((nombre, pc) => {
    const [x, y] = pos(pc);
    const clase = pc === activo ? 'activo' : centrosPc.includes(pc) ? 'centro' : '';
    return `<g class="tono ${clase}" data-pc="${pc}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" /><text x="${x.toFixed(1)}" y="${(y + 4.5).toFixed(1)}" text-anchor="middle">${nombre}</text></g>`;
  }).join('');
  return `<svg class="ciclo" viewBox="0 0 240 240" role="img" aria-label="Ciclo de quintas con los centros tonales">
    <circle class="aro" cx="${c}" cy="${c}" r="${R}" />${linea}${puntos}
  </svg>`;
}
