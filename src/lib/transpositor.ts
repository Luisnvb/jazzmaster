// Transpositor (Herramientas): pasa un cifrado pegado (compases con barras, o una hoja
// con letra y acordes encima) a otro tono, o a la escritura de un instrumento
// transpositor (Bb, Eb, F). Solo cambia las líneas de acordes; la letra y el resto se
// quedan como están. Transporta por intervalo escrito (de Bb a D es una 3ª mayor: Eb →
// G), así la ortografía sale sola. Funciones puras, sin DOM.
import { intervaloEntre } from './calculadora-intervalos.ts';
import { leerCifrado, partesCifrado } from './cifrado-acorde.ts';
import { formatNota, notaBajoGrado, notaDeGrado, parseNota, pitchClass, type Nota } from './teoria.ts';

export type Grafia = 'auto' | 'bemoles' | 'sostenidos';

/** Cómo transportar: subir o bajar un intervalo (grado). */
export interface Transporte {
  grado: string;
  direccion: 'arriba' | 'abajo';
}

/** Instrumentos transpositores: lo que se sube al escribir para ellos desde el sonido real. */
export const INSTRUMENTOS_TRANSPOSITORES: { id: string; nombre: string; ejemplos: string; en: { nombre: string; ejemplos: string }; grado: string }[] = [
  { id: 'bb', nombre: 'Instrumento en Si♭', ejemplos: 'trompeta, clarinete, saxo tenor y soprano', en: { nombre: 'B♭ instrument', ejemplos: 'trumpet, clarinet, tenor and soprano sax' }, grado: '2' },
  { id: 'eb', nombre: 'Instrumento en Mi♭', ejemplos: 'saxo alto y barítono', en: { nombre: 'E♭ instrument', ejemplos: 'alto and baritone sax' }, grado: '6' },
  { id: 'f', nombre: 'Instrumento en Fa', ejemplos: 'trompa, corno inglés', en: { nombre: 'F instrument', ejemplos: 'French horn, cor anglais' }, grado: '5' },
];

/** Para escribir la parte de un instrumento: sube su intervalo. Para leerla en concierto: lo baja. */
export const transporteInstrumento = (grado: string, haciaInstrumento: boolean): Transporte => ({ grado, direccion: haciaInstrumento ? 'arriba' : 'abajo' });

/** De un tono a otro: el intervalo escrito entre las tónicas, hacia arriba. */
export const transporteEntreTonos = (de: string, a: string): Transporte => ({ grado: intervaloEntre(de, a).grado, direccion: 'arriba' });

/** Grado habitual para subir N semitonos (6 = b5: los bemoles son más comunes en jazz). */
const GRADO_SEMITONOS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
export const transporteSemitonos = (n: number): Transporte => {
  const s = ((n % 12) + 12) % 12;
  return { grado: GRADO_SEMITONOS[s], direccion: 'arriba' };
};

const NATURALES: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };
const BEMOLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Escritura legible: sin dobles alteraciones ni E#, B#, Fb, Cb; y con la grafía pedida. */
export function ajustarGrafia(n: Nota, grafia: Grafia): string {
  const pc = pitchClass(n);
  if (grafia === 'bemoles') return BEMOLES[pc];
  if (grafia === 'sostenidos') return SOSTENIDOS[pc];
  const rara = Math.abs(n.alteracion) > 1 || (n.alteracion !== 0 && NATURALES[pc] !== undefined);
  if (!rara) return formatNota(n);
  return NATURALES[pc] ?? (n.alteracion > 0 ? SOSTENIDOS[pc] : BEMOLES[pc]);
}

export function transponerNota(nota: string, t: Transporte, grafia: Grafia = 'auto'): string {
  const n = t.direccion === 'arriba' ? notaDeGrado(nota, t.grado) : notaBajoGrado(nota, t.grado);
  return ajustarGrafia(n, grafia);
}

/** Un acorde: la raíz y el bajo cambian; la calidad, no. Null si no empieza por una nota. */
export function transponerAcorde(simbolo: string, t: Transporte, grafia: Grafia = 'auto'): string | null {
  const p = partesCifrado(simbolo);
  if (!p) return null;
  try {
    const raiz = transponerNota(p.raiz, t, grafia);
    return `${raiz}${p.calidad}${p.bajo ? `/${transponerNota(p.bajo, t, grafia)}` : ''}`;
  } catch {
    return null;
  }
}

/** Trozos de una línea de cifrado que no son acordes pero tampoco texto: barras, repeticiones, N.C.… */
const SIGNO = /^(?:\|+:?|:?\|+|%|\/|-|–|\.|N\.?C\.?|\(?x\d+\)?|\d+\.|[:[\]{}]+)$/i;

/** Si una línea es de acordes: al menos un acorde y, quitando los signos, la mitad o más son acordes. */
export function esLineaDeAcordes(linea: string): boolean {
  const trozos = linea.split(/[\s|]+/).filter((t) => t && !SIGNO.test(t));
  if (!trozos.length) return false;
  const acordes = trozos.filter((t) => leerCifrado(t) !== null).length;
  return acordes > 0 && acordes * 2 >= trozos.length;
}

/** El texto entero: transporta los acordes de las líneas de acordes, respetando espacios y barras. */
export function transponerTexto(texto: string, t: Transporte, grafia: Grafia = 'auto'): string {
  return texto
    .split('\n')
    .map((linea) => {
      if (!esLineaDeAcordes(linea)) return linea;
      return linea.replace(/[^\s|]+/g, (trozo) => (leerCifrado(trozo) ? transponerAcorde(trozo, t, grafia) ?? trozo : trozo));
    })
    .join('\n');
}

/**
 * Tono probable del texto: la raíz del último acorde (los temas suelen acabar en la
 * tónica), en menor si ese acorde es menor. Null si no hay acordes.
 */
export function detectarTono(texto: string): { tonica: string; menor: boolean } | null {
  const lineas = texto.split('\n').filter(esLineaDeAcordes);
  for (let i = lineas.length - 1; i >= 0; i--) {
    const acordes = lineas[i].split(/[\s|]+/).map(leerCifrado).filter((a) => a !== null);
    const ultimo = acordes[acordes.length - 1];
    if (ultimo) return { tonica: ultimo.raiz, menor: ultimo.grados.includes('b3') && !ultimo.grados.includes('b5') };
  }
  return null;
}

/** Comprueba una tónica escrita (para los selectores). */
export const tonicaValida = (x: string) => {
  try {
    parseNota(x);
    return true;
  } catch {
    return false;
  }
};
