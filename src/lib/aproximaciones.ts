// Aproximaciones cromáticas: notas que preceden a una nota objetivo (normalmente
// del acorde) y caen en ella en el tiempo fuerte. Funciones puras, sin DOM.
import { lineasGuia } from './notas-guia.ts';
import { simboloEn, type AcordeGrado } from './progresiones.ts';
import { ligarRepetidos, type Evento } from './secuencias.ts';
import { LETRAS, formatNota, notaDeGrado, pitchClass, semitonosGrado, type Nota } from './teoria.ts';

/** Paso de una aproximación: cromático (semitonos desde el objetivo) o nota de la escala por encima/debajo. */
type Paso = number | 'escala-arriba' | 'escala-abajo';

export interface Patron {
  id: string;
  nombre: string;
  descripcion: string;
  pasos: Paso[];
}

/** Patrones de aproximación, de más simple a más elaborado. Los pasos van en orden de ejecución. */
export const PATRONES: Patron[] = [
  { id: 'cromatica-abajo', nombre: 'Cromática desde abajo', descripcion: 'Medio tono por debajo.', pasos: [-1] },
  { id: 'cromatica-arriba', nombre: 'Cromática desde arriba', descripcion: 'Medio tono por encima.', pasos: [1] },
  { id: 'escala-arriba', nombre: 'Desde la escala, arriba', descripcion: 'La nota de la escala de encima (diatónica).', pasos: ['escala-arriba'] },
  { id: 'doble-abajo', nombre: 'Doble cromática desde abajo', descripcion: 'Dos semitonos seguidos subiendo.', pasos: [-2, -1] },
  { id: 'doble-arriba', nombre: 'Doble cromática desde arriba', descripcion: 'Dos semitonos seguidos bajando.', pasos: [2, 1] },
  { id: 'encierro', nombre: 'Encierro: escala arriba, cromática abajo', descripcion: 'La de la escala por encima y medio tono por debajo.', pasos: ['escala-arriba', -1] },
  { id: 'encierro-cromatico', nombre: 'Encierro cromático', descripcion: 'Medio tono por encima y medio tono por debajo.', pasos: [1, -1] },
  { id: 'encierro-inverso', nombre: 'Encierro inverso', descripcion: 'Medio tono por debajo y la de la escala por encima.', pasos: [-1, 'escala-arriba'] },
  { id: 'encierro-largo', nombre: 'Encierro largo', descripcion: 'Escala arriba, escala abajo y medio tono por debajo.', pasos: ['escala-arriba', 'escala-abajo', -1] },
  { id: 'triple-abajo', nombre: 'Triple cromática desde abajo', descripcion: 'Tres semitonos seguidos subiendo (sonido bebop).', pasos: [-3, -2, -1] },
];

/** Escala de cada tipo de acorde (grupo de grupos.yaml), para las aproximaciones diatónicas. */
const ESCALAS: Record<string, string[]> = {
  maj7: ['1', '2', '3', '4', '5', '6', '7'], // jónica
  m7: ['1', '2', 'b3', '4', '5', '6', 'b7'], // dórica
  mmaj7: ['1', '2', 'b3', '4', '5', '6', '7'], // menor melódica
  dom7: ['1', '2', '3', '4', '5', '6', 'b7'], // mixolidia
  sus: ['1', '2', '3', '4', '5', '6', 'b7'],
  alt7: ['1', 'b2', '#2', '3', '#4', 'b6', 'b7'], // alterada
  aug: ['1', '2', '3', '#4', '#5', 'b7'], // tonos enteros
  m7b5: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], // locria
  dim7: ['1', '2', 'b3', '4', 'b5', '#5', '6', '7'], // disminuida (tono-semitono)
};

export const escalaDe = (a: AcordeGrado) => ESCALAS[a.grupo] ?? ESCALAS.maj7;

export interface NotaAprox {
  midi: number;
  nota: string;
  /** 'cromatica', 'escala' o 'objetivo'. */
  tipo: 'cromatica' | 'escala' | 'objetivo';
}

export interface Objetivo {
  acorde: AcordeGrado;
  simbolo: string;
  /** Raíz del acorde (para nombrar notas de la escala). */
  raiz: Nota;
  midi: number;
  grado: string;
  nota: string;
  /** Nota del bajo del acorde (MIDI). */
  bajo: number;
}

/**
 * Nombre de una nota cromática a medio tono de otra ya nombrada: la grafía con
 * menos alteraciones; a igualdad, la letra de al lado (D# por debajo de E, Gb por encima de F).
 */
function vecina(n: Nota, direccion: 1 | -1): Nota {
  const misma: Nota = { letra: n.letra, alteracion: n.alteracion + direccion };
  const i = LETRAS.indexOf(n.letra);
  const letra = LETRAS[(i + direccion + 7) % 7];
  const objetivo = (pitchClass(n) + direccion + 12) % 12;
  const natural = pitchClass({ letra, alteracion: 0 });
  let alt = objetivo - natural;
  if (alt > 6) alt -= 12;
  if (alt < -6) alt += 12;
  const otra: Nota = { letra, alteracion: alt };
  return Math.abs(otra.alteracion) <= Math.abs(misma.alteracion) ? otra : misma;
}

