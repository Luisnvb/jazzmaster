// Pentatónicas en jazz: qué pentatónica tocar sobre cada tipo de acorde y qué
// tensiones saca. Los grados van referidos a la raíz del acorde. Funciones puras, sin DOM.
import { notasFormula, type NotaMastil } from './arpegios.ts';
import type { Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, parseNota, pitchClass, semitonosGrado, type Nota } from './teoria.ts';

export type TipoPenta = 'mayor' | 'menor';

export const FORMULA_PENTA: Record<TipoPenta, string[]> = {
  mayor: ['1', '2', '3', '5', '6'],
  menor: ['1', 'b3', '4', '5', 'b7'],
};

export type Nivel = 'dentro' | 'color' | 'blues' | 'alterado';

export const NIVELES: Record<Nivel, string> = {
  dentro: 'Dentro',
  color: 'Tensiones',
  blues: 'Blues',
  alterado: 'Alterado',
};

export interface OpcionPenta {
  id: string;
  tipo: TipoPenta;
  /** Raíz de la pentatónica como grado del acorde ('5', 'b3'…). */
  grado: string;
  /** Sus cinco notas como grados del acorde, en el orden de la pentatónica. */
  notas: string[];
  nivel: Nivel;
  sonido: string;
}

export interface AcordePenta {
  id: string;
  /** Sufijo del cifrado: 'maj7', 'm7', '7'… */
  simbolo: string;
  nombre: string;
  /** Notas del acorde (las que se marcan en el mástil y suenan de fondo). */
  formula: string[];
  opciones: OpcionPenta[];
}

export const ACORDES_PENTA: AcordePenta[] = [
  {
    id: 'maj7',
    simbolo: 'maj7',
    nombre: 'Mayor con 7',
    formula: ['1', '3', '5', '7'],
    opciones: [
      { id: 'maj7-1', tipo: 'mayor', grado: '1', notas: ['1', '9', '3', '5', '13'], nivel: 'dentro', sonido: 'La pentatónica del acorde: sonido abierto de 6/9, sin la 4 (que choca con la 3) ni la 7.' },
      { id: 'maj7-5', tipo: 'mayor', grado: '5', notas: ['5', '13', '7', '9', '3'], nivel: 'color', sonido: 'Desde la 5: aparecen la 7 y la 9 y desaparece la raíz. Suena a maj9, más moderno.' },
      { id: 'maj7-2', tipo: 'mayor', grado: '2', notas: ['9', '3', '#11', '13', '7'], nivel: 'color', sonido: 'Desde la 9: las tres tensiones del lidio (9, #11, 13) con la 3 y la 7, sin raíz ni 5. Para maj7#11.' },
    ],
  },
  {
    id: 'm7',
    simbolo: 'm7',
    nombre: 'Menor con 7',
    formula: ['1', 'b3', '5', 'b7'],
    opciones: [
      { id: 'm7-1', tipo: 'menor', grado: '1', notas: ['1', 'b3', '11', '5', 'b7'], nivel: 'dentro', sonido: 'La del acorde: el acorde entero más la 11. El sonido de blues y rock.' },
      { id: 'm7-5', tipo: 'menor', grado: '5', notas: ['5', 'b7', '1', '9', '11'], nivel: 'color', sonido: 'Desde la 5: cambia la b3 por la 9. Más abierta, típica sobre un IIm7 largo.' },
      { id: 'm7-2', tipo: 'menor', grado: '2', notas: ['9', '11', '5', '13', '1'], nivel: 'color', sonido: 'Desde la 9: con la 13 (6 mayor), el color dórico. Sin b3 ni b7: muy abierta, sonido modal.' },
    ],
  },
  {
    id: '7',
    simbolo: '7',
    nombre: 'Dominante',
    formula: ['1', '3', '5', 'b7'],
    opciones: [
      { id: '7-1', tipo: 'mayor', grado: '1', notas: ['1', '9', '3', '5', '13'], nivel: 'dentro', sonido: 'La mayor de la raíz: 9 y 13 sin la b7. Sonido de country y de swing temprano.' },
      { id: '7-1m', tipo: 'menor', grado: '1', notas: ['1', '#9', '11', '5', 'b7'], nivel: 'blues', sonido: 'La menor de la raíz sobre un acorde mayor: la #9 (la b3 de blues) contra la 3. El sonido del blues.' },
      { id: '7-5m', tipo: 'menor', grado: '5', notas: ['5', 'b7', '1', '9', '11'], nivel: 'color', sonido: 'La menor de la 5: b7, 9 y 11 sin la 3. Suena a 7sus4; en un ii–V es la del IIm7 que sigue sonando sobre el V.' },
    ],
  },
  {
    id: '7sus4',
    simbolo: '7sus4',
    nombre: 'Dominante sus4',
    formula: ['1', '4', '5', 'b7'],
    opciones: [
      { id: 'sus-b7', tipo: 'mayor', grado: 'b7', notas: ['b7', '1', '9', '11', '5'], nivel: 'dentro', sonido: 'La mayor de la b7: el acorde sus con la 9. Es la pentatónica del sus por excelencia.' },
      { id: 'sus-4', tipo: 'mayor', grado: '4', notas: ['11', '5', '13', '1', '9'], nivel: 'color', sonido: 'La mayor de la 4: añade la 13. Sonido modal y suspendido, como en Maiden Voyage.' },
    ],
  },
  {
    id: '7alt',
    simbolo: '7alt',
    nombre: 'Dominante alterado',
    formula: ['1', '3', 'b7'],
    opciones: [
      { id: 'alt-b5', tipo: 'mayor', grado: 'b5', notas: ['b5', 'b13', 'b7', 'b9', '#9'], nivel: 'alterado', sonido: 'La mayor de la b5 (en C7, la de Gb): cuatro tensiones alteradas y la b7. La forma más fácil de sonar «alterado».' },
      { id: 'alt-s9', tipo: 'menor', grado: '#9', notas: ['#9', 'b5', 'b13', 'b7', 'b9'], nivel: 'alterado', sonido: 'La menor de la #9 (en C7, la de Eb): las mismas cinco notas que la anterior, pensadas desde otra raíz.' },
    ],
  },
  {
    id: 'm7b5',
    simbolo: 'm7b5',
    nombre: 'Semidisminuido',
    formula: ['1', 'b3', 'b5', 'b7'],
    opciones: [
      { id: 'm7b5-b3', tipo: 'menor', grado: 'b3', notas: ['b3', 'b5', 'b13', 'b7', 'b9'], nivel: 'dentro', sonido: 'La menor de la b3 (en Cø, la de Eb): el acorde sin raíz, con la b13 y la b9 del locrio.' },
      { id: 'm7b5-4', tipo: 'menor', grado: '4', notas: ['11', 'b13', 'b7', '1', 'b3'], nivel: 'color', sonido: 'La menor de la 4: la 11 y la b13 sin la b5. Más suave; útil en el iiø del ii–V menor.' },
    ],
  },
];

