// Lógica del entrenador de oído de intervalos (sin DOM ni audio).
import type { ModoIntervalo } from './secuencias.ts';

export interface Pregunta {
  /** id del intervalo (colección intervalos). */
  intervalo: string;
  modo: ModoIntervalo;
  tonica: string;
}

export interface Marcador {
  aciertos: number;
  intentos: number;
}

const elegir = <T>(lista: readonly T[], azar: () => number): T => lista[Math.floor(azar() * lista.length)];

/**
 * Elige una pregunta al azar entre los intervalos, modos y tónicas permitidos.
 * Evita repetir exactamente el mismo intervalo y modo que la anterior cuando hay alternativa.
 */
export function nuevaPregunta(
  intervalos: readonly string[],
  modos: readonly ModoIntervalo[],
  tonicas: readonly string[],
  anterior?: Pregunta,
  azar: () => number = Math.random,
): Pregunta {
  if (!intervalos.length || !modos.length || !tonicas.length) {
    throw new Error('Hace falta al menos un intervalo, un modo y una tónica');
  }
  const hayAlternativa = intervalos.length * modos.length > 1;
  for (;;) {
    const p = { intervalo: elegir(intervalos, azar), modo: elegir(modos, azar), tonica: elegir(tonicas, azar) };
    if (!anterior || !hayAlternativa || p.intervalo !== anterior.intervalo || p.modo !== anterior.modo) return p;
  }
}

export function responder(marcador: Marcador, pregunta: Pregunta, respuesta: string): { acierto: boolean; marcador: Marcador } {
  const acierto = respuesta === pregunta.intervalo;
  return { acierto, marcador: { aciertos: marcador.aciertos + (acierto ? 1 : 0), intentos: marcador.intentos + 1 } };
}

/** Canciones de referencia que sirven de pista según el modo (el armónico usa las ascendentes). */
export function pista(referencias: { ascendente: string[]; descendente: string[] }, modo: ModoIntervalo): string[] {
  return modo === 'descendente' ? referencias.descendente : referencias.ascendente;
}
