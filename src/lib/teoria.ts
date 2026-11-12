// Módulo de teoría compartido: a partir de una tónica y un grado (o una fórmula
// de grados) calcula las notas con la ortografía correcta.
//
// La ortografía sale del propio grado: el número decide la letra (3 → dos letras
// por encima de la tónica) y la alteración se ajusta para dar los semitonos
// exactos. Así, la b7 de C es Bb y nunca A#, y la bb7 de C°7 es Bbb.

export const LETRAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
type Letra = (typeof LETRAS)[number];

/** Semitonos de cada letra natural respecto a C. */
const PC_LETRA: Record<Letra, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Semitonos de los grados naturales (escala mayor) 1–7. */
const SEMITONOS_GRADO = [0, 2, 4, 5, 7, 9, 11];

/** Tónicas que ofrecen los selectores, con la ortografía habitual. */
export const TONICAS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export interface Nota {
  letra: Letra;
  /** -2 = bb, -1 = b, 0 = natural, 1 = #, 2 = ## */
  alteracion: number;
}

export interface Grado {
  /** Número tal como se escribe (1–15): 9 y 2 dan la misma letra. */
  numero: number;
  alteracion: number;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function parseNota(texto: string): Nota {
  const m = /^([A-G])(bb|b|##|#|x)?$/.exec(texto.trim());
  if (!m) throw new Error(`Nota no válida: "${texto}"`);
  const alt = { '': 0, b: -1, bb: -2, '#': 1, '##': 2, x: 2 }[m[2] ?? ''];
  return { letra: m[1] as Letra, alteracion: alt! };
}

export function formatNota(n: Nota): string {
  const alt = n.alteracion < 0 ? 'b'.repeat(-n.alteracion) : '#'.repeat(n.alteracion);
  return n.letra + alt;
}

export function parseGrado(texto: string): Grado {
  const m = /^(bb|b|##|#)?(\d{1,2})$/.exec(texto.trim());
  if (!m) throw new Error(`Grado no válido: "${texto}"`);
  const numero = Number(m[2]);
  if (numero < 1 || numero > 15) throw new Error(`Grado fuera de rango: "${texto}"`);
  const alt = { '': 0, b: -1, bb: -2, '#': 1, '##': 2 }[m[1] ?? ''];
  return { numero, alteracion: alt! };
}

/** Semitonos de un grado sobre la tónica (b3 → 3, 9 → 14, bb7 → 9). */
export function semitonosGrado(grado: string | Grado): number {
  const g = typeof grado === 'string' ? parseGrado(grado) : grado;
  const octavas = Math.floor((g.numero - 1) / 7);
  return SEMITONOS_GRADO[(g.numero - 1) % 7] + 12 * octavas + g.alteracion;
}

/** Clase de altura (0–11, C = 0). */
export function pitchClass(n: Nota): number {
  return mod(PC_LETRA[n.letra] + n.alteracion, 12);
}

/** Nota que corresponde a un grado sobre una tónica, con ortografía correcta. */
export function notaDeGrado(tonica: string | Nota, grado: string | Grado): Nota {
  const t = typeof tonica === 'string' ? parseNota(tonica) : tonica;
  const g = typeof grado === 'string' ? parseGrado(grado) : grado;
  const letra = LETRAS[mod(LETRAS.indexOf(t.letra) + g.numero - 1, 7)];
  const objetivo = mod(pitchClass(t) + semitonosGrado(g), 12);
  // Diferencia entre la altura buscada y la letra natural, llevada a -6..5.
  const alteracion = mod(objetivo - PC_LETRA[letra] + 6, 12) - 6;
  return { letra, alteracion };
}

/** Notas de una fórmula: notasDeFormula('Bb', ['1','3','5','b7']) → ['Bb','D','F','Ab']. */
export function notasDeFormula(tonica: string, formula: readonly string[]): string[] {
  return formula.map((g) => formatNota(notaDeGrado(tonica, g)));
}

/** Número MIDI de una nota en una octava científica (C4 = 60). */
export function midi(n: Nota | string, octava: number): number {
  const nota = typeof n === 'string' ? parseNota(n) : n;
  // La octava pertenece a la letra: B#3 suena como C4 y Cb4 como B3.
  return 12 * (octava + 1) + PC_LETRA[nota.letra] + nota.alteracion;
}

/** Rango útil de la guitarra en afinación estándar (E2–E6). */
export const RANGO_GUITARRA = { min: midi('E', 2), max: midi('E', 6) } as const;

/**
 * Coloca una secuencia de alturas MIDI dentro del rango de la guitarra,
 * moviéndola entera por octavas para no alterar los intervalos.
 */
export function ajustarARango(notas: number[], rango = RANGO_GUITARRA): number[] {
  if (notas.length === 0) return notas;
  let desplazamiento = 0;
  const min = Math.min(...notas);
  const max = Math.max(...notas);
  while (min + desplazamiento < rango.min) desplazamiento += 12;
  while (max + desplazamiento > rango.max && min + desplazamiento - 12 >= rango.min) desplazamiento -= 12;
  return notas.map((n) => n + desplazamiento);
}
