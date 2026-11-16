// Dictado melódico (llamada y respuesta): suena una frase de un compás y en el
// compás siguiente hay que tocarla igual en la guitarra. Las frases se generan al
// azar sobre un contexto armónico (un vamp o una progresión, compás a compás) con
// un aspecto del lenguaje del jazz (arpegios, escala, bebop, aproximaciones…) y
// caben en una posición del mástil. Funciones puras, sin DOM.
import { alturasAcompanamiento } from './acompanamiento.ts';
import { escalaDe } from './aproximaciones.ts';
import type { NotaMastil } from './arpegios.ts';
import { aleatorio, escalaBebopDe, gradosFuertes } from './bebop.ts';
import { simboloEn, type AcordeGrado } from './progresiones.ts';
import { AFINACION, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado, type Nota } from './teoria.ts';

const mod = (n: number, m = 12) => ((n % m) + m) % m;

// --- Contextos armónicos ---------------------------------------------------------

export interface ContextoArmonico {
  id: string;
  nombre: string;
  descripcion: string;
  /** Compases en grados (como en progresiones.yaml). Cada uno se toca dos veces: llamada y respuesta. */
  compases: string[];
}

export const CONTEXTOS: ContextoArmonico[] = [
  { id: 'maj7', nombre: 'Vamp Imaj7', descripcion: 'Un solo acorde mayor: el color estable del jónico.', compases: ['Imaj7'] },
  { id: 'm7', nombre: 'Vamp Im7 (dórico)', descripcion: 'Un acorde menor quieto, como en So What o Impressions.', compases: ['Im7'] },
  { id: 'dom7', nombre: 'Vamp I7', descripcion: 'Dominante estático: mixolidio y blues.', compases: ['I7'] },
  { id: 'ii-v', nombre: 'ii–V en un compás', descripcion: 'IIm7 y V7 en el mismo compás: la frase cruza el cambio en el tiempo 3.', compases: ['IIm7 V7'] },
  { id: 'ii-v-i', nombre: 'ii–V–I mayor', descripcion: 'Un acorde por compás: IIm7, V7 e Imaj7 dos veces.', compases: ['IIm7', 'V7', 'Imaj7', 'Imaj7'] },
  { id: 'ii-v-i-menor', nombre: 'ii–V–i menor', descripcion: 'IIm7b5, V7alt e Im6: el sonido menor, con tensiones alteradas en el dominante.', compases: ['IIm7b5', 'V7alt', 'Im6', 'Im6'] },
  { id: 'turnaround', nombre: 'Turnaround I–VI–II–V', descripcion: 'Dos acordes por compás: Imaj7 VI7 | IIm7 V7.', compases: ['Imaj7 VI7', 'IIm7 V7'] },
  {
    id: 'blues',
    nombre: 'Blues de jazz',
    descripcion: 'Los doce compases del blues de jazz, cada uno con su llamada y su respuesta.',
    compases: ['I7', 'IV7', 'I7', 'Vm7 I7', 'IV7', '#IV°7', 'I7', 'VI7', 'IIm7', 'V7', 'I7 VI7', 'IIm7 V7'],
  },
];

// --- Aspectos del lenguaje y dificultad -------------------------------------------

export type Aspecto = 'arpegios' | 'escala' | 'bebop' | 'aproximaciones' | 'notas-guia' | 'tensiones' | 'blues';

export const ASPECTOS: { id: Aspecto; nombre: string; descripcion: string }[] = [
  { id: 'arpegios', nombre: 'Arpegios', descripcion: 'Solo notas del acorde, saltando de una a la siguiente: el esqueleto de la armonía.' },
  { id: 'escala', nombre: 'Escala', descripcion: 'Por grados de la escala del acorde, con notas del acorde en los tiempos fuertes.' },
  { id: 'bebop', nombre: 'Bebop', descripcion: 'Corcheas seguidas por la escala bebop: la nota de paso deja las del acorde en los tiempos.' },
  { id: 'aproximaciones', nombre: 'Aproximaciones', descripcion: 'Notas del acorde en los tiempos, a las que se llega por medio tono o desde la escala.' },
  { id: 'notas-guia', nombre: 'Notas guía', descripcion: 'La 3 y la 7 de cada acorde, con el menor movimiento al cambiar de acorde.' },
  { id: 'tensiones', nombre: 'Tensiones', descripcion: '9, 11 y 13 en los tiempos fuertes, que resuelven por grado a una nota del acorde.' },
  { id: 'blues', nombre: 'Blues', descripcion: 'La escala de blues de la tonalidad (con la b5) sobre todos los acordes.' },
];

