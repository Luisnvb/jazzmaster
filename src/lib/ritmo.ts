// Ritmo: una rejilla de golpes (corcheas, tresillos o semicorcheas) sobre uno o
// dos compases, patrones de acompañamiento y claves, swing regulable y el
// metrónomo en los tiempos que se elijan. Funciones puras, sin DOM.
import type { Evento } from './secuencias.ts';
import { pitchClass, parseNota } from './teoria.ts';

/** Divisiones por pulso: 2 = corcheas, 3 = tresillos, 4 = semicorcheas. */
export type Division = 2 | 3 | 4;

export interface Rejilla {
  division: Division;
  /** Pulsos por compás. */
  pulsos: number;
  compases: number;
  /** Índices de las celdas con golpe (0 = primer pulso del primer compás). */
  golpes: number[];
}

export interface PatronRitmo extends Rejilla {
  id: string;
  nombre: string;
  descripcion: string;
  /** Swing con el que se toca (en %, 50 = recto); sin él, se deja el que haya. */
  swing?: number;
}

export const PATRONES_RITMO: PatronRitmo[] = [
  { id: 'negras', nombre: 'Negras (Freddie Green)', descripcion: 'Un golpe corto en cada pulso, sin acentos: la base del swing de big band.', division: 2, pulsos: 4, compases: 1, golpes: [0, 2, 4, 6], swing: 64 },
  { id: 'charleston', nombre: 'Charlestón', descripcion: 'El 1 y el "y" del 2. El ritmo de acompañamiento más usado en swing.', division: 2, pulsos: 4, compases: 1, golpes: [0, 3], swing: 64 },
  { id: 'charleston-invertido', nombre: 'Charlestón invertido', descripcion: 'El "y" del 1 y el 3: el mismo ritmo empezando a contratiempo.', division: 2, pulsos: 4, compases: 1, golpes: [1, 4], swing: 64 },
  { id: 'anticipacion', nombre: 'Anticipaciones', descripcion: 'El acorde del compás siguiente llega en el "y" del 4.', division: 2, pulsos: 4, compases: 2, golpes: [0, 7, 11, 15], swing: 64 },
  { id: 'dos-y-cuatro', nombre: 'Contratiempos en 2 y 4', descripcion: 'Golpes en los tiempos débiles, como el charles de la batería.', division: 2, pulsos: 4, compases: 1, golpes: [2, 6], swing: 64 },
  { id: 'bossa', nombre: 'Clave de bossa nova', descripcion: 'La clave brasileña (3-2), en dos compases.', division: 2, pulsos: 4, compases: 2, golpes: [0, 3, 6, 10, 13], swing: 50 },
  { id: 'son-32', nombre: 'Clave de son 3-2', descripcion: 'Tres golpes en el primer compás y dos en el segundo.', division: 2, pulsos: 4, compases: 2, golpes: [0, 3, 6, 10, 12], swing: 50 },
  { id: 'son-23', nombre: 'Clave de son 2-3', descripcion: 'La misma clave empezando por el compás de dos golpes.', division: 2, pulsos: 4, compases: 2, golpes: [2, 4, 8, 11, 14], swing: 50 },
  { id: 'tres-sobre-cuatro', nombre: '3 sobre 4 (hemiola)', descripcion: 'Un golpe cada tres corcheas: un ritmo de 3 encima del compás de 4.', division: 2, pulsos: 4, compases: 3, golpes: [0, 3, 6, 9, 12, 15, 18, 21] },
  { id: 'tresillos-negra', nombre: 'Tresillos de negra', descripcion: 'Tres golpes iguales cada dos pulsos.', division: 3, pulsos: 4, compases: 1, golpes: [0, 2, 4, 6, 8, 10] },
  { id: 'shuffle', nombre: 'Shuffle', descripcion: 'Largo-corto en tresillo, en cada pulso.', division: 3, pulsos: 4, compases: 1, golpes: [0, 2, 3, 5, 6, 8, 9, 11] },
  { id: 'funk', nombre: 'Funk en semicorcheas', descripcion: 'Golpes sincopados en semicorcheas.', division: 4, pulsos: 4, compases: 1, golpes: [0, 3, 6, 8, 10, 13], swing: 50 },
];

