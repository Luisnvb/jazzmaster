// Digitación y posiciones: una escala de siete notas digitada de dos maneras,
// en una posición fija (un dedo por traste, las 12 posiciones) o con tres notas
// por cuerda (siete formas que suben en diagonal), con el dedo de cada nota, los
// estiramientos y los cambios de posición. Funciones puras, sin DOM.
import type { NotaMastil } from './arpegios.ts';
import { AFINACION } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

const mod = (n: number, m = 12) => ((n % m) + m) % m;

export interface EscalaDigitacion {
  id: string;
  nombre: string;
  formula: string[];
}

export const ESCALAS_DIGITACION: EscalaDigitacion[] = [
  { id: 'mayor', nombre: 'Mayor', formula: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: 'menor-melodica', nombre: 'Menor melódica', formula: ['1', '2', 'b3', '4', '5', '6', '7'] },
  { id: 'menor-armonica', nombre: 'Menor armónica', formula: ['1', '2', 'b3', '4', '5', 'b6', '7'] },
];

export type Sistema = 'posicion' | 'tres';

export const SISTEMAS: Record<Sistema, string> = {
  posicion: 'Posición fija (un dedo por traste)',
  tres: 'Tres notas por cuerda',
};

/** Posiciones: el traste del índice, del 1 al 12. */
export const POSICIONES = Array.from({ length: 12 }, (_, i) => i + 1);

export interface NotaDigitada extends NotaMastil {
  /** 0 = cuerda al aire, 1 = índice … 4 = meñique. */
  dedo: number;
  /** El dedo sale de su traste (índice hacia atrás o meñique hacia delante). */
  estiramiento: boolean;
  /** Primera nota de una cuerda en la que la mano ya no está donde estaba. */
  cambio: boolean;
}

export interface Digitacion {
  sistema: Sistema;
  nombre: string;
  /** De la más grave a la más aguda; cada altura, una vez. */
  notas: NotaDigitada[];
  /** Traste más bajo y más alto (sin contar las cuerdas al aire). */
  desde: number;
  hasta: number;
  /** Notas en cada cuerda, de 6ª a 1ª. */
  porCuerda: number[];
  estiramientos: number;
  cambios: number;
}

/** Grado de la escala que suena en una altura, o null si no es de la escala. */
function gradoEn(tonica: string, formula: readonly string[], midi: number): string | null {
  const pc = pitchClass(notaDeGrado(tonica, '1'));
  return formula.find((g) => mod(pc + semitonosGrado(g)) === mod(midi)) ?? null;
}

function nota(tonica: string, cuerda: number, traste: number, grado: string, dedo: number, estiramiento = false): NotaDigitada {
  return {
    cuerda,
    traste,
    midi: AFINACION[cuerda] + traste,
    grado,
    nota: formatNota(notaDeGrado(tonica, grado)),
    dedo,
    estiramiento,
    cambio: false,
  };
}

function resumen(sistema: Sistema, nombre: string, notas: NotaDigitada[]): Digitacion {
  const pisadas = notas.filter((n) => n.traste > 0).map((n) => n.traste);
  const porCuerda = [0, 0, 0, 0, 0, 0];
  for (const n of notas) porCuerda[n.cuerda]++;
  // La mano se mueve cuando, en una cuerda, el índice no cae donde caía en la anterior.
  let indice: number | null = null;
  for (let c = 0; c < 6; c++) {
    const enCuerda = notas.filter((n) => n.cuerda === c && n.dedo > 0 && !n.estiramiento);
    if (!enCuerda.length) continue;
    const i = enCuerda[0].traste - (enCuerda[0].dedo - 1);
    if (indice !== null && i !== indice) enCuerda[0].cambio = true;
    indice = i;
  }
  return {
    sistema,
    nombre,
    notas,
    desde: Math.min(...pisadas),
    hasta: Math.max(...pisadas),
    porCuerda,
    estiramientos: notas.filter((n) => n.estiramiento).length,
    cambios: notas.filter((n) => n.cambio).length,
  };
}