const mod = (n: number) => ((n % 12) + 12) % 12;

const NATURALES: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };

/**
 * Raíz de la pentatónica con la grafía con que se piensa: la b5 de Bb es Fb,
 * pero la pentatónica es la de E. Sin dobles alteraciones ni Fb, Cb, E#, B#.
 */
function raizSencilla(raiz: string, o: OpcionPenta): Nota {
  const n = notaDeGrado(raiz, o.grado);
  const pc = pitchClass(n);
  const rara = Math.abs(n.alteracion) > 1 || (n.alteracion !== 0 && NATURALES[pc] !== undefined);
  return rara ? parseNota(NATURALES[pc] ?? formatNota({ letra: n.letra, alteracion: n.alteracion > 0 ? 1 : -1 })) : n;
}

/** Nombre de la pentatónica sobre una raíz: ('C', alt-b5) → 'Gb mayor'. */
export const raizPenta = (raiz: string, o: OpcionPenta) => formatNota(raizSencilla(raiz, o));

export const nombrePenta = (raiz: string, o: OpcionPenta) => `${raizPenta(raiz, o)} ${o.tipo}`;

/** Letras de la pentatónica, deletreadas desde su propia raíz (Gb Ab Bb Db Eb). */
export function letrasPenta(raiz: string, o: OpcionPenta): string[] {
  const r = raizSencilla(raiz, o);
  return FORMULA_PENTA[o.tipo].map((g) => formatNota(notaDeGrado(r, g)));
}

/** La relativa (mismas notas): la mayor de X es la menor de su 6; la menor de X, la mayor de su b3. */
export function relativa(raiz: string, o: OpcionPenta): string {
  const r = raizSencilla(raiz, o);
  return o.tipo === 'mayor' ? `${formatNota(notaDeGrado(r, '6'))} menor` : `${formatNota(notaDeGrado(r, 'b3'))} mayor`;
}

/** Si un grado de la pentatónica es tensión: no es nota del acorde. */
export const esTension = (a: AcordePenta, g: string) => !a.formula.some((f) => mod(semitonosGrado(f)) === mod(semitonosGrado(g)));

/** Las notas de la pentatónica en el mástil, con su grado sobre el acorde y las del acorde marcadas. */
export function notasPenta(raiz: string, a: AcordePenta, o: OpcionPenta): NotaMastil[] {
  return notasFormula(raiz, o.notas, a.formula);
}

/**
 * Acorde de fondo mientras suena la pentatónica: la raíz en el bajo (E2–D#3) y
 * el resto del acorde en la octava de encima.
 */
export function fondoAcorde(raiz: string, a: AcordePenta, duracion: number): Evento[] {
  const pc = pitchClass(notaDeGrado(raiz, '1'));
  const bajo = 40 + mod(pc - 4);
  return [
    { midi: bajo, inicio: 0, duracion },
    ...a.formula.slice(1).map((g) => ({ midi: 52 + mod(pc + semitonosGrado(g) - 4), inicio: 0, duracion })),
  ];
}