/** Notas de un patrón de aproximación hacia un objetivo, terminando en el objetivo. */
export function notasAproximacion(o: Objetivo, patron: Patron): NotaAprox[] {
  const escala = escalaDe(o.acorde).map((g) => ({ g, pc: (pitchClass(o.raiz) + semitonosGrado(g)) % 12 }));
  const objetivo = notaDeGrado(o.raiz, o.grado);
  const deEscala = (direccion: 1 | -1): NotaAprox => {
    for (let d = 1; d <= 4; d++) {
      const m = o.midi + d * direccion;
      const e = escala.find((x) => x.pc === ((m % 12) + 12) % 12);
      if (e) return { midi: m, nota: formatNota(notaDeGrado(o.raiz, e.g)), tipo: 'escala' };
    }
    return { midi: o.midi + 2 * direccion, nota: '?', tipo: 'escala' };
  };
  const cromatica = (st: number): NotaAprox => {
    let n = objetivo;
    for (let k = 0; k < Math.abs(st); k++) n = vecina(n, st > 0 ? 1 : -1);
    return { midi: o.midi + st, nota: formatNota(n), tipo: 'cromatica' };
  };
  return [
    ...patron.pasos.map((p) => (p === 'escala-arriba' ? deEscala(1) : p === 'escala-abajo' ? deEscala(-1) : cromatica(p))),
    { midi: o.midi, nota: formatNota(objetivo), tipo: 'objetivo' as const },
  ];
}

/** La altura de una clase de altura más cercana a `cerca`. */
const cercana = (pc: number, cerca: number) => cerca + ((((pc - cerca) % 12) + 18) % 12) - 6;

const bajoDe = (tonica: string, a: AcordeGrado) => {
  const pc = (pitchClass(notaDeGrado(tonica, a.grado)) + semitonosGrado(a.bajo ?? '1')) % 12;
  return 43 + ((pc - 7 + 12) % 12);
};

/** Objetivos sobre un solo acorde: sus notas (1, 3, 5, 7) una por compás, cerca de G4. */
export function objetivosAcorde(tonica: string, acorde: AcordeGrado): Objetivo[] {
  const raiz = notaDeGrado(tonica, acorde.grado);
  let previa = 67;
  return acorde.formula.slice(0, 4).map((g) => {
    const midi = cercana((pitchClass(raiz) + semitonosGrado(g)) % 12, previa);
    previa = midi;
    return { acorde, simbolo: simboloEn(tonica, acorde), raiz, midi, grado: g, nota: formatNota(notaDeGrado(raiz, g)), bajo: bajoDe(tonica, acorde) };
  });
}

/** Objetivos sobre una progresión: la línea aguda de notas guía (una 3 o una 7 en cada acorde). */
export function objetivosProgresion(tonica: string, compases: readonly AcordeGrado[][]): Objetivo[] {
  const acordes = compases.flat();
  return lineasGuia(tonica, compases, '7').map((g, i) => {
    const v = g.voces[1];
    const acorde = acordes[i];
    // La línea guía va en registro medio; la melodía, una octava por encima si cabe.
    const midi = v.midi + 12 <= 79 ? v.midi + 12 : v.midi;
    return { acorde, simbolo: g.simbolo, raiz: notaDeGrado(tonica, acorde.grado), midi, grado: v.grado, nota: v.nota, bajo: g.bajo };
  });
}

/**
 * Audio y tramos: cada objetivo cae en el primer pulso de su tramo y las notas de
 * aproximación hacia el siguiente objetivo ocupan las últimas corcheas del tramo
 * (el último tramo se aproxima al primero, para el bucle). Con `acorde`, suena la
 * raíz en el bajo y la 3 y la 7 debajo de la melodía durante todo el tramo.
 */
export function secuenciaAproximacion(
  objetivos: readonly Objetivo[],
  duraciones: readonly number[],
  patron: Patron,
  bpm: number,
  op: { acorde?: boolean; sostenido?: boolean } = {},
): { eventos: Evento[]; tramos: { inicio: number; fin: number }[]; duracion: number } {
  const corchea = 30 / bpm;
  const eventos: Evento[] = [];
  const tramos: { inicio: number; fin: number }[] = [];
  let t = 0;
  objetivos.forEach((o, i) => {
    const dur = duraciones[i] * (60 / bpm);
    const siguiente = objetivos[(i + 1) % objetivos.length];
    const aprox = notasAproximacion(siguiente, patron).slice(0, -1);
    const finObjetivo = Math.max(corchea, dur - aprox.length * corchea);
    eventos.push({ midi: o.midi, inicio: t, duracion: finObjetivo * 0.95 });
    aprox.forEach((n, k) => eventos.push({ midi: n.midi, inicio: t + finObjetivo + k * corchea, duracion: corchea * 0.9 }));
    if (op.acorde) {
      const pcRaiz = pitchClass(o.raiz);
      const guia = [o.acorde.formula.find((g) => /^b?3$|^4$/.test(g)), o.acorde.formula.find((g) => /^b{0,2}7$|^6$/.test(g))].filter(Boolean) as string[];
      const notas = [o.bajo, ...guia.map((g) => cercana((pcRaiz + semitonosGrado(g)) % 12, 55))];
      for (const midi of notas) eventos.push({ midi, inicio: t, duracion: op.sostenido ? dur : dur * 0.92 });
    }
    tramos.push({ inicio: t, fin: t + dur });
    t += dur;
  });
  return { eventos: op.sostenido ? ligarRepetidos(eventos) : eventos, tramos, duracion: t };
}
