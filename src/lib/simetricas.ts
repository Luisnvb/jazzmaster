// Escalas simétricas: la disminuida (en sus dos órdenes) y la de tonos enteros.
// Se repiten a un intervalo fijo (3 trastes la disminuida, 2 la de tonos enteros),
// así que el mismo dibujo vale en varias posiciones y para varios acordes.
// Funciones puras, sin DOM.
import { ULTIMA_POSICION } from './arpegios.ts';
import { formatNota, notaDeGrado, semitonosGrado } from './teoria.ts';

export interface Simetrica {
  id: string;
  nombre: string;
  /** Grados sobre la raíz del acorde. */
  formula: string[];
  /** Acorde sobre el que se usa (sufijo del cifrado) y sus notas, para marcarlas. */
  sufijo: string;
  acorde: string[];
  /** Semitonos tras los que la escala vuelve a tener las mismas notas. */
  periodo: number;
  /** Grados de las raíces que comparten la escala (cada `periodo` semitonos). */
  ejes: string[];
  uso: string;
}

export const SIMETRICAS: readonly Simetrica[] = [
  {
    id: 'semitono-tono',
    nombre: 'Disminuida semitono-tono',
    formula: ['1', 'b9', '#9', '3', '#11', '5', '13', 'b7'],
    sufijo: '7b9',
    acorde: ['1', '3', '5', 'b7'],
    periodo: 3,
    ejes: ['1', 'b3', 'b5', '6'],
    uso: 'Dominantes con b9, #9, #11 y 13 natural (7b9, 13b9). La misma escala vale para los cuatro dominantes a distancia de 3ª menor.',
  },
  {
    id: 'tono-semitono',
    nombre: 'Disminuida tono-semitono',
    formula: ['1', '2', 'b3', '4', 'b5', '#5', '6', '7'],
    sufijo: '°7',
    acorde: ['1', 'b3', 'b5', '6'],
    periodo: 3,
    ejes: ['1', 'b3', 'b5', '6'],
    uso: 'Acordes °7, sobre todo los de paso (I–#I°7–IIm7). Las notas de fuera del acorde son las del °7 que está un tono por encima.',
  },
  {
    id: 'tonos-enteros',
    nombre: 'Tonos enteros',
    formula: ['1', '9', '3', '#11', '#5', 'b7'],
    sufijo: '7#5',
    acorde: ['1', '3', '#5', 'b7'],
    periodo: 2,
    ejes: ['1', '2', '3', '#4', '#5', 'b7'],
    uso: 'Dominantes aumentados (7#5, 9#5, 7#11). Solo hay dos escalas de tonos enteros distintas: cada una sirve para seis dominantes.',
  },
];

/** Cifrados de los acordes que comparten la escala con el de la raíz dada: C7b9 → C7b9, Eb7b9, Gb7b9, A7b9. */
export const acordesComunes = (raiz: string, s: Simetrica) => s.ejes.map((g) => formatNota(notaDeGrado(raiz, g)) + s.sufijo);

/** Si dos fórmulas sobre la misma raíz dan las mismas notas una vez transportadas `semitonos`. */
export function esSimetrica(formula: readonly string[], semitonos: number): boolean {
  const pcs = new Set(formula.map((g) => (semitonosGrado(g) + 120) % 12));
  return [...pcs].every((pc) => pcs.has((pc + semitonos) % 12));
}

/**
 * Traste inicial de la siguiente posición con el mismo dibujo, dentro de
 * 1 … ULTIMA_POSICION. Al pasarse por arriba vuelve a la más baja equivalente
 * y al pasarse por abajo, a la más alta (equivalentes = a distancia de `periodo`).
 */
export function moverPosicion(desde: number, periodo: number, sentido: 1 | -1): number {
  const d = desde + sentido * periodo;
  if (d > ULTIMA_POSICION) return ((d - 1) % periodo) + 1;
  if (d < 1) return d + periodo * Math.floor((ULTIMA_POSICION - d) / periodo);
  return d;
}
