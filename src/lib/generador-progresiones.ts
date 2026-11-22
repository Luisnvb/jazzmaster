// Generador de progresiones aleatorias (Herramientas): progresiones en grados romanos
// que suenan a jazz, para practicar la lectura de cifrados, el comping o la
// improvisación sobre cambios que no te sabes. Se construyen hacia atrás desde la
// tónica final: cada acorde se elige entre los que suelen llevar al siguiente
// (II → V, VI7 → II…), con más opciones según el nivel. Funciones puras, sin DOM; el
// azar se pasa como función para poder probarlo.
import type { Modo } from './circulo.ts';

export type Nivel = 'diatonico' | 'secundarios' | 'sustituciones';

export const NIVELES: { id: Nivel; nombre: string; descripcion: string }[] = [
  { id: 'diatonico', nombre: 'Diatónico', descripcion: 'Solo los acordes de la tonalidad.' },
  { id: 'secundarios', nombre: 'Con dominantes secundarios', descripcion: 'Añade VI7, II7, III7… y sus II–V.' },
  {
    id: 'sustituciones',
    nombre: 'Con sustituciones',
    descripcion: 'Añade sustitutos por tritono, el backdoor (IVm7 bVII7) y préstamos del menor.',
  },
];

const ORDEN_NIVEL: Record<Nivel, number> = { diatonico: 0, secundarios: 1, sustituciones: 2 };

/** Para cada acorde, los que pueden ir justo antes: [acorde, peso, nivel mínimo]. */
type Antes = Record<string, [string, number, Nivel][]>;

const ANTES_MAYOR: Antes = {
  Imaj7: [
    ['V7', 10, 'diatonico'],
    ['IVmaj7', 2, 'diatonico'],
    ['IIm7', 1, 'diatonico'],
    ['bII7', 4, 'sustituciones'],
    ['bVII7', 3, 'sustituciones'],
    ['IVm7', 2, 'sustituciones'],
  ],
  V7: [
    ['IIm7', 10, 'diatonico'],
    ['IVmaj7', 3, 'diatonico'],
    ['Imaj7', 1, 'diatonico'],
    ['II7', 3, 'secundarios'],
    ['bVImaj7', 2, 'sustituciones'],
    ['bVIm7', 0, 'sustituciones'],
  ],
  IIm7: [
    ['VIm7', 6, 'diatonico'],
    ['IIIm7', 2, 'diatonico'],
    ['Imaj7', 3, 'diatonico'],
    ['IVmaj7', 1, 'diatonico'],
    ['VI7', 6, 'secundarios'],
    ['bIII°7', 2, 'sustituciones'],
  ],
  IIIm7: [
    ['Imaj7', 4, 'diatonico'],
    ['IVmaj7', 1, 'diatonico'],
    ['VII7', 3, 'secundarios'],
    ['#IVm7b5', 3, 'secundarios'],
  ],
  IVmaj7: [
    ['Imaj7', 5, 'diatonico'],
    ['IIIm7', 1, 'diatonico'],
    ['I7', 5, 'secundarios'],
    ['Vm7', 0, 'secundarios'],
  ],
  VIm7: [
    ['IIIm7', 4, 'diatonico'],
    ['Imaj7', 3, 'diatonico'],
    ['V7', 1, 'diatonico'],
    ['VIIm7b5', 1, 'diatonico'],
    ['III7', 5, 'secundarios'],
  ],
  VIIm7b5: [
    ['IVmaj7', 3, 'diatonico'],
    ['Imaj7', 1, 'diatonico'],
  ],
  VI7: [
    ['IIIm7', 5, 'secundarios'],
    ['Imaj7', 3, 'secundarios'],
    ['bVII7', 1, 'sustituciones'],
  ],
  II7: [
    ['VIm7', 5, 'secundarios'],
    ['Imaj7', 2, 'secundarios'],
    ['bIIImaj7', 1, 'sustituciones'],
  ],
  III7: [
    ['VIIm7b5', 5, 'secundarios'],
    ['Imaj7', 3, 'secundarios'],
    ['IVmaj7', 1, 'secundarios'],
  ],
  VII7: [
    ['#IVm7b5', 5, 'secundarios'],
    ['Imaj7', 2, 'secundarios'],
  ],
  I7: [
    ['Vm7', 6, 'secundarios'],
    ['Imaj7', 3, 'secundarios'],
  ],
  Vm7: [
    ['Imaj7', 3, 'secundarios'],
    ['IIm7', 2, 'secundarios'],
  ],
  '#IVm7b5': [
    ['Imaj7', 3, 'secundarios'],
    ['IVmaj7', 2, 'secundarios'],
  ],
  bII7: [
    ['IIm7', 6, 'sustituciones'],
    ['bVIm7', 3, 'sustituciones'],
  ],
  bVIm7: [['Imaj7', 2, 'sustituciones']],
  bVII7: [
    ['IVm7', 6, 'sustituciones'],
    ['Imaj7', 1, 'sustituciones'],
  ],
  IVm7: [
    ['IVmaj7', 4, 'sustituciones'],
    ['Imaj7', 3, 'sustituciones'],
  ],
  bVImaj7: [
    ['Imaj7', 3, 'sustituciones'],
    ['IVm7', 2, 'sustituciones'],
  ],
  'bIII°7': [
    ['IIIm7', 3, 'sustituciones'],
    ['Imaj7', 2, 'sustituciones'],
  ],
  bIIImaj7: [['Imaj7', 2, 'sustituciones']],
};

