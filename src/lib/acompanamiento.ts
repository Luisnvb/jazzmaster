// Acompañamiento para practicar encima: un acorde en bucle (bajo y acorde) con
// varios estilos, de un pedal quieto a un vamp de swing o de bossa. Se toca en
// bucles de dos compases. Funciones puras, sin DOM.
import type { Evento } from './secuencias.ts';
import { notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

export type EstiloAcompanamiento = 'pedal' | 'acorde' | 'swing' | 'bossa';

export const ESTILOS_ACOMPANAMIENTO: { id: EstiloAcompanamiento; nombre: string; descripcion: string }[] = [
  { id: 'pedal', nombre: 'Pedal', descripcion: 'Raíz y 5 graves, quietas: para oír cada nota contra la tónica.' },
  { id: 'acorde', nombre: 'Acorde', descripcion: 'Bajo y acorde completos, un golpe por compás.' },
  { id: 'swing', nombre: 'Swing', descripcion: 'Bajo a dos (raíz y 5) y el acorde en charlestón, con corcheas de swing.' },
  { id: 'bossa', nombre: 'Bossa', descripcion: 'Bajo de bossa (raíz y 5) y el acorde en corcheas a contratiempo.' },
];

export const estiloValido = (x: unknown): EstiloAcompanamiento =>
  ESTILOS_ACOMPANAMIENTO.some((e) => e.id === x) ? (x as EstiloAcompanamiento) : 'swing';

export interface OpcionesAcompanamiento {
  /** Clic de metrónomo en el 2 y el 4. */
  metronomo?: boolean;
  /** Notas que el instrumento mantiene (órgano, pad): se ligan en vez de repetir el golpe. */
  sostenido?: boolean;
}

const mod = (n: number, m = 12) => ((n % m) + m) % m;
const num = (g: string) => g.replace(/^[b#]+/, '');

/** Compases de cada vuelta del bucle. */
export const COMPASES_BUCLE = 2;

/**
 * Las alturas del acompañamiento de un acorde: el bajo (raíz entre E2 y D#3), su
 * 5 (la del acorde: b5, #5… o la justa si no tiene) y el acorde en registro medio
 * (cada nota entre G3 y F#4, de grave a agudo).
 */
export function alturasAcompanamiento(raiz: string, formula: readonly string[]) {
  const pc = pitchClass(notaDeGrado(raiz, '1'));
  const bajo = 40 + mod(pc - 4);
  const g5 = formula.find((g) => num(g) === '5') ?? '5';
  const quinta = bajo + semitonosGrado(g5);
  const acorde = [...new Set(formula.map((g) => 55 + mod(pc + semitonosGrado(g) - 7)))].sort((a, b) => a - b);
  return { bajo, quinta, acorde };
}

/**
 * Dos compases de acompañamiento del acorde en un estilo, para tocar en bucle.
 * Devuelve los eventos y la duración de la vuelta (segundos).
 */
export function secuenciaAcompanamiento(
  raiz: string,
  formula: readonly string[],
  estilo: EstiloAcompanamiento,
  bpm: number,
  op: OpcionesAcompanamiento = {},
): { eventos: Evento[]; duracion: number } {
  const pulso = 60 / bpm;
  const compas = 4 * pulso;
  const duracion = COMPASES_BUCLE * compas;
  const { bajo, quinta, acorde } = alturasAcompanamiento(raiz, formula);
  const eventos: Evento[] = [];
  /** Una nota en el pulso `p` (en pulsos desde el principio de la vuelta) que dura `d` pulsos. */
  const nota = (midi: number, p: number, d: number) => eventos.push({ midi, inicio: p * pulso, duracion: d * pulso * 0.95 });
  const golpe = (p: number, d: number) => acorde.forEach((m, i) => nota(m, p + i * 0.01, d));

  switch (estilo) {
    case 'pedal':
      for (let c = 0; c < COMPASES_BUCLE; c++) {
        nota(bajo, c * 4, 4);
        nota(quinta, c * 4, 4);
      }
      break;
    case 'acorde':
      for (let c = 0; c < COMPASES_BUCLE; c++) {
        nota(bajo, c * 4, 4);
        golpe(c * 4, 4);
      }
      break;
    case 'swing':
      // Bajo a dos: raíz en el 1 y 5 en el 3. Charlestón: el 1 y la corchea de swing del 2.
      for (let c = 0; c < COMPASES_BUCLE; c++) {
        nota(bajo, c * 4, 2);
        nota(quinta, c * 4 + 2, 2);
        golpe(c * 4, 0.6);
        golpe(c * 4 + 1 + 2 / 3, 0.5);
      }
      break;
    case 'bossa':
      // Bajo: raíz en el 1 y 5 en el 3, cada una anticipada por una corchea; acorde a contratiempo.
      for (let c = 0; c < COMPASES_BUCLE; c++) {
        nota(bajo, c * 4, 1.5);
        nota(quinta, c * 4 + 1.5, 0.5);
        nota(quinta, c * 4 + 2, 1.5);
        nota(bajo, c * 4 + 3.5, 0.5);
      }
      for (const [p, d] of [[0, 0.9], [1.5, 0.9], [3, 0.9], [5, 0.9], [6.5, 1.4]] as const) golpe(p, d);
      break;
  }
  if (op.metronomo) {
    for (let p = 1; p < COMPASES_BUCLE * 4; p += 2) eventos.push({ midi: 0, inicio: p * pulso, duracion: 0.05, clic: p % 4 === 1 ? 'fuerte' : 'debil' });
  }
  eventos.sort((a, b) => a.inicio - b.inicio || a.midi - b.midi);
  // Con un instrumento que mantiene la nota, el pedal y el acorde no se repiten: suenan seguidos.
  if (op.sostenido && (estilo === 'pedal' || estilo === 'acorde')) {
    for (const e of eventos) if (!e.clic) e.duracion = duracion - e.inicio;
    return { eventos: eventos.filter((e) => e.clic || e.inicio < pulso / 2), duracion };
  }
  return { eventos, duracion };
}
