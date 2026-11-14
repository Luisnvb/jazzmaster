// Pares de tríadas: dos tríadas sin notas comunes que juntas dan una escala de
// seis notas (hexátona). Cada par se usa sobre un tipo de acorde; los grados van
// referidos a la raíz de ese acorde. Funciones puras, sin DOM.
import { notasFormula, ordenadas, type NotaMastil, type Zona } from './arpegios.ts';
import { formatNota, notaDeGrado, semitonosGrado } from './teoria.ts';

export interface Triada {
  /** Grado de la raíz de la tríada sobre el acorde ('2', 'b6'…). */
  grado: string;
  /** Sufijo del cifrado: '' mayor, 'm' menor, '°' disminuida, '+' aumentada. */
  tipo: '' | 'm' | '°' | '+';
  /** Sus tres notas como grados del acorde, de la raíz a la 5. */
  notas: [string, string, string];
}

export interface Par {
  id: string;
  /** Acorde sobre el que se usa (cifrado sin raíz: 'maj7#11'). */
  acorde: string;
  /** Escala de la que salen las seis notas. */
  escala: string;
  a: Triada;
  b: Triada;
  nota: string;
}

export const PARES: readonly Par[] = [
  {
    id: 'lidio',
    acorde: 'maj7#11',
    escala: 'Lidio',
    a: { grado: '2', tipo: '', notas: ['9', '#11', '13'] },
    b: { grado: '3', tipo: 'm', notas: ['3', '5', '7'] },
    nota: 'II mayor y IIIm: la menor de la 3 es el acorde sin raíz (3 5 7); la mayor de la 9 trae las tensiones, con la #11.',
  },
  {
    id: 'jonico',
    acorde: 'maj7',
    escala: 'Jónico sin la 4',
    a: { grado: '5', tipo: '', notas: ['5', '7', '9'] },
    b: { grado: '6', tipo: 'm', notas: ['13', '1', '3'] },
    nota: 'V y VIm de la tonalidad: el sonido de 6/9 y maj9, sin la 4 que choca con la 3.',
  },
  {
    id: 'dorico',
    acorde: 'm7',
    escala: 'Dórico sin la 9',
    a: { grado: 'b3', tipo: '', notas: ['b3', '5', 'b7'] },
    b: { grado: '4', tipo: '', notas: ['11', '13', '1'] },
    nota: 'bIII y IV mayores: con la 6 mayor, el color dórico. Sobre un IIm7 del ii–V son el IV y el V del tono.',
  },
  {
    id: 'eolio',
    acorde: 'm7',
    escala: 'Eólico sin la 5',
    a: { grado: 'b6', tipo: '', notas: ['b13', '1', 'b3'] },
    b: { grado: 'b7', tipo: '', notas: ['b7', '9', '11'] },
    nota: 'bVI y bVII mayores: menor más oscuro, con la b6. Sirve en el VIm o el Im de una tonalidad menor.',
  },
  {
    id: 'mixolidio',
    acorde: '7',
    escala: 'Mixolidio sin la 4',
    a: { grado: '5', tipo: 'm', notas: ['5', 'b7', '9'] },
    b: { grado: '6', tipo: 'm', notas: ['13', '1', '3'] },
    nota: 'Vm y VIm: las tensiones 9 y 13 del dominante sin la 4 (avoid note).',
  },
  {
    id: 'lidio-dominante',
    acorde: '7#11',
    escala: 'Lidio dominante sin la 7',
    a: { grado: '1', tipo: '', notas: ['1', '3', '5'] },
    b: { grado: '2', tipo: '', notas: ['9', '#11', '13'] },
    nota: 'I y II mayores: el acorde y, un tono por encima, sus tensiones. Para dominantes que no resuelven (IV7, bVII7, sustitutos de tritono).',
  },
  {
    id: 'alterado',
    acorde: '7alt',
    escala: 'Alterado',
    a: { grado: 'b5', tipo: '', notas: ['b5', 'b7', 'b9'] },
    b: { grado: 'b6', tipo: '', notas: ['b13', '1', '#9'] },
    nota: 'bV y bVI mayores (en C7: Gb y Ab). Todas las tensiones alteradas; la b7 y la raíz sujetan el acorde.',
  },
  {
    id: 'disminuido',
    acorde: '7b9',
    escala: 'Semitono-tono',
    a: { grado: '1', tipo: '', notas: ['1', '3', '5'] },
    b: { grado: '#4', tipo: '', notas: ['#11', 'b7', 'b9'] },
    nota: 'I y #IV mayores, a un tritono: las dos tríadas mayores de la escala disminuida que no comparten notas.',
  },
  {
    id: 'tonos-enteros',
    acorde: '7#5',
    escala: 'Tonos enteros',
    a: { grado: '1', tipo: '+', notas: ['1', '3', '#5'] },
    b: { grado: '2', tipo: '+', notas: ['9', '#11', 'b7'] },
    nota: 'Dos aumentadas a un tono: juntas son la escala de tonos enteros completa.',
  },
  {
    id: 'locrio',
    acorde: 'm7b5',
    escala: 'Locrio #2 sin la 2',
    a: { grado: 'b3', tipo: 'm', notas: ['b3', 'b5', 'b7'] },
    b: { grado: '4', tipo: 'm', notas: ['11', 'b13', '1'] },
    nota: 'bIIIm y IVm: el semidisminuido del ii–V menor, con la 11 y la b13.',
  },
];