export type Dificultad = 'facil' | 'media' | 'dificil';

export const DIFICULTADES: { id: Dificultad; nombre: string; descripcion: string }[] = [
  { id: 'facil', nombre: 'Fácil', descripcion: 'Tres o cuatro notas, casi todas en negras, en poco más de una octava.' },
  { id: 'media', nombre: 'Media', descripcion: 'Cinco o seis notas con corcheas y anticipaciones.' },
  { id: 'dificil', nombre: 'Difícil', descripcion: 'Seis a ocho corcheas, en todo el registro de la posición y con saltos más grandes.' },
];

/** Ritmos de un compás de 4/4, en corcheas desde el tiempo 1 (0, 2, 4, 6 son los tiempos). */
const RITMOS: Record<Dificultad, number[][]> = {
  facil: [
    [0, 2, 4],
    [0, 2, 4, 6],
    [0, 4, 6],
    [0, 2, 6],
    [2, 4, 6],
    [0, 3, 4],
  ],
  media: [
    [0, 2, 3, 4, 6],
    [0, 1, 2, 4],
    [0, 1, 2, 3, 4],
    [1, 2, 4, 6],
    [0, 2, 3, 5, 6],
    [0, 1, 2, 3, 4, 6],
    [2, 3, 4, 5, 6],
  ],
  dificil: [
    [0, 1, 2, 3, 4, 5, 6],
    [0, 1, 2, 3, 4, 5, 6, 7],
    [1, 2, 3, 4, 5, 6, 7],
    [0, 1, 2, 3, 5, 6, 7],
    [0, 1, 3, 4, 5, 6],
  ],
};

/** Corcheas seguidas (bebop): siempre desde un tiempo, para que las notas del acorde caigan en ellos. */
const RITMOS_CORRIDOS: Record<Dificultad, number[][]> = {
  facil: [
    [0, 1, 2, 3, 4],
    [2, 3, 4, 5, 6],
  ],
  media: [
    [0, 1, 2, 3, 4, 5, 6],
    [2, 3, 4, 5, 6, 7],
    [0, 1, 2, 3, 4, 6],
  ],
  dificil: [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [1, 2, 3, 4, 5, 6, 7],
  ],
};

/** Aproximaciones: corcheas a contratiempo que llevan a una nota en el tiempo siguiente. */
const RITMOS_APROXIMACION: Record<Dificultad, number[][]> = {
  facil: [
    [1, 2, 4],
    [0, 3, 4],
    [3, 4, 6],
    [0, 1, 2, 6],
  ],
  media: [
    [0, 1, 2, 3, 4],
    [1, 2, 3, 4, 6],
    [0, 2, 3, 4, 5, 6],
  ],
  dificil: [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [1, 2, 3, 4, 5, 6],
    [0, 1, 2, 3, 4, 5, 6],
  ],
};

/** Notas guía: pocas notas y largas. */
const RITMOS_GUIA: Record<Dificultad, number[][]> = {
  facil: [
    [0, 4],
    [0, 2, 4],
    [0, 4, 6],
  ],
  media: [
    [0, 2, 4, 6],
    [0, 3, 4],
    [0, 2, 3, 4],
  ],
  dificil: [
    [0, 1, 2, 4, 6],
    [0, 2, 3, 4, 5, 6],
  ],
};

/** Salto máximo entre dos notas seguidas (semitonos). */
const SALTO: Record<Dificultad, number> = { facil: 7, media: 9, dificil: 12 };