const ANTES_MENOR: Antes = {
  Im7: [
    ['V7b9', 10, 'diatonico'],
    ['IVm7', 2, 'diatonico'],
    ['bVII7', 1, 'diatonico'],
    ['bII7', 4, 'sustituciones'],
  ],
  V7b9: [
    ['IIm7b5', 10, 'diatonico'],
    ['IVm7', 2, 'diatonico'],
    ['bVImaj7', 3, 'diatonico'],
    ['Im7', 1, 'diatonico'],
    ['II7', 2, 'secundarios'],
  ],
  IIm7b5: [
    ['Im7', 4, 'diatonico'],
    ['bVImaj7', 3, 'diatonico'],
    ['IVm7', 2, 'diatonico'],
    ['bIIImaj7', 1, 'diatonico'],
    ['bVI7', 3, 'sustituciones'],
  ],
  IVm7: [
    ['Im7', 5, 'diatonico'],
    ['bIIImaj7', 1, 'diatonico'],
    ['I7', 5, 'secundarios'],
  ],
  bVImaj7: [
    ['bIIImaj7', 3, 'diatonico'],
    ['Im7', 3, 'diatonico'],
    ['IVm7', 2, 'diatonico'],
    ['bIII7', 3, 'secundarios'],
  ],
  bIIImaj7: [
    ['bVII7', 6, 'diatonico'],
    ['Im7', 2, 'diatonico'],
    ['IVm7', 2, 'diatonico'],
  ],
  bVII7: [
    ['IVm7', 5, 'diatonico'],
    ['Im7', 2, 'diatonico'],
  ],
  I7: [
    ['Vm7b5', 4, 'secundarios'],
    ['Im7', 3, 'secundarios'],
  ],
  'Vm7b5': [['Im7', 3, 'secundarios']],
  bIII7: [
    ['bVIIm7', 4, 'secundarios'],
    ['Im7', 2, 'secundarios'],
  ],
  bVIIm7: [['Im7', 3, 'secundarios']],
  II7: [
    ['bVImaj7', 2, 'secundarios'],
    ['Im7', 3, 'secundarios'],
  ],
  bII7: [
    ['IIm7b5', 5, 'sustituciones'],
    ['bVIm7', 2, 'sustituciones'],
  ],
  bVIm7: [['Im7', 2, 'sustituciones']],
  bVI7: [
    ['Im7', 3, 'sustituciones'],
    ['bIIImaj7', 2, 'sustituciones'],
  ],
};

export const TONICA_FINAL: Record<Modo, string> = { mayor: 'Imaj7', menor: 'Im7' };

export interface OpcionesGenerador {
  modo: Modo;
  nivel: Nivel;
  compases: number;
  /** Probabilidad (0–1) de que un compás lleve dos acordes. */
  dosPorCompas: number;
}

/** Elige con pesos; `azar` devuelve un número en [0, 1). */
function elegir<T>(opciones: readonly [T, number][], azar: () => number): T {
  const total = opciones.reduce((s, [, p]) => s + p, 0);
  let x = azar() * total;
  for (const [valor, peso] of opciones) {
    x -= peso;
    if (x < 0) return valor;
  }
  return opciones[opciones.length - 1][0];
}

/** Los acordes que pueden ir antes de `acorde` en un nivel (con peso > 0). */
export function anteriores(acorde: string, modo: Modo, nivel: Nivel): [string, number][] {
  const tabla = modo === 'mayor' ? ANTES_MAYOR : ANTES_MENOR;
  return (tabla[acorde] ?? []).filter(([, peso, n]) => peso > 0 && ORDEN_NIVEL[n] <= ORDEN_NIVEL[nivel]).map(([a, p]) => [a, p]);
}

/**
 * Una progresión: un texto por compás con sus acordes en grados ('IIm7 V7', 'Imaj7').
 * Acaba en la tónica, un compás entero.
 */
export function generarProgresion(op: OpcionesGenerador, azar: () => number = Math.random): string[] {
  const compases = Math.max(2, Math.min(32, Math.round(op.compases)));
  // Cuántos acordes lleva cada compás (el último, uno: la tónica).
  const porCompas = Array.from({ length: compases }, (_, i) => (i < compases - 1 && azar() < op.dosPorCompas ? 2 : 1));
  const total = porCompas.reduce((s, n) => s + n, 0);
  const acordes = [TONICA_FINAL[op.modo]];
  while (acordes.length < total) {
    const opciones = anteriores(acordes[0], op.modo, op.nivel);
    // Sin antecesor (no debería pasar): se vuelve a la tónica.
    acordes.unshift(opciones.length ? elegir(opciones, azar) : TONICA_FINAL[op.modo]);
  }
  const res: string[] = [];
  let k = 0;
  for (const n of porCompas) {
    res.push(acordes.slice(k, k + n).join(' '));
    k += n;
  }
  return res;
}

/** Todas las tónicas que ofrece el generador por modo (las menores, con su grafía más común). */
export const TONICAS_GENERADOR: Record<Modo, string[]> = {
  mayor: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  menor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'],
};

export const tonicaAlAzar = (modo: Modo, azar: () => number = Math.random) => TONICAS_GENERADOR[modo][Math.floor(azar() * 12) % 12];
