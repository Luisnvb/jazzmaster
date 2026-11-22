// Calculadora de intervalos (Herramientas): el intervalo entre dos notas escritas, con
// su nombre exacto (C–E# es una 3ª aumentada, no una 4ª justa), y la nota que queda a
// un intervalo de otra. Lo usa también el transpositor. Funciones puras, sin DOM.
import { formatNota, LETRAS, notaBajoGrado, notaDeGrado, parseNota, pitchClass, semitonosGrado } from './teoria.ts';

const mod = (n: number, m = 12) => ((n % m) + m) % m;

/** Números «justos» (los demás son mayores o menores): 1, 4, 5, 8, 11, 12, 15. */
const esJusto = (numero: number) => [1, 4, 5].includes(((numero - 1) % 7) + 1);

export type Calidad = 'justa' | 'mayor' | 'menor' | 'aumentada' | 'disminuida' | 'doble aumentada' | 'doble disminuida';

export interface Intervalo {
  /** Número escrito: 1 (unísono) … 8 (octava), 9, 10… */
  numero: number;
  calidad: Calidad;
  semitonos: number;
  /** Como grado (b3, #4, 5, bb7…), el que usan teoria.ts y las fórmulas. */
  grado: string;
  /** «3ª aumentada», «unísono», «8ª justa». */
  nombre: string;
}

const ORDINAL = (n: number) => (n === 1 ? 'unísono' : `${n}ª`);

/** Intervalo a partir de su número y sus semitonos. */
export function intervaloDe(numero: number, semitonos: number): Intervalo {
  const natural = semitonosGrado(String(numero));
  const dif = semitonos - natural;
  let calidad: Calidad;
  let alteracion: string;
  if (esJusto(numero)) {
    [calidad, alteracion] = dif === 0 ? ['justa', ''] : dif > 0 ? [dif === 1 ? 'aumentada' : 'doble aumentada', '#'.repeat(dif)] : [dif === -1 ? 'disminuida' : 'doble disminuida', 'b'.repeat(-dif)];
  } else {
    [calidad, alteracion] =
      dif === 0 ? ['mayor', ''] : dif === -1 ? ['menor', 'b'] : dif > 0 ? [dif === 1 ? 'aumentada' : 'doble aumentada', '#'.repeat(dif)] : [dif === -2 ? 'disminuida' : 'doble disminuida', 'b'.repeat(-dif)];
  }
  const ord = ORDINAL(numero);
  const nombre = numero === 1 && calidad === 'justa' ? 'unísono' : numero === 1 ? `unísono ${calidad.replace(/a$/, "o")}` : `${ord} ${calidad}`;
  return { numero, calidad, semitonos, grado: `${alteracion}${numero}`, nombre };
}

/**
 * Intervalo ascendente de `a` a `b` (dentro de la octava; la octava justa si son la
 * misma nota y `octava` es true). Cuenta letras para el número y semitonos para la
 * calidad: C→E# = 3ª aumentada; C→F = 4ª justa.
 */
export function intervaloEntre(a: string, b: string, octava = false): Intervalo {
  const na = parseNota(a);
  const nb = parseNota(b);
  const pasos = mod(LETRAS.indexOf(nb.letra) - LETRAS.indexOf(na.letra), 7);
  let numero = pasos + 1;
  let semis = mod(pitchClass(nb) - pitchClass(na));
  const natural = semitonosGrado(String(numero));
  // Llevar los semitonos al entorno del número (B→C# es 2ª, no 14 semitonos; C→Cb es 8ª disminuida).
  if (semis - natural > 6) semis -= 12;
  if (natural - semis > 6) semis += 12;
  if (numero === 1 && (semis < 0 || (octava && semis === 0))) {
    numero = 8;
    semis += 12;
  }
  return intervaloDe(numero, semis);
}

/** Inversión (lo que falta hasta la octava): 3ª mayor ↔ 6ª menor, 4ª aumentada ↔ 5ª disminuida. */
export function inversion(i: Intervalo): Intervalo {
  let numero = i.numero;
  let semitonos = i.semitonos;
  // Los compuestos (9ª, 10ª…) se reducen a la octava antes de invertir.
  while (numero > 8) {
    numero -= 7;
    semitonos -= 12;
  }
  return intervaloDe(9 - numero, 12 - semitonos);
}

/** La nota a un intervalo (grado) de otra, hacia arriba o hacia abajo. */
export const notaA = (desde: string, grado: string, direccion: 'arriba' | 'abajo') =>
  formatNota(direccion === 'arriba' ? notaDeGrado(desde, grado) : notaBajoGrado(desde, grado));

/** Intervalos que ofrece la calculadora, en orden de tamaño. */
export const GRADOS_CALCULADORA = ['1', 'b2', '2', '#2', 'b3', '3', '4', '#4', 'b5', '5', '#5', 'b6', '6', 'bb7', 'b7', '7', '8', 'b9', '9', '#9', '10', '11', '#11', '12', 'b13', '13'];

/** Mismo sonido, otra escritura: los nombres de los intervalos de los mismos semitonos (dentro de 2 alteraciones). */
export function enarmonicos(i: Intervalo): Intervalo[] {
  const res: Intervalo[] = [];
  for (let numero = Math.max(1, i.numero - 1); numero <= i.numero + 1; numero++) {
    if (numero === i.numero) continue;
    const x = intervaloDe(numero, i.semitonos);
    if (!x.calidad.startsWith('doble')) res.push(x);
  }
  return res;
}

const CALIDAD_EN: Record<Calidad, string> = {
  justa: 'perfect',
  mayor: 'major',
  menor: 'minor',
  aumentada: 'augmented',
  disminuida: 'diminished',
  'doble aumentada': 'doubly augmented',
  'doble disminuida': 'doubly diminished',
};

/** Ordinal inglés: 2nd, 3rd, 4th… 11th, 12th, 13th. */
const ordinalEn = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

/** Nombre del intervalo en un idioma: «3ª mayor» / «major 3rd», «unísono» / «unison», «8ª justa» / «perfect octave». */
export function nombreIntervalo(i: Pick<Intervalo, 'numero' | 'calidad' | 'nombre'>, idioma: 'es' | 'en' = 'es'): string {
  if (idioma === 'es') return i.nombre;
  if (i.numero === 1) return i.calidad === 'justa' ? 'unison' : `${CALIDAD_EN[i.calidad]} unison`;
  return `${CALIDAD_EN[i.calidad]} ${i.numero === 8 ? 'octave' : ordinalEn(i.numero)}`;
}
