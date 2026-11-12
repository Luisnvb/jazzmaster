import { parseNota, pitchClass } from './teoria.ts';

export type Traste = number | 'x';

/** Nombre de la cuerda por índice (0 = 6ª … 5 = 1ª). */
export const CUERDAS = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'] as const;

/** Número de cuerda (6, 5, 4…) donde está el bajo: la primera tocada desde la 6ª. */
export function cuerdaDelBajo(trastes: readonly Traste[]): number {
  const i = trastes.findIndex((t) => t !== 'x');
  if (i === -1) throw new Error('Voicing sin cuerdas tocadas');
  return 6 - i;
}

/**
 * Transporta un voicing moviendo el mismo dibujo. Elige la posición más baja
 * posible sin trastes negativos, y no usa cuerdas al aire salvo que el dibujo
 * original las tenga (en ese caso solo deja transportar a la misma tónica).
 */
export function transportar(trastes: readonly Traste[], tonicaOrigen: string, tonicaDestino: string): Traste[] {
  const tocados = trastes.filter((t): t is number => t !== 'x');
  const tieneAlAire = tocados.includes(0);
  let d = (pitchClass(parseNota(tonicaDestino)) - pitchClass(parseNota(tonicaOrigen)) + 12) % 12;
  if (tieneAlAire && d !== 0) throw new Error('Un voicing con cuerdas al aire no se puede transportar');
  const minimo = Math.min(...tocados);
  // Bajar una octava si cabe sin llegar al traste 0 (el dibujo cerrado no usa cuerdas al aire).
  if (minimo + d - 12 >= 1) d -= 12;
  return trastes.map((t) => (t === 'x' ? 'x' : t + d));
}