/** Tensiones de cada tipo de acorde (grupo de grupos.yaml), con su nombre de tensión. */
const TENSIONES: Record<string, string[]> = {
  maj7: ['9', '#11', '13'],
  m7: ['9', '11'],
  mmaj7: ['9', '11', '13'],
  dom7: ['9', '13'],
  sus: ['9', '13'],
  alt7: ['b9', '#9', '#11', 'b13'],
  aug: ['9', '#11'],
  m7b5: ['9', '11', 'b13'],
  dim7: ['9', '11', 'b13', '7'],
};

const ES_TENSION = /^(b|#)?(9|11|13)$/;

/** Escala de blues de la tonalidad (para el aspecto «Blues»). */
const BLUES = ['1', 'b3', '4', 'b5', '5', 'b7'];

/** Nombre de cada distancia a la raíz cuando no es del acorde, de la escala ni tensión. */
const NOMBRES = ['1', 'b9', '9', 'b3', '3', '11', '#11', '5', 'b13', '13', 'b7', '7'];

// --- Registro y posición -------------------------------------------------------------

/** Trastes de una posición (índice en el traste `p`): de p − 1 a p + 4; en la 1, las cuerdas al aire. */
export const trastesPosicion = (p: number) => ({ desde: Math.max(0, p - 1), hasta: p + 4 });

export const POSICIONES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Registro de la frase en una posición (siempre dentro de ella), más corto en las fáciles. */
export function registro(p: number, d: Dificultad): { min: number; max: number } {
  const centro = 56 + p;
  if (d === 'facil') return { min: centro - 5, max: centro + 7 };
  if (d === 'media') return { min: centro - 9, max: centro + 9 };
  return { min: 45 + p, max: 66 + p };
}

/**
 * Dónde tocar cada nota dentro de la posición: la cuerda cuyo traste queda más
 * cerca del centro de la mano, sin saltar de cuerda si no hace falta.
 */
export function digitarEnPosicion(midis: readonly number[], p: number): { cuerda: number; traste: number }[] {
  const { desde, hasta } = trastesPosicion(p);
  const centro = p + 1.5;
  let previa: number | null = null;
  return midis.map((m) => {
    const opciones = AFINACION.map((a, c) => ({ cuerda: c, traste: m - a })).filter((o) => o.traste >= desde && o.traste <= hasta);
    // Fuera de la posición (no debería pasar): el sitio más cercano a ella en el mástil.
    const candidatas = opciones.length ? opciones : AFINACION.map((a, c) => ({ cuerda: c, traste: m - a })).filter((o) => o.traste >= 0 && o.traste <= 15);
    const coste = (o: { cuerda: number; traste: number }) => Math.abs(o.traste - centro) + (previa === null ? 0 : 0.6 * Math.abs(o.cuerda - previa));
    const mejor = candidatas.sort((a, b) => coste(a) - coste(b))[0];
    previa = mejor.cuerda;
    return mejor;
  });
}

// --- Frase -------------------------------------------------------------------------

export type TipoNota = 'acorde' | 'tension' | 'escala' | 'cromatica';

export interface NotaDictado {
  midi: number;
  nota: string;
  /** Grado sobre el acorde que suena en ese momento. */
  grado: string;
  tipo: TipoNota;
  /** Corchea en la que empieza, desde el tiempo 1. */
  inicio: number;
  /** Corcheas que dura. */
  dur: number;
  /** Índice del acorde del compás sobre el que suena. */
  acorde: number;
  cuerda: number;
  traste: number;
}

export interface AcordeFrase {
  acorde: AcordeGrado;
  simbolo: string;
  /** Corcheas del compás que ocupa: [desde, hasta). */
  desde: number;
  hasta: number;
}

export interface FraseDictado {
  acordes: AcordeFrase[];
  notas: NotaDictado[];
  /** Corcheas del compás. */
  corcheas: number;
  posicion: number;
}

interface Contexto {
  acorde: AcordeGrado;
  raiz: Nota;
  pc: number;
  /** Notas del acorde (sin tensiones). */
  tonos: string[];
  escala: string[];
  tensiones: string[];
  bebop: string[];
  fuertesBebop: string[];
  /** 3 y 7 (o 6, o 4 en el sus). */
  guia: string[];
}

function contexto(tonica: string, a: AcordeGrado): Contexto {
  const raiz = notaDeGrado(tonica, a.grado);
  const bebop = escalaBebopDe(a);
  const tonos = a.formula.filter((g) => !ES_TENSION.test(g));
  const guia = [a.formula.find((g) => /^(b?3|4)$/.test(g)), a.formula.find((g) => /^(b{0,2}7|6)$/.test(g))].filter((g): g is string => !!g);
  return {
    acorde: a,
    raiz,
    pc: pitchClass(raiz),
    tonos,
    escala: escalaDe(a),
    tensiones: TENSIONES[a.grupo] ?? TENSIONES.maj7,
    bebop: bebop.formula,
    fuertesBebop: gradosFuertes(bebop),
    guia: guia.length ? guia : tonos,
  };
}

/** Las alturas del registro cuyas notas están en los grados dados (sobre `pc`), de grave a agudo. */
function alturas(pc: number, grados: readonly string[], min: number, max: number): number[] {
  const pcs = new Set(grados.map((g) => mod(pc + semitonosGrado(g))));
  const res: number[] = [];
  for (let m = min; m <= max; m++) if (pcs.has(mod(m))) res.push(m);
  return res;
}

/** Grado de una altura sobre el acorde, con el tipo de nota que es. */
function nombrar(ctx: Contexto, midi: number): { grado: string; nota: string; tipo: TipoNota } {
  const st = mod(midi - ctx.pc);
  const es = (g: string) => mod(semitonosGrado(g)) === st;
  let grado = ctx.acorde.formula.find(es);
  let tipo: TipoNota = 'acorde';
  if (grado) {
    if (ES_TENSION.test(grado)) tipo = 'tension';
  } else if ((grado = ctx.tensiones.find(es))) {
    tipo = 'tension';
  } else if ((grado = ctx.escala.find(es))) {
    tipo = 'escala';
  } else {
    grado = NOMBRES[st];
    tipo = 'cromatica';
  }
  return { grado, nota: formatNota(notaDeGrado(ctx.raiz, grado)), tipo };
}

/** La altura de la lista más cercana a `objetivo`; a veces, si está casi igual de cerca, la segunda. */
function cerca(lista: readonly number[], objetivo: number, azar: () => number, evitar?: number | null): number {
  const orden = lista.filter((m) => m !== evitar).sort((a, b) => Math.abs(a - objetivo) - Math.abs(b - objetivo));
  const [a, b] = orden;
  if (a === undefined) return lista[0];
  if (b !== undefined && Math.abs(b - objetivo) - Math.abs(a - objetivo) <= 1 && azar() < 0.4) return b;
  return a;
}

const elegirDe = <T>(lista: readonly T[], azar: () => number): T => lista[Math.floor(azar() * lista.length)];

/** Índice de la altura de la lista más cercana a `m`. */
const indiceCercano = (lista: readonly number[], m: number) =>
  lista.reduce((mejor, x, i) => (Math.abs(x - m) < Math.abs(lista[mejor] - m) ? i : mejor), 0);

/**
 * Paso por una lista de alturas: `paso` posiciones en la dirección `dir`, dando
 * la vuelta en los extremos y si el salto se pasa de `salto` semitonos.
 */
function avanzar(lista: readonly number[], desde: number, dir: 1 | -1, paso: number, salto: number): { midi: number; dir: 1 | -1 } {
  const i = indiceCercano(lista, desde);
  for (const d of [dir, -dir as 1 | -1]) {
    for (let p = paso; p >= 1; p--) {
      const x = lista[i + d * p];
      if (x !== undefined && Math.abs(x - desde) <= salto && x !== desde) return { midi: x, dir: d };
    }
  }
  return { midi: lista[i], dir: -dir as 1 | -1 };
}

/** Reparto del compás entre sus acordes, en tiempos enteros. */
function repartir(n: number, corcheas: number): { desde: number; hasta: number }[] {
  return Array.from({ length: n }, (_, j) => ({
    desde: Math.round((corcheas * j) / n / 2) * 2,
    hasta: Math.round((corcheas * (j + 1)) / n / 2) * 2,
  }));
}

function ritmoDe(aspecto: Aspecto, d: Dificultad, corcheas: number, azar: () => number): number[] {
  const tabla =
    aspecto === 'bebop' ? RITMOS_CORRIDOS : aspecto === 'aproximaciones' ? RITMOS_APROXIMACION : aspecto === 'notas-guia' ? RITMOS_GUIA : RITMOS;
  // En compases más cortos (3/4), solo las corcheas que caben; al menos dos notas.
  const validos = tabla[d].map((r) => r.filter((o) => o < corcheas)).filter((r) => r.length >= 2);
  return elegirDe(validos.length ? validos : [[0, 2]], azar);
}

/**
 * Una frase de un compás sobre los acordes de `compas`, en la posición `posicion`
 * (traste del índice). La misma semilla da la misma frase.
 */
export function generarFrase(
  tonica: string,
  compas: readonly AcordeGrado[],
  aspecto: Aspecto,
  dificultad: Dificultad,
  posicion: number,
  semilla = 1,
  pulsos = 4,
): FraseDictado {
  const azar = aleatorio(semilla);
  const corcheas = pulsos * 2;
  const tramos = repartir(compas.length, corcheas);
  const ctxs = compas.map((a) => contexto(tonica, a));
  const acordes: AcordeFrase[] = compas.map((a, j) => ({ acorde: a, simbolo: simboloEn(tonica, a), ...tramos[j] }));
  const acordeEn = (o: number) => Math.max(0, tramos.findIndex((t) => o >= t.desde && o < t.hasta));
  const ritmo = ritmoDe(aspecto, dificultad, corcheas, azar);
  const { min, max } = registro(posicion, dificultad);
  const salto = SALTO[dificultad];
  const centro = Math.round((min + max) / 2) + Math.floor(azar() * 7) - 3;
  const fuerte = (o: number) => o % 2 === 0;

  const midis: number[] = [];
  let dir: 1 | -1 = azar() < 0.5 ? 1 : -1;
  const previa = () => midis[midis.length - 1] ?? null;
  const cambiaAcorde = (i: number) => i > 0 && acordeEn(ritmo[i]) !== acordeEn(ritmo[i - 1]);
  /** Una nota del acorde cerca de la anterior (o del centro), siguiendo la dirección. */
  const delAcordeCerca = (ctx: Contexto, distancia = 2) => {
    const p = previa();
    return cerca(alturas(ctx.pc, ctx.tonos, min, max), p === null ? centro : p + dir * distancia, azar, p);
  };

  switch (aspecto) {
    case 'arpegios':
    case 'escala': {
      ritmo.forEach((o, i) => {
        const ctx = ctxs[acordeEn(o)];
        const tonos = alturas(ctx.pc, ctx.tonos, min, max);
        if (i === 0 || cambiaAcorde(i)) {
          midis.push(delAcordeCerca(ctx));
          return;
        }
        if (azar() < 0.15) dir = -dir as 1 | -1;
        const lista = aspecto === 'arpegios' ? tonos : alturas(ctx.pc, ctx.escala, min, max);
        let r = avanzar(lista, previa()!, dir, azar() < (aspecto === 'arpegios' ? 0.8 : 0.85) ? 1 : 2, salto);
        // Sin ir y volver a la misma nota (C–B–C) casi nunca: si pasa, se sigue hacia el otro lado.
        if (r.midi === midis[midis.length - 2] && azar() < 0.8) {
          const otra = avanzar(lista, previa()!, -r.dir as 1 | -1, 1, salto);
          if (otra.midi !== r.midi) r = otra;
        }
        if (aspecto === 'arpegios') {
          dir = r.dir;
          midis.push(r.midi);
          return;
        }
        // En los tiempos, si no es del acorde, un paso más (queda un salto de 3ª a una nota del acorde).
        if (fuerte(o) && !tonos.includes(r.midi)) {
          const otra = avanzar(lista, r.midi, r.dir, 1, salto);
          if (tonos.includes(otra.midi) && Math.abs(otra.midi - previa()!) <= salto) r = otra;
        }
        dir = r.dir;
        midis.push(r.midi);
      });
      break;
    }

    case 'bebop': {
      // Casi siempre bajando, como en las líneas bebop; a veces subiendo.
      dir = azar() < 0.7 ? -1 : 1;
      ritmo.forEach((o, i) => {
        const ctx = ctxs[acordeEn(o)];
        const lista = alturas(ctx.pc, ctx.bebop, min - 2, max + 2).filter((m) => m >= min && m <= max);
        const fuertes = alturas(ctx.pc, ctx.fuertesBebop, min, max);
        if (i === 0 || cambiaAcorde(i)) {
          if (fuerte(o)) {
            // Si baja, empieza por arriba (y al revés), para que la línea tenga sitio.
            midis.push(cerca(fuertes, previa() === null ? centro - dir * 4 : previa()! + dir, azar, previa()));
          } else {
            // Empieza a contratiempo: la nota de la escala que lleva a la del acorde del tiempo siguiente.
            const destino = cerca(fuertes, centro - dir * 4, azar);
            midis.push(avanzar(lista, destino, -dir as 1 | -1, 1, 3).midi);
          }
          return;
        }
        let r = avanzar(lista, previa()!, dir, 1, 3);
        // En un extremo del registro se da la vuelta; si eso deja una nota de paso en el tiempo, se salta a una del acorde.
        if (fuerte(o) && !fuertes.includes(r.midi)) r = { midi: cerca(fuertes, previa()! + r.dir, azar, previa()), dir: r.dir };
        dir = r.dir;
        midis.push(r.midi);
      });
      break;
    }

    case 'aproximaciones':
    case 'notas-guia': {
      // Primero los objetivos (las notas en los tiempos y la última); después, las que llevan a ellos.
      const objetivos = new Map<number, number>();
      let ultimo: number | null = null;
      ritmo.forEach((o, i) => {
        const esObjetivo = fuerte(o) || i === ritmo.length - 1 || ritmo[i + 1] !== o + 1;
        if (!esObjetivo) return;
        const ctx = ctxs[acordeEn(o)];
        const grados = aspecto === 'notas-guia' ? ctx.guia : ctx.tonos;
        const lista = alturas(ctx.pc, grados, min, max).filter((m) => ultimo === null || Math.abs(m - ultimo) <= salto);
        let m: number;
        if (ultimo === null) m = cerca(lista, centro, azar);
        else if (aspecto === 'notas-guia') m = cerca(lista, ultimo, azar, lista.length > 1 && !(i > 0 && acordeEn(o) !== acordeEn(ritmo[i - 1])) ? ultimo : null);
        else {
          if (azar() < 0.3) dir = -dir as 1 | -1;
          m = cerca(lista, ultimo + dir * (2 + Math.floor(azar() * 3)), azar, ultimo);
          if (m >= max - 2) dir = -1;
          else if (m <= min + 2) dir = 1;
        }
        objetivos.set(i, m);
        ultimo = m;
      });
      ritmo.forEach((_, i) => {
        const m = objetivos.get(i);
        if (m !== undefined) {
          midis.push(m);
          return;
        }
        // A contratiempo y justo antes de un objetivo: medio tono abajo, medio tono arriba o la nota de la escala de encima.
        const destino = objetivos.get(i + 1)!;
        const ctx = ctxs[acordeEn(ritmo[i + 1])];
        const r = azar();
        let a = r < 0.5 ? destino - 1 : r < 0.75 ? destino + 1 : alturas(ctx.pc, ctx.escala, destino + 1, destino + 3)[0] ?? destino + 1;
        if (a === previa()) a = a === destino - 1 ? destino + 1 : destino - 1;
        midis.push(a);
      });
      break;
    }

    case 'tensiones': {
      let resolver = false;
      ritmo.forEach((o, i) => {
        const ctx = ctxs[acordeEn(o)];
        const tonos = alturas(ctx.pc, ctx.tonos, min, max);
        const p = previa();
        if (resolver && p !== null) {
          // La tensión resuelve por grado (1 o 2 semitonos), mejor bajando.
          const cerca2 = tonos.filter((m) => Math.abs(m - p) <= 2 && m !== p).sort((a, b) => a - b);
          midis.push(cerca2.find((m) => m < p) ?? cerca2[0] ?? cerca(tonos, p, azar, p));
          resolver = false;
          return;
        }
        if (fuerte(o) && azar() < 0.65) {
          const lista = alturas(ctx.pc, ctx.tensiones, min, max).filter((m) => p === null || Math.abs(m - p) <= salto);
          if (lista.length) {
            midis.push(cerca(lista, p === null ? centro : p + dir * 3, azar, p));
            resolver = i < ritmo.length - 1;
            return;
          }
        }
        if (azar() < 0.25) dir = -dir as 1 | -1;
        midis.push(i === 0 || cambiaAcorde(i) ? delAcordeCerca(ctx, 3) : avanzar(tonos, p!, dir, 1, salto).midi);
      });
      break;
    }

    case 'blues': {
      const lista = alturas(pitchClass(notaDeGrado(tonica, '1')), BLUES, min, max);
      const reposo = alturas(pitchClass(notaDeGrado(tonica, '1')), ['1', 'b3', '5'], min, max);
      ritmo.forEach((_, i) => {
        if (i === 0) {
          midis.push(cerca(lista, centro, azar));
          return;
        }
        if (i === ritmo.length - 1) {
          // Termina en la tónica, la b3 o la 5.
          midis.push(cerca(reposo, previa()! + dir, azar, previa()));
          return;
        }
        if (azar() < 0.25) dir = -dir as 1 | -1;
        const r = avanzar(lista, previa()!, dir, azar() < 0.75 ? 1 : 2, salto);
        dir = r.dir;
        midis.push(r.midi);
      });
      break;
    }
  }

  const sitios = digitarEnPosicion(midis, posicion);
  const notas: NotaDictado[] = ritmo.map((o, i) => {
    const sig = ritmo[i + 1];
    // La última dura hasta dos tiempos, sin pasar del compás.
    const dur = sig !== undefined ? sig - o : Math.max(1, Math.min(4, corcheas - o));
    const j = acordeEn(o);
    return { midi: midis[i], ...nombrar(ctxs[j], midis[i]), inicio: o, dur, acorde: j, ...sitios[i] };
  });
  return { acordes, notas, corcheas, posicion };
}

export type Rotulo = 'grado' | 'nota' | 'orden';

/**
 * Las notas de la frase para dibujarlas en el mástil (lib/arpegios.ts, mastilSVG).
 * Una nota repetida en el mismo sitio se dibuja una vez; con «orden», lleva todos sus números.
 */
export function notasMastilFrase(f: FraseDictado, rotulo: Rotulo): NotaMastil[] {
  const porSitio = new Map<string, NotaMastil>();
  f.notas.forEach((n, i) => {
    const clave = `${n.cuerda}-${n.traste}`;
    const previa = porSitio.get(clave);
    if (previa) {
      if (rotulo === 'orden') previa.rotulo = `${previa.rotulo}·${i + 1}`;
      return;
    }
    porSitio.set(clave, {
      cuerda: n.cuerda,
      traste: n.traste,
      midi: n.midi,
      grado: n.grado,
      nota: n.nota,
      rotulo: rotulo === 'orden' ? String(i + 1) : rotulo === 'nota' ? n.nota : n.grado,
      atenuada: false,
    });
  });
  return [...porSitio.values()];
}

// --- Audio ---------------------------------------------------------------------------

export type EstiloDictado = 'ninguno' | 'bajo' | 'acorde';

export const ESTILOS_DICTADO: { id: EstiloDictado; nombre: string }[] = [
  { id: 'acorde', nombre: 'Bajo y acorde' },
  { id: 'bajo', nombre: 'Solo bajo' },
  { id: 'ninguno', nombre: 'Sin acompañamiento' },
];

export interface OpcionesDictado {
  /** Proporción de la corchea larga (0.5 = corcheas iguales; 0.62 ≈ swing medio). */
  swing?: number;
  acompanamiento?: EstiloDictado;
  /** Clic en 2 y 4 (o en todos los tiempos que no son el 1, en otros compases). */
  metronomo?: boolean;
  /** Un compás de cuenta (clic en cada tiempo) antes de la llamada. */
  cuenta?: boolean;
  /** Solo la llamada, sin el compás de respuesta. */
  soloLlamada?: boolean;
  /** Acordes mantenidos (órgano, pad). */
  sostenido?: boolean;
}

/** Volumen del acompañamiento respecto a la melodía. */
const VOL_BAJO = 0.55;
const VOL_ACORDE = 0.35;

/**
 * Audio de una vuelta: cuenta (opcional), llamada (la frase con el acompañamiento)
 * y respuesta (el acompañamiento solo, para tocar encima). Devuelve también cuándo
 * empiezan la llamada y la respuesta y cuándo suena cada nota (desde la llamada).
 */
export function secuenciaDictado(
  f: FraseDictado,
  tonica: string,
  bpm: number,
  op: OpcionesDictado = {},
): { eventos: Evento[]; duracion: number; llamada: number; compas: number; notas: { inicio: number; fin: number }[] } {
  const pulso = 60 / bpm;
  const swing = op.swing ?? 0.5;
  const pulsos = f.corcheas / 2;
  const compas = pulsos * pulso;
  const momento = (c: number) => Math.floor(c / 2) * pulso + (c % 2 ? swing * pulso : 0);
  const llamada = op.cuenta ? compas : 0;
  const compases = op.soloLlamada ? 1 : 2;
  const eventos: Evento[] = [];

  if (op.cuenta) {
    for (let t = 0; t < pulsos; t++) eventos.push({ midi: 0, inicio: t * pulso, duracion: 0.05, clic: t === 0 ? 'fuerte' : 'debil' });
  }

  const notas = f.notas.map((n) => ({ inicio: momento(n.inicio), fin: momento(n.inicio + n.dur) }));
  f.notas.forEach((n, i) => {
    const { inicio, fin } = notas[i];
    eventos.push({ midi: n.midi, inicio: llamada + inicio, duracion: (fin - inicio) * 0.92 });
  });

  for (let c = 0; c < compases; c++) {
    const base = llamada + c * compas;
    if (op.metronomo) {
      for (let t = 1; t < pulsos; t++) {
        if (pulsos === 4 && t % 2 === 0) continue;
        eventos.push({ midi: 0, inicio: base + t * pulso, duracion: 0.05, clic: 'debil' });
      }
    }
    if (!op.acompanamiento || op.acompanamiento === 'ninguno') continue;
    for (const a of f.acordes) {
      const raiz = formatNota(notaDeGrado(tonica, a.acorde.grado));
      const { bajo, quinta, acorde } = alturasAcompanamiento(raiz, a.acorde.formula);
      const desde = base + momento(a.desde);
      const hasta = base + momento(a.hasta);
      const largo = a.hasta - a.desde;
      // Bajo a dos en un compás entero (raíz y 5); una sola nota si el acorde dura menos.
      if (largo >= 8) {
        const mitad = base + momento(a.desde + 4);
        eventos.push({ midi: bajo, inicio: desde, duracion: (mitad - desde) * 0.95, volumen: VOL_BAJO });
        eventos.push({ midi: quinta, inicio: mitad, duracion: (hasta - mitad) * 0.95, volumen: VOL_BAJO });
      } else {
        eventos.push({ midi: bajo, inicio: desde, duracion: (hasta - desde) * 0.95, volumen: VOL_BAJO });
      }
      if (op.acompanamiento !== 'acorde') continue;
      // Acorde: mantenido, o en charlestón (el 1 y la corchea del 2) si dura un compás; un golpe si dura menos.
      const golpes: [number, number][] = op.sostenido
        ? [[desde, hasta - desde]]
        : largo >= 8
          ? [
              [desde, pulso * 0.6],
              [base + momento(a.desde + 3), pulso * 0.5],
            ]
          : [[desde, Math.min(pulso, hasta - desde) * 0.9]];
      for (const [inicio, duracion] of golpes) acorde.forEach((m, k) => eventos.push({ midi: m, inicio: inicio + k * 0.008, duracion, volumen: VOL_ACORDE }));
    }
  }
  eventos.sort((a, b) => a.inicio - b.inicio || a.midi - b.midi);
  return { eventos, duracion: llamada + compases * compas, llamada, compas, notas };
}