const mod = (n: number) => ((n % 12) + 12) % 12;
const pc = (g: string) => mod(semitonosGrado(g));

/** Nombre de la tríada sobre una raíz: ('C', b de 'alterado') → 'Ab'. */
export const nombreTriada = (raiz: string, t: Triada) => formatNota(notaDeGrado(raiz, t.grado)) + t.tipo;

/** Fórmula de cada tipo de tríada desde su propia raíz. */
export const FORMULA_TRIADA: Record<Triada['tipo'], [string, string, string]> = {
  '': ['1', '3', '5'],
  m: ['1', 'b3', '5'],
  '°': ['1', 'b3', 'b5'],
  '+': ['1', '3', '#5'],
};

/**
 * Notas (letras) de una tríada sobre la raíz del acorde, deletreadas desde la
 * raíz de la tríada: la Ab de C7alt es Ab C Eb, aunque Eb sea la #9 del acorde.
 */
export function letrasTriada(raiz: string, t: Triada): string[] {
  const r = notaDeGrado(raiz, t.grado);
  return FORMULA_TRIADA[t.tipo].map((g) => formatNota(notaDeGrado(r, g)));
}

/** Nota del mástil con la tríada a la que pertenece. */
export interface NotaPar extends NotaMastil {
  triada: 'a' | 'b';
}

/**
 * Las seis notas del par en el mástil, con su grado sobre el acorde. Las de la
 * tríada A van marcadas como «del acorde» (rellenas) y las de B como de la escala
 * (en blanco), para que el mapa las distinga con los estilos de lib/arpegios.ts.
 */
export function notasPar(raiz: string, par: Par): NotaPar[] {
  const deA = new Set(par.a.notas.map(pc));
  return notasFormula(raiz, [...par.a.notas, ...par.b.notas], par.a.notas).map((n) => ({
    ...n,
    triada: deA.has(mod(semitonosGrado(n.grado))) ? 'a' : 'b',
  }));
}

/** Cómo se ordenan las tres notas de cada tríada en la línea. */
export type Figura = 'sube' | 'baja' | 'alterna';

/**
 * Línea con las dos tríadas alternadas, de tres en tres notas, dentro de la zona:
 * una inversión de A, la de B que empieza justo encima, la siguiente inversión de
 * A… hasta arriba, y vuelta atrás. Con `figura`, cada grupo suena hacia arriba,
 * hacia abajo o alternando (A sube, B baja).
 */
export function lineaPar(notas: readonly NotaPar[], z: Zona, figura: Figura = 'sube'): NotaPar[] {
  const orden = ordenadas(notas, z) as NotaPar[];
  const A = orden.filter((n) => n.triada === 'a');
  const B = orden.filter((n) => n.triada === 'b');
  const grupos: NotaPar[][] = [];
  for (let i = 0; i + 2 < A.length; i++) {
    const j = B.findIndex((n) => n.midi > A[i].midi);
    if (j < 0 || j + 2 >= B.length) break;
    grupos.push(A.slice(i, i + 3), B.slice(j, j + 3));
  }
  if (grupos.length === 0) return [];
  const forma = (g: NotaPar[], k: number) =>
    figura === 'baja' || (figura === 'alterna' && k % 2 === 1) ? [...g].reverse() : g;
  const sube = grupos.map(forma);
  // De vuelta, los mismos grupos en orden inverso y cada uno al revés.
  const baja = sube.slice(0, -1).reverse().map((g) => [...g].reverse());
  return [...sube, ...baja].flat();
}
