// Patrones de práctica sobre una escala o un arpegio. Un patrón es una «célula»
// de posiciones que se repite empezando en cada nota: [0, 1, 2] sobre una escala
// da 1-2-3, 2-3-4, 3-4-5… Funciones puras, sin DOM.
import type { Evento } from './secuencias.ts';
import { ajustarARango, formatNota, midi, notaBajoGrado, notaDeGrado, semitonosGrado } from './teoria.ts';

export interface Patron {
  id: string;
  nombre: string;
  descripcion?: string;
  /** Sobre qué se aplica: las notas de una escala o las de un arpegio. */
  sobre: 'escala' | 'arpegio';
  /**
   * Posiciones relativas a la nota de partida (0 = la propia nota, 2 = dos notas
   * más arriba en la escala o el arpegio). Con «-» o «+» detrás, un semitono por
   * debajo o por encima de esa nota (aproximaciones cromáticas): '0-'.
   */
  celula: (number | string)[];
  /** Subir y después bajar con la célula invertida (por defecto, sí). */
  idaYVuelta?: boolean;
}

export interface Paso {
  /** Posición en la escala o el arpegio (puede pasar de la octava o ser negativa). */
  indice: number;
  /** -1, 0 o 1 semitonos de aproximación cromática. */
  cromatico: number;
}

export function parsePaso(p: number | string): Paso {
  const m = /^(-?\d+)([+-])?$/.exec(String(p).trim());
  if (!m) throw new Error(`Paso no válido: "${p}" (usa números, con + o - detrás para una nota cromática: 0-)`);
  return { indice: Number(m[1]), cromatico: m[2] === '+' ? 1 : m[2] === '-' ? -1 : 0 };
}

/** Grupos de pasos del patrón: uno por cada nota de partida (una octava arriba y, si toca, abajo). */
export function gruposDelPatron(p: Patron, notasPorOctava: number): Paso[][] {
  const celula = p.celula.map(parsePaso);
  if (celula.length === 0) throw new Error('La célula está vacía.');
  const grupos: Paso[][] = [];
  for (let inicio = 0; inicio <= notasPorOctava; inicio++) {
    grupos.push(celula.map((c) => ({ indice: inicio + c.indice, cromatico: c.cromatico })));
  }
  if (p.idaYVuelta !== false) {
    for (let inicio = notasPorOctava; inicio >= 0; inicio--) {
      grupos.push(celula.map((c) => ({ indice: inicio - c.indice, cromatico: -c.cromatico })));
    }
  }
  return grupos;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Grado (de la fórmula) y octava de una posición: índice 8 en una escala de 7 → 2ª nota, octava 1. */
function gradoDe(formula: readonly string[], indice: number) {
  return { grado: formula[mod(indice, formula.length)], octava: Math.floor(indice / formula.length) };
}

/** Nombre de la nota de un paso, con ortografía correcta (las cromáticas, respecto a su nota). */
export function notaDePaso(tonica: string, formula: readonly string[], paso: Paso): string {
  const nota = notaDeGrado(tonica, gradoDe(formula, paso.indice).grado);
  if (paso.cromatico === 1) return formatNota(notaDeGrado(nota, 'b2'));
  if (paso.cromatico === -1) return formatNota(notaBajoGrado(nota, 'b2'));
  return formatNota(nota);
}

/** Grados de un grupo tal como se leen: 1-2-3; las cromáticas, con ↓/↑ (semitono por debajo/encima): 2-↓1-1. */
export function etiquetaGrupo(formula: readonly string[], grupo: Paso[]): string {
  const flecha = (c: number) => (c < 0 ? '↓' : c > 0 ? '↑' : '');
  return grupo.map((p) => `${flecha(p.cromatico)}${gradoDe(formula, p.indice).grado}`).join('-');
}

export interface TramoPatron {
  grupo: number;
  inicio: number;
  fin: number;
}

/** Audio en corcheas: cada paso, media parte. Todo dentro del rango de la guitarra. */
export function secuenciaPatron(tonica: string, formula: readonly string[], grupos: Paso[][], bpm: number): { eventos: Evento[]; tramos: TramoPatron[] } {
  const corchea = 60 / bpm / 2;
  const raiz = midi(tonica, 3);
  const alturas = grupos.flat().map((p) => {
    const { grado, octava } = gradoDe(formula, p.indice);
    return raiz + (semitonosGrado(grado) % 12) + 12 * octava + p.cromatico;
  });
  const ajustadas = ajustarARango(alturas);
  const eventos = ajustadas.map((m, i) => ({ midi: m, inicio: i * corchea, duracion: i === ajustadas.length - 1 ? 1.2 : corchea * 1.05 }));
  const tramos: TramoPatron[] = [];
  let k = 0;
  grupos.forEach((g, i) => {
    tramos.push({ grupo: i, inicio: k * corchea, fin: (k + g.length) * corchea });
    k += g.length;
  });
  return { eventos, tramos };
}