/**
 * La escala en una posición fija: el índice en el traste `p` y un dedo por
 * traste (p … p + 3). Las notas que caen entre dos cuerdas se tocan estirando:
 * el meñique al traste p + 4 o el índice al p − 1, en la cuerda que tenga menos
 * notas (si empatan, el meñique). En la posición 1, el traste p − 1 es la cuerda al aire.
 */
export function enPosicion(tonica: string, formula: readonly string[], p: number): Digitacion {
  const enVentana = (c: number) =>
    [0, 1, 2, 3].filter((k) => gradoEn(tonica, formula, AFINACION[c] + p + k) !== null).length;
  const cuenta = AFINACION.map((_, c) => enVentana(c));
  const notas: NotaDigitada[] = [];
  for (let midi = AFINACION[0] + p - 1; midi <= AFINACION[5] + p + 4; midi++) {
    const g = gradoEn(tonica, formula, midi);
    if (!g) continue;
    const dentro = AFINACION.findIndex((o) => midi - o >= p && midi - o <= p + 3);
    if (dentro >= 0) {
      const t = midi - AFINACION[dentro];
      notas.push(nota(tonica, dentro, t, g, t - p + 1));
      continue;
    }
    // Entre dos cuerdas: meñique estirado en la de abajo o índice estirado en la de arriba.
    const conMenique = AFINACION.findIndex((o) => midi - o === p + 4);
    const conIndice = AFINACION.findIndex((o) => midi - o === p - 1);
    const usarIndice = conIndice >= 0 && (conMenique < 0 || cuenta[conIndice] < cuenta[conMenique]);
    if (usarIndice) {
      notas.push(nota(tonica, conIndice, p - 1, g, p - 1 === 0 ? 0 : 1, p - 1 > 0));
      cuenta[conIndice]++;
    } else {
      notas.push(nota(tonica, conMenique, p + 4, g, 4, true));
      cuenta[conMenique]++;
    }
  }
  return resumen('posicion', `Posición ${p}`, notas);
}

/** Dedos de las tres notas de una cuerda: índice en la primera y meñique en la última. */
export function dedosTres(trastes: readonly [number, number, number]): [number, number, number] {
  const [a, b, c] = trastes;
  return [1, b - a <= c - b ? 2 : 3, 4];
}

/**
 * La escala con tres notas por cuerda, empezando en la 6ª cuerda por el grado
 * número `k` de la fórmula (0 = tónica), en su traste más bajo del 1 al 12.
 * Son 18 notas seguidas: dos octavas y una 3ª.
 */
export function tresPorCuerda(tonica: string, formula: readonly string[], k: number): Digitacion {
  const pcGrado = mod(pitchClass(notaDeGrado(tonica, '1')) + semitonosGrado(formula[k]));
  const inicio = 1 + mod(pcGrado - AFINACION[0] - 1);
  const alturas: number[] = [];
  for (let midi = AFINACION[0] + inicio; alturas.length < 18; midi++) if (gradoEn(tonica, formula, midi)) alturas.push(midi);
  const notas: NotaDigitada[] = [];
  for (let c = 0; c < 6; c++) {
    const tres = alturas.slice(3 * c, 3 * c + 3).map((m) => m - AFINACION[c]) as [number, number, number];
    const dedos = dedosTres(tres);
    tres.forEach((t, i) => notas.push(nota(tonica, c, t, gradoEn(tonica, formula, AFINACION[c] + t)!, dedos[i], t - tres[0] > 3 && i === 2)));
  }
  return resumen('tres', `Desde el ${formula[k]}`, notas);
}

export function digitar(tonica: string, formula: readonly string[], sistema: Sistema, forma: number): Digitacion {
  return sistema === 'posicion' ? enPosicion(tonica, formula, forma) : tresPorCuerda(tonica, formula, forma);
}

/** Recorrido para tocar: sube de la más grave a la más aguda y vuelve a bajar. */
export function subeYBaja(d: Digitacion): NotaDigitada[] {
  return [...d.notas, ...d.notas.slice(0, -1).reverse()];
}

/** Nombre con octava (C4 = do central). */
export const conOctava = (n: NotaMastil) => `${n.nota}${Math.floor(n.midi / 12) - 1}`;
