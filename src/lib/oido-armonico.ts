// Entrenador de oído armónico (sin DOM): reconocer la cualidad de un acorde, los
// grados de una cadena de acordes a partir de la tónica y progresiones enteras.
import { analizarProgresion, parseAcordeGrado, secuenciaProgresion, type Progresion, type Tramo } from './progresiones.ts';
import type { Evento } from './secuencias.ts';
import { notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

export type ModoOido = 'cualidad' | 'cadena' | 'progresion';

export interface Cualidad {
  sufijo: string;
  nombre: string;
  /** Tríada o cuatriada, para elegir en bloque en los ajustes. */
  tipo: 'triada' | 'cuatriada';
}

export const CUALIDADES: readonly Cualidad[] = [
  { sufijo: '', nombre: 'Mayor', tipo: 'triada' },
  { sufijo: 'm', nombre: 'Menor', tipo: 'triada' },
  { sufijo: '°', nombre: 'Disminuida', tipo: 'triada' },
  { sufijo: '+', nombre: 'Aumentada', tipo: 'triada' },
  { sufijo: 'sus4', nombre: 'Sus4', tipo: 'triada' },
  { sufijo: 'maj7', nombre: 'Maj7', tipo: 'cuatriada' },
  { sufijo: '7', nombre: 'Dominante (7)', tipo: 'cuatriada' },
  { sufijo: 'm7', nombre: 'Menor 7', tipo: 'cuatriada' },
  { sufijo: 'm7b5', nombre: 'Semidisminuido (m7b5)', tipo: 'cuatriada' },
  { sufijo: '°7', nombre: 'Disminuido (°7)', tipo: 'cuatriada' },
  { sufijo: 'mMaj7', nombre: 'Menor maj7', tipo: 'cuatriada' },
  { sufijo: '6', nombre: 'Sexta (6)', tipo: 'cuatriada' },
  { sufijo: 'm6', nombre: 'Menor 6', tipo: 'cuatriada' },
  { sufijo: '7sus4', nombre: '7sus4', tipo: 'cuatriada' },
  { sufijo: 'maj7#5', nombre: 'Maj7#5', tipo: 'cuatriada' },
];

/** Acordes diatónicos de la tonalidad mayor y algunos de fuera, para las cadenas. */
export const GRADOS_DIATONICOS = ['Imaj7', 'IIm7', 'IIIm7', 'IVmaj7', 'V7', 'VIm7', 'VIIm7b5'] as const;
export const GRADOS_EXTRA = ['VI7', 'II7', 'III7', 'bVII7', 'IVm6', 'bVImaj7', 'bII7', '#I°7'] as const;

export type Pregunta =
  | { modo: 'cualidad'; tonica: string; sufijo: string }
  | { modo: 'cadena'; tonica: string; acordes: string[] }
  | { modo: 'progresion'; tonica: string; id: string };

export interface Marcador {
  aciertos: number;
  intentos: number;
}

const elegir = <T>(lista: readonly T[], azar: () => number): T => lista[Math.floor(azar() * lista.length)];

/** Cualidad al azar, sin repetir la anterior si hay alternativa. */
export function nuevaCualidad(sufijos: readonly string[], tonicas: readonly string[], anterior?: Pregunta, azar = Math.random): Pregunta {
  if (!sufijos.length || !tonicas.length) throw new Error('Hace falta al menos una cualidad y una tónica');
  const previa = anterior?.modo === 'cualidad' ? anterior.sufijo : undefined;
  const opciones = sufijos.length > 1 ? sufijos.filter((s) => s !== previa) : sufijos;
  return { modo: 'cualidad', tonica: elegir(tonicas, azar), sufijo: elegir(opciones, azar) };
}

/**
 * Cadena que empieza siempre en el I (para situar la tonalidad) y sigue con
 * `largo - 1` acordes al azar del repertorio dado, sin repetir el inmediato anterior.
 */
export function nuevaCadena(grados: readonly string[], largo: number, tonicas: readonly string[], azar = Math.random): Pregunta {
  const resto = grados.filter((g) => g !== 'Imaj7');
  if (!resto.length || !tonicas.length) throw new Error('Hace falta al menos un acorde distinto del I y una tónica');
  const acordes = ['Imaj7'];
  while (acordes.length < largo) {
    const opciones = grados.filter((g) => g !== acordes.at(-1));
    acordes.push(elegir(opciones.length ? opciones : resto, azar));
  }
  return { modo: 'cadena', tonica: elegir(tonicas, azar), acordes };
}

/** Progresión al azar, sin repetir la anterior si hay alternativa. */
export function nuevaProgresion(ids: readonly string[], tonicas: readonly string[], anterior?: Pregunta, azar = Math.random): Pregunta {
  if (!ids.length || !tonicas.length) throw new Error('Hace falta al menos una progresión y una tónica');
  const previa = anterior?.modo === 'progresion' ? anterior.id : undefined;
  const opciones = ids.length > 1 ? ids.filter((i) => i !== previa) : ids;
  return { modo: 'progresion', tonica: elegir(tonicas, azar), id: elegir(opciones, azar) };
}

/** Acierto por cada acorde de la cadena (el primero, el I, se da por sabido). */
export function corregirCadena(pregunta: Pregunta & { modo: 'cadena' }, respuesta: readonly string[]): boolean[] {
  return pregunta.acordes.slice(1).map((a, i) => respuesta[i] === a);
}

export const sumar = (m: Marcador, acierto: boolean): Marcador => ({ aciertos: m.aciertos + (acierto ? 1 : 0), intentos: m.intentos + 1 });

/**
 * Audio de un acorde suelto: en bloque y después arpegiado hacia arriba, con la
 * raíz entre G2 y F#3 y las notas en posición fundamental por encima.
 */
export function eventosCualidad(tonica: string, sufijo: string, bpm: number): { eventos: Evento[]; duracion: number } {
  const a = parseAcordeGrado(`I${sufijo}`);
  const raiz = 43 + ((pitchClass(notaDeGrado(tonica, '1')) - 7 + 12) % 12);
  const alturas = a.formula.map((g) => raiz + 12 + semitonosGrado(g));
  const pulso = 60 / bpm;
  const eventos: Evento[] = [{ midi: raiz, inicio: 0, duracion: pulso * 2 }, ...alturas.map((midi) => ({ midi, inicio: 0.02, duracion: pulso * 2 }))];
  const desde = pulso * 2.5;
  alturas.forEach((midi, i) => eventos.push({ midi, inicio: desde + (i * pulso) / 2, duracion: pulso / 2 }));
  return { eventos, duracion: desde + (alturas.length * pulso) / 2 + pulso };
}

/** Audio de una cadena: un acorde cada dos pulsos. */
export function eventosCadena(tonica: string, acordes: readonly string[], bpm: number): { eventos: Evento[]; tramos: Tramo[]; duracion: number } {
  return secuenciaProgresion(tonica, acordes.map((a) => [parseAcordeGrado(a)]), bpm, 2);
}

/** Audio de una progresión del catálogo. */
export function eventosProgresionOido(tonica: string, p: Progresion, bpm: number) {
  return secuenciaProgresion(tonica, analizarProgresion(p.compases), bpm, p.pulsos ?? 4);
}
