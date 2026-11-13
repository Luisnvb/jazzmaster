// Formas de acorde en el mástil: de grados por cuerda a trastes y al revés,
// y el catálogo de formas que se ofrece al editar un cifrado.
// Funciones puras (se usan al compilar, en el navegador y en los tests).
import { AFINACION } from './secuencias.ts';
import { parseNota, pitchClass, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

/** Grado por cuerda, de 6ª a 1ª; null = cuerda apagada. */
export type GradosCuerdas = (string | null)[];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Traste más alto que se usa al colocar una forma. */
const TRASTE_MAX = 20;
/** Separación máxima entre el traste más bajo y el más alto de una forma. */
const APERTURA_MAX = 5;

const pcDe = (tonica: string) => pitchClass(parseNota(tonica));

/** Todas las colocaciones posibles de unos grados, ordenadas de la más grave a la más aguda. */
function colocaciones(raiz: string, grados: GradosCuerdas): number[][] {
  const tocadas = grados.flatMap((g, c) => (g ? [c] : []));
  if (tocadas.length === 0) return [];
  const pcs = tocadas.map((c) => mod(pcDe(raiz) + semitonosGrado(grados[c]!), 12));
  const trasteDe = (i: number, aprox: number) => {
    const c = tocadas[i];
    const opciones: number[] = [];
    for (let t = 1; t <= TRASTE_MAX; t++) if (mod(AFINACION[c] + t, 12) === pcs[i] && Math.abs(t - aprox) <= APERTURA_MAX) opciones.push(t);
    return opciones;
  };

  const resultado: number[][] = [];
  // La cuerda del bajo marca la posición; el resto se busca alrededor.
  const bases: number[] = [];
  for (let t = 1; t <= TRASTE_MAX; t++) if (mod(AFINACION[tocadas[0]] + t, 12) === pcs[0]) bases.push(t);
  for (const base of bases) {
    let mejor: { trastes: number[]; apertura: number; distancia: number } | null = null;
    const probar = (i: number, elegidos: number[]) => {
      if (i === tocadas.length) {
        const apertura = Math.max(...elegidos) - Math.min(...elegidos);
        const distancia = elegidos.reduce((s, t) => s + Math.abs(t - base), 0);
        if (apertura <= APERTURA_MAX - 1 && (!mejor || apertura < mejor.apertura || (apertura === mejor.apertura && distancia < mejor.distancia))) {
          mejor = { trastes: [...elegidos], apertura, distancia };
        }
        return;
      }
      for (const t of trasteDe(i, base)) probar(i + 1, [...elegidos, t]);
    };
    probar(1, [base]);
    if (mejor) resultado.push((mejor as { trastes: number[] }).trastes);
  }
  return resultado.sort((a, b) => Math.min(...a) - Math.min(...b));
}

/**
 * Trastes de una forma dada por sus grados (de 6ª a 1ª) sobre una raíz.
 * Se busca la posición más grave en la que la forma cabe en una mano;
 * `posicion` elige las siguientes (1 = una octava más arriba). Sin cuerdas al aire.
 */
export function trastesDeGrados(raiz: string, grados: GradosCuerdas, posicion = 0): Traste[] | null {
  const opciones = colocaciones(raiz, grados);
  const elegida = opciones[Math.min(Math.max(posicion, 0), opciones.length - 1)];
  if (!elegida) return null;
  let i = 0;
  return grados.map((g) => (g ? elegida[i++] : 'x'));
}

/** Nombre de grado por defecto para cada distancia en semitonos. */
const GRADO_POR_SEMITONOS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', '#5', '6', 'b7', '7'];

/**
 * Grado de cada cuerda tocada respecto a una raíz. `preferidos` decide la
 * ortografía cuando hay varias posibles (bb7 en vez de 6 en un °7, #9 en vez de b3…).
 */
export function gradosDeTrastes(raiz: string, trastes: readonly Traste[], preferidos: readonly string[] = []): string[] {
  const pcRaiz = pcDe(raiz);
  return trastes.map((t, c) => {
    if (t === 'x') return '';
    const s = mod(AFINACION[c] + t - pcRaiz, 12);
    return preferidos.find((g) => mod(semitonosGrado(g), 12) === s) ?? GRADO_POR_SEMITONOS[s];
  });
}

/** Grado de la cuerda más aguda que suena (la nota de la melodía). */
export function gradoSuperior(grados: readonly (string | null)[]): string | null {
  for (let c = grados.length - 1; c >= 0; c--) if (grados[c]) return grados[c];
  return null;
}

/** Apertura (traste más alto − más bajo) de una forma. */
export function apertura(trastes: readonly Traste[]): number {
  const pisados = trastes.filter((t): t is number => t !== 'x' && t > 0);
  return pisados.length ? Math.max(...pisados) - Math.min(...pisados) : 0;
}

// --- Catálogo de formas para el editor de cifrados -------------------------

/** Conjuntos de grados con los que se generan formas, por calidad (siempre con la raíz en el bajo). */
export const CONJUNTOS: Record<string, string[][]> = {
  Major: [
    ['1', '3', '5', '7'],
    ['1', '3', '5', '6'],
    ['1', '3', '7', '2'],
    ['1', '5', '7', '3'],
    ['1', '3', '6', '2'],
    ['1', '3', '7', '1'],
    ['1', '5', '3', '1'],
    ['1', '7', '3'],
    ['1', '3', '7'],
  ],
  Minor: [
    ['1', 'b3', '5', 'b7'],
    ['1', 'b3', '5', '6'],
    ['1', 'b3', 'b7', '2'],
    ['1', '4', 'b7', 'b3'],
    ['1', 'b3', '5', '7'],
    ['1', 'b3', 'b7', '1'],
    ['1', '5', 'b3', '1'],
    ['1', 'b7', 'b3'],
    ['1', 'b3', 'b7'],
  ],
  Dominant: [
    ['1', '3', '5', 'b7'],
    ['1', '3', 'b7', '2'],
    ['1', '3', 'b7', '6'],
    ['1', '3', 'b7', 'b2'],
    ['1', '3', 'b7', '#2'],
    ['1', '3', 'b7', 'b6'],
    ['1', '4', '5', 'b7'],
    ['1', '3', 'b7', '1'],
    ['1', 'b7', '3'],
    ['1', '3', 'b7'],
  ],
  'Half-Diminished': [
    ['1', 'b3', 'b5', 'b7'],
    ['1', '4', 'b5', 'b7'],
    ['1', 'b3', 'b7', '1'],
    ['1', 'b7', 'b3'],
  ],
  Diminished: [
    ['1', 'b3', 'b5', 'bb7'],
    ['1', 'b3', 'bb7', '1'],
    ['1', 'bb7', 'b3'],
  ],
};

/** Juegos de cuerdas (0 = 6ª … 5 = 1ª): la primera lleva el bajo. */
const JUEGOS: Record<number, number[][]> = {
  4: [
    [0, 1, 2, 3],
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [0, 2, 3, 4],
    [1, 3, 4, 5],
  ],
  3: [
    [0, 2, 3],
    [1, 2, 3],
    [1, 3, 4],
    [2, 3, 4],
  ],
};

function permutaciones<T>(lista: T[]): T[][] {
  if (lista.length <= 1) return [lista];
  return lista.flatMap((x, i) => permutaciones([...lista.slice(0, i), ...lista.slice(i + 1)]).map((resto) => [x, ...resto]));
}

export interface Forma {
  grados: GradosCuerdas;
  /** Viene de los voicings personales (sección Acordes). */
  personal?: boolean;
  nombre?: string;
}

const clave = (g: GradosCuerdas) => g.map((x) => x ?? '-').join(' ');

/**
 * Formas de una calidad, como grados por cuerda (independientes de la raíz).
 * Primero las personales, después las generadas (raíz en el bajo, 3 o 4 notas,
 * cabe en una mano: apertura máxima de 3 trastes).
 */
export function catalogoFormas(tipo: string, personales: Forma[] = []): Forma[] {
  const vistas = new Set<string>();
  const res: Forma[] = [];
  const añadir = (f: Forma) => {
    const k = clave(f.grados);
    if (vistas.has(k)) return;
    vistas.add(k);
    res.push(f);
  };
  personales.forEach(añadir);

  const generadas: { forma: Forma; orden: number }[] = [];
  for (const conjunto of CONJUNTOS[tipo] ?? []) {
    const [bajo, ...resto] = conjunto;
    for (const juego of JUEGOS[conjunto.length] ?? []) {
      for (const p of permutaciones(resto)) {
        const grados: GradosCuerdas = [null, null, null, null, null, null];
        grados[juego[0]] = bajo;
        juego.slice(1).forEach((c, i) => (grados[c] = p[i]));
        // Se mide sobre C; la apertura no depende de la raíz salvo por la octava elegida.
        const trastes = trastesDeGrados('C', grados) ?? null;
        const alt = trastesDeGrados('F#', grados) ?? null;
        if (!trastes || !alt || Math.min(apertura(trastes), apertura(alt)) > 3) continue;
        generadas.push({ forma: { grados }, orden: juego[0] * 10 + (4 - conjunto.length) });
      }
    }
  }
  // Formas con el bajo en 6ª primero, luego 5ª y 4ª; las de 4 notas antes que las de 3.
  generadas.sort((a, b) => a.orden - b.orden);
  generadas.forEach((g) => añadir(g.forma));
  return res;
}

/** Notas superiores disponibles en un catálogo, en orden de semitonos. */
export function notasSuperiores(formas: Forma[]): string[] {
  const set = [...new Set(formas.map((f) => gradoSuperior(f.grados)).filter((g): g is string => Boolean(g)))];
  return set.sort((a, b) => mod(semitonosGrado(a), 12) - mod(semitonosGrado(b), 12));
}
