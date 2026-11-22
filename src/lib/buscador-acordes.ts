// Buscador de acordes (Herramientas): de una lista de notas escrita a mano (la primera
// es el bajo) a los nombres posibles del acorde, el más probable primero. Prueba cada
// nota como raíz con nombrarAcorde (lib/slash.ts) y puntúa cada lectura. Funciones
// puras, sin DOM.
import { nombrarAcorde } from './slash.ts';
import { formatNota, notaDeGrado, parseNota, pitchClass, type Nota } from './teoria.ts';

const mod = (n: number) => ((n % 12) + 12) % 12;

/** Nombres latinos de las notas, por si se escriben así (do, re, mi…). */
const LATINOS: Record<string, string> = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };

/** Una nota escrita: «C», «eb», «F#», «Sol», «sib», «D♭»… Devuelve null si no lo es. */
export function leerNota(texto: string): Nota | null {
  const t = texto.trim().replace(/♯/g, '#').replace(/♭/g, 'b');
  const m = /^(do|re|mi|fa|sol|la|si|[a-g])(bb|b|##|#|x)?$/i.exec(t);
  if (!m) return null;
  const letra = LATINOS[m[1].toLowerCase()] ?? m[1].toUpperCase();
  return parseNota(letra + (m[2] ?? '').toLowerCase());
}

export interface Lectura {
  /** Notas leídas, sin repetir sonidos, en el orden escrito (la primera es el bajo). */
  notas: string[];
  /** Trozos que no son notas. */
  errores: string[];
}

/** Separa por espacios, comas, guiones o punto y coma. */
export function leerNotas(texto: string): Lectura {
  const notas: string[] = [];
  const vistos = new Set<number>();
  const errores: string[] = [];
  for (const trozo of texto.split(/[\s,;\-–]+/).filter(Boolean)) {
    const n = leerNota(trozo);
    if (!n) {
      errores.push(trozo);
      continue;
    }
    const pc = pitchClass(n);
    if (vistos.has(pc)) continue;
    vistos.add(pc);
    notas.push(formatNota(n));
  }
  return { notas, errores };
}

export interface Candidato {
  /** Cifrado completo, con el bajo si no es la raíz: «Am7/C». */
  simbolo: string;
  raiz: string;
  /** Si la raíz es el bajo (posición fundamental). */
  fundamental: boolean;
  /** Cada nota escrita con su grado sobre la raíz. */
  notas: { nota: string; grado: string }[];
  sinTercera: boolean;
  puntos: number;
}

const ALTERADAS = ['b9', '#9', '#11', 'b13'];
const NATURALES = ['9', '11', '13', '2', '6'];

/**
 * Cuánto se parece una lectura a un acorde «normal»: mejor con 3ª (o sus), 5ª y 7ª,
 * con la raíz en el bajo y con pocas tensiones; las alteradas restan más.
 */
function puntuar(grados: string[], fundamental: boolean): number {
  const hay = (g: string) => grados.includes(g);
  let p = 0;
  if (fundamental) p += 3;
  if (hay('3') || hay('b3')) p += 4;
  else if (hay('4') || hay('2')) p += 2;
  if (hay('5')) p += 1;
  if (hay('7') || hay('b7') || hay('bb7')) p += 1.5;
  for (const g of grados) {
    if (ALTERADAS.includes(g)) p -= 1.5;
    else if (NATURALES.includes(g)) p -= 0.5;
  }
  // La b5 o la #5 en lugar de la 5 justa: acordes menos habituales (salvo m7b5 y °7).
  if (hay('b5') && !(hay('b3') && (hay('b7') || hay('bb7')))) p -= 1;
  if (hay('#5')) p -= 1;
  // b6 sin 7ª en un menor: casi siempre es la inversión de un mayor (C Eb Ab = Ab/C).
  if (hay('b6')) p -= 2.5;
  return p;
}

/**
 * Los nombres posibles de un conjunto de notas (la primera es el bajo), de más a
 * menos probable. Con menos de tres sonidos distintos no hay acorde: lista vacía.
 */
export function buscarAcordes(notas: readonly string[]): Candidato[] {
  if (notas.length < 3) return [];
  const bajo = notas[0];
  const pcs = notas.map((n) => pitchClass(parseNota(n)));
  const res: Candidato[] = notas.map((raiz, i) => {
    const st = pcs.map((pc) => mod(pc - pcs[i]));
    const a = nombrarAcorde(raiz, st);
    const gradoDe = (x: number) => a.grados.find((g) => g.st === x)?.grado ?? '?';
    const fundamental = i === 0;
    return {
      simbolo: fundamental ? a.simbolo : `${a.simbolo}/${bajo}`,
      raiz,
      fundamental,
      notas: notas.map((nota, j) => ({ nota, grado: gradoDe(st[j]) })),
      sinTercera: a.sinTercera,
      puntos: puntuar(a.grados.map((g) => g.grado), fundamental),
    };
  });
  // Orden estable: a igualdad de puntos, en el orden en que se escribieron las raíces.
  return res.map((c, i) => ({ c, i })).sort((x, y) => y.c.puntos - x.c.puntos || x.i - y.i).map(({ c }) => c);
}

const NOMBRES_INTERVALO = {
  es: ['unísono', '2ª menor', '2ª mayor', '3ª menor', '3ª mayor', '4ª justa', 'tritono', '5ª justa', '6ª menor', '6ª mayor', '7ª menor', '7ª mayor'],
  en: ['unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th'],
};

/** Con dos notas: el intervalo de la primera a la segunda, hacia arriba. */
export function nombrarIntervalo(a: string, b: string, idioma: 'es' | 'en' = 'es'): string {
  return NOMBRES_INTERVALO[idioma][mod(pitchClass(parseNota(b)) - pitchClass(parseNota(a)))];
}

/** Sonidos (MIDI) para oír las notas: el bajo en la octava 2–3 y el resto encima, de grave a agudo en el orden escrito. */
export function midisAcorde(notas: readonly string[]): number[] {
  if (!notas.length) return [];
  const pcs = notas.map((n) => pitchClass(parseNota(n)));
  const res = [40 + mod(pcs[0] - 4)];
  // El resto, cada nota en la primera altura por encima de la anterior, desde E3.
  let suelo = Math.max(res[0] + 1, 52);
  for (const pc of pcs.slice(1)) {
    const m = suelo + mod(pc - suelo);
    res.push(m);
    suelo = m + 1;
  }
  return res;
}

// --- Desde el mástil ---------------------------------------------------------------

/** Grafía de cada sonido al leerlo del mástil (la de los selectores de tónica). */
const GRAFIA = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Un traste por cuerda (0 = 6ª … 5 = 1ª), 'x' = no suena. */
export type TrastesMastil = (number | 'x')[];

/** MIDI de las cuerdas al aire, de 6ª a 1ª. */
const AL_AIRE = [40, 45, 50, 55, 59, 64];

export const sinTrastes = (): TrastesMastil => ['x', 'x', 'x', 'x', 'x', 'x'];

/** Trastes guardados o enlazados, saneados: seis valores, 'x' o 0–24. */
export function trastesValidos(x: unknown): TrastesMastil {
  if (!Array.isArray(x) || x.length !== 6) return sinTrastes();
  return x.map((t) => (Number.isInteger(t) && t >= 0 && t <= 24 ? (t as number) : 'x'));
}

/** Pone o quita un traste: en cada cuerda suena solo uno; pulsar el que ya está lo quita. */
export function alternarTraste(trastes: TrastesMastil, cuerda: number, traste: number): TrastesMastil {
  return trastes.map((t, c) => (c !== cuerda ? t : t === traste ? 'x' : traste));
}

/**
 * Lo que suena con unos trastes: las alturas de grave a agudo y las notas sin
 * repetir sonidos, en ese orden (la primera es el bajo).
 */
export function notasDeTrastes(trastes: TrastesMastil): { midis: number[]; notas: string[] } {
  const midis = trastes.flatMap((t, c) => (t === 'x' ? [] : [AL_AIRE[c] + t])).sort((a, b) => a - b);
  const notas: string[] = [];
  for (const m of midis) {
    const n = GRAFIA[m % 12];
    if (!notas.includes(n)) notas.push(n);
  }
  return { midis, notas };
}

/** Grado de cada cuerda sobre la raíz de un candidato ('' en las que no suenan), para el diagrama. */
export function gradosDeTrastes(trastes: TrastesMastil, c: Candidato): string[] {
  return trastes.map((t, cuerda) => {
    if (t === 'x') return '';
    const pc = (AL_AIRE[cuerda] + t) % 12;
    return c.notas.find((n) => pitchClass(parseNota(n.nota)) === pc)?.grado ?? '';
  });
}

/**
 * Las notas escritas según los grados de un candidato (G# y no Ab como 3 de E). Si un
 * grado daría una doble alteración, la nota se deja como estaba.
 */
export function deletrearSegun(c: Candidato): string[] {
  return c.notas.map(({ nota, grado }) => {
    try {
      const n = notaDeGrado(c.raiz, grado);
      return Math.abs(n.alteracion) > 1 ? nota : formatNota(n);
    } catch {
      return nota;
    }
  });
}

/** Del mástil al acorde: lee las notas, busca y vuelve a buscar con las notas bien escritas. */
export function buscarEnMastil(trastes: TrastesMastil): { midis: number[]; notas: string[]; candidatos: Candidato[] } {
  const { midis, notas } = notasDeTrastes(trastes);
  const primera = buscarAcordes(notas);
  if (!primera.length) return { midis, notas, candidatos: [] };
  const escritas = deletrearSegun(primera[0]);
  return { midis, notas: escritas, candidatos: buscarAcordes(escritas) };
}