/** Nombre de cada celda dentro del pulso, para contar en voz alta. */
export function etiquetaCelda(division: Division, k: number): string {
  const sub = k % division;
  if (sub === 0) return String(Math.floor(k / division) + 1);
  if (division === 2) return 'y';
  if (division === 3) return sub === 1 ? 'tri' : 'pa';
  return ['', 'e', 'y', 'a'][sub];
}

export const celdasPorCompas = (r: Rejilla) => r.division * r.pulsos;

/**
 * Momento (en pulsos desde el principio) de una celda. Con corcheas, `swing`
 * retrasa la del contratiempo: 0.5 = recto, 2/3 = tresillo, 0.75 = muy marcado.
 */
export function posicionCelda(r: Rejilla, celda: number, swing = 0.5): number {
  const pulso = Math.floor(celda / r.division);
  const sub = celda % r.division;
  if (r.division === 2) return pulso + (sub === 1 ? swing : 0);
  return pulso + sub / r.division;
}

export interface OpcionesRitmo {
  swing?: number;
  /** Clics del metrónomo: en cada pulso, solo en 2 y 4, solo en el 1 o ninguno. */
  metronomo?: 'todos' | 'dos-cuatro' | 'uno' | 'no';
  /** Golpes cortos (staccato) o hasta el siguiente golpe. */
  cortos?: boolean;
  /** Notas MIDI del acorde de cada golpe. */
  acorde?: readonly number[];
}

/** Un acorde de 13 sin quinta (raíz, b7, 3, 13) sobre una tónica: el sonido típico del acompañamiento. */
export function acordeGolpe(tonica: string): number[] {
  const pc = pitchClass(parseNota(tonica));
  const raiz = 43 + ((pc - 7 + 12) % 12); // entre G2 y F#3
  return [raiz, raiz + 10, raiz + 16, raiz + 21];
}

/** Eventos de la rejilla a un tempo, con los clics del metrónomo y los momentos de cada celda. */
export function eventosRitmo(r: Rejilla, bpm: number, op: OpcionesRitmo = {}) {
  const pulso = 60 / bpm;
  const swing = op.swing ?? 0.5;
  const total = celdasPorCompas(r) * r.compases;
  const duracion = r.pulsos * r.compases * pulso;
  const eventos: Evento[] = [];
  const golpes = [...new Set(r.golpes)].filter((g) => g >= 0 && g < total).sort((a, b) => a - b);
  golpes.forEach((g, i) => {
    const inicio = posicionCelda(r, g, swing) * pulso;
    const siguiente = i + 1 < golpes.length ? posicionCelda(r, golpes[i + 1], swing) * pulso : duracion;
    const dur = op.cortos ? Math.min(pulso * 0.35, siguiente - inicio) : Math.max(0.05, siguiente - inicio - 0.02);
    for (const midi of op.acorde ?? []) eventos.push({ midi, inicio, duracion: dur });
  });
  const metro = op.metronomo ?? 'todos';
  for (let p = 0; p < r.pulsos * r.compases; p++) {
    const enCompas = p % r.pulsos;
    const suena = metro === 'todos' || (metro === 'uno' && enCompas === 0) || (metro === 'dos-cuatro' && enCompas % 2 === 1);
    if (suena) eventos.push({ midi: 0, inicio: p * pulso, duracion: 0.05, clic: enCompas === 0 || metro === 'dos-cuatro' ? 'fuerte' : 'debil' });
  }
  // Momento de cada celda (para marcar la que suena).
  const celdas = Array.from({ length: total }, (_, c) => posicionCelda(r, c, swing) * pulso);
  return { eventos, duracion, celdas };
}
