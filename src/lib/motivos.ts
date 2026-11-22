// Motivos y desarrollo: una idea corta (3–4 notas) y sus transformaciones clásicas
// (repetir, secuenciar, transponer, invertir, retrogradar, desplazar, aumentar,
// disminuir, fragmentar y ampliar), con el original y la transformación seguidos.
// Funciones puras, sin DOM.
import { ligarRepetidos, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

/** Nota del motivo: posición en la escala (0 = tónica, 7 = octava, negativas por debajo), alteración y ritmo en corcheas. */
export interface NotaMotivo {
  p: number;
  alt: -1 | 0 | 1;
  /** Duración en corcheas (0,5 = semicorchea). */
  dur: number;
  /** Silencio antes de la nota, en corcheas. */
  pausa: number;
}

export interface Motivo {
  /** Corchea del compás en la que empieza (0 = tiempo 1, 1 = «y» del 1…). */
  inicio: number;
  notas: NotaMotivo[];
}

export interface EscalaMotivo {
  id: string;
  nombre: string;
  formula: string[];
}

export const ESCALAS_MOTIVO: EscalaMotivo[] = [
  { id: 'jonica', nombre: 'Mayor (jónica)', formula: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: 'dorica', nombre: 'Dórica', formula: ['1', '2', 'b3', '4', '5', '6', 'b7'] },
  { id: 'mixolidia', nombre: 'Mixolidia', formula: ['1', '2', '3', '4', '5', '6', 'b7'] },
  { id: 'eolica', nombre: 'Menor natural (eólica)', formula: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
  { id: 'armonica', nombre: 'Menor armónica', formula: ['1', '2', 'b3', '4', '5', 'b6', '7'] },
];

const n = (p: number, dur: number, alt: -1 | 0 | 1 = 0, pausa = 0): NotaMotivo => ({ p, alt, dur, pausa });

/** Motivos de partida para el editor. */
export const MOTIVOS_EJEMPLO: { id: string; nombre: string; motivo: Motivo }[] = [
  { id: 'arpegio', nombre: 'Arpegio 1–3–5', motivo: { inicio: 0, notas: [n(0, 1), n(2, 1), n(4, 2)] } },
  { id: 'cromatico', nombre: 'Bajada cromática 5–b5–4–3', motivo: { inicio: 0, notas: [n(4, 1), n(4, 1, -1), n(3, 1), n(2, 3)] } },
  { id: 'llamada', nombre: 'Tres repetidas y salto', motivo: { inicio: 1, notas: [n(4, 1), n(4, 1), n(4, 1), n(2, 4)] } },
  { id: 'charleston', nombre: 'Rítmico (charlestón)', motivo: { inicio: 0, notas: [n(4, 3), n(5, 1), n(4, 2, 0, 1)] } },
];

/** Nota ya situada en el tiempo, con su altura y su nombre. */
export interface NotaReal {
  midi: number;
  nota: string;
  /** Corchea en la que empieza, desde el principio de la frase. */
  inicio: number;
  dur: number;
}

export interface Contexto {
  tonica: string;
  escala: EscalaMotivo;
}

/** Tónica entre A3 y G#4: el motivo queda en el registro medio de la guitarra. */
const baseMidi = (tonica: string) => 57 + ((pitchClass(notaDeGrado(tonica, '1')) - 9 + 12) % 12);

/** Altura y nombre de una nota del motivo en una tónica y una escala. */
export function realizar(ctx: Contexto, x: NotaMotivo): { midi: number; nota: string } {
  const grado = ctx.escala.formula[((x.p % 7) + 7) % 7];
  const octava = Math.floor(x.p / 7);
  const nota = notaDeGrado(ctx.tonica, grado);
  return {
    midi: baseMidi(ctx.tonica) + 12 * octava + semitonosGrado(grado) + x.alt,
    nota: formatNota({ ...nota, alteracion: nota.alteracion + x.alt }),
  };
}

/** Las notas del motivo situadas en el tiempo, a partir de la corchea `desde`. */
export function notasReales(ctx: Contexto, m: Motivo, desde = 0): NotaReal[] {
  let t = desde + m.inicio;
  return m.notas.map((x) => {
    t += x.pausa;
    const r = { ...realizar(ctx, x), inicio: t, dur: x.dur };
    t += x.dur;
    return r;
  });
}

const finDe = (notas: readonly NotaReal[]) => Math.max(...notas.map((x) => x.inicio + x.dur));

/** Cambia la posición en la escala de cada nota (las alteraciones se mantienen o se invierten). */
const mapear = (m: Motivo, f: (x: NotaMotivo, primera: NotaMotivo) => NotaMotivo): Motivo => ({
  ...m,
  notas: m.notas.map((x) => f(x, m.notas[0])),
});

/** Cambia el ritmo: cada duración, cada silencio y el comienzo multiplicados por `k`. */
const escalarRitmo = (m: Motivo, k: number): Motivo => ({
  inicio: m.inicio * k,
  notas: m.notas.map((x) => ({ ...x, dur: x.dur * k, pausa: x.pausa * k })),
});

export interface Transformacion {
  id: string;
  nombre: string;
  descripcion: string;
  /** Notas de la transformación, empezando a contar en la corchea `desde`. */
  aplicar: (ctx: Contexto, m: Motivo, desde: number) => NotaReal[];
}

export const TRANSFORMACIONES: Transformacion[] = [
  {
    id: 'repeticion',
    nombre: 'Repetición',
    descripcion: 'La misma idea otra vez. Parece poco, pero es lo que hace que el oyente la reconozca.',
    aplicar: (ctx, m, desde) => notasReales(ctx, m, desde),
  },
  {
    id: 'secuencia',
    nombre: 'Secuencia (un grado arriba)',
    descripcion: 'Cada nota sube un grado de la escala. Los intervalos cambian un poco (una 3ª mayor puede volverse menor) y la idea se queda en la tonalidad.',
    aplicar: (ctx, m, desde) => notasReales(ctx, mapear(m, (x) => ({ ...x, p: x.p + 1 })), desde),
  },
  {
    id: 'transposicion',
    nombre: 'Transposición real (una 4ª arriba)',
    descripcion: 'Los mismos intervalos exactos desde otra nota: la idea sale de la escala. Es lo que se hace al llevar un motivo al acorde siguiente de un ii–V.',
    aplicar: (ctx, m, desde) =>
      notasReales(ctx, m, desde).map((x) => ({ ...x, midi: x.midi + 5, nota: formatNota(notaDeGrado(x.nota, '4')) })),
  },
  {
    id: 'inversion',
    nombre: 'Inversión',
    descripcion: 'Los intervalos al revés desde la primera nota: lo que subía baja y al contrario (inversión diatónica, por grados de la escala).',
    aplicar: (ctx, m, desde) => notasReales(ctx, mapear(m, (x, a) => ({ ...x, p: 2 * a.p - x.p, alt: -x.alt as NotaMotivo['alt'] })), desde),
  },
  {
    id: 'retrogradacion',
    nombre: 'Retrogradación',
    descripcion: 'La idea de atrás adelante: las notas y el ritmo en orden inverso.',
    aplicar: (ctx, m, desde) => {
      const orig = notasReales(ctx, m, desde);
      const ini = desde + m.inicio;
      const fin = finDe(orig);
      return orig.map((x) => ({ ...x, inicio: ini + (fin - (x.inicio + x.dur)) })).reverse();
    },
  },
  {
    id: 'desplazamiento',
    nombre: 'Desplazamiento rítmico',
    descripcion: 'Las mismas notas una corchea más tarde. Lo que caía en el tiempo cae a contratiempo y la idea suena distinta sin cambiar una nota.',
    aplicar: (ctx, m, desde) => notasReales(ctx, m, desde + 1),
  },
  {
    id: 'aumentacion',
    nombre: 'Aumentación',
    descripcion: 'El ritmo el doble de lento: las mismas notas con el doble de duración.',
    aplicar: (ctx, m, desde) => notasReales(ctx, escalarRitmo(m, 2), desde),
  },
  {
    id: 'disminucion',
    nombre: 'Disminución',
    descripcion: 'El ritmo el doble de rápido: la idea cabe dos veces donde antes cabía una.',
    aplicar: (ctx, m, desde) => {
      const d = escalarRitmo(m, 0.5);
      const una = notasReales(ctx, d, desde);
      const largo = finDe(una) - (desde + d.inicio);
      return [...una, ...notasReales(ctx, d, desde + largo)];
    },
  },
  {
    id: 'fragmentacion',
    nombre: 'Fragmentación',
    descripcion: 'Solo un trozo (las dos primeras notas), repetido. Sirve para insistir en lo más reconocible de la idea.',
    aplicar: (ctx, m, desde) => {
      const trozo: Motivo = { inicio: m.inicio, notas: m.notas.slice(0, 2) };
      const una = notasReales(ctx, trozo, desde);
      const largo = finDe(una) - (desde + m.inicio);
      return [...una, ...notasReales(ctx, trozo, desde + largo)];
    },
  },
  {
    id: 'ampliacion',
    nombre: 'Ampliación de intervalos',
    descripcion: 'Cada nota se aleja de la primera el doble de grados: el mismo contorno, con saltos más grandes.',
    aplicar: (ctx, m, desde) => notasReales(ctx, mapear(m, (x, a) => ({ ...x, p: a.p + 2 * (x.p - a.p) })), desde),
  },
];

/** Original (primer compás) y transformación (desde el segundo), y cuántos compases ocupa todo. */
export function frase(ctx: Contexto, m: Motivo, t: Transformacion): { original: NotaReal[]; transformada: NotaReal[]; compases: number } {
  const original = notasReales(ctx, m, 0);
  const transformada = t.aplicar(ctx, m, 8);
  return { original, transformada, compases: Math.max(2, Math.ceil(finDe(transformada) / 8)) };
}

/** Comprueba un motivo (de 1 a 4 notas, duraciones positivas). */
export function motivoValido(m: Motivo): boolean {
  return m.notas.length >= 1 && m.notas.length <= 4 && m.notas.every((x) => x.dur > 0 && x.pausa >= 0) && m.inicio >= 0;
}

/**
 * Rollo de piano: el tiempo en horizontal (compases y pulsos) y la altura en
 * vertical. El original va en gris y la transformación en el color de acento.
 * Cada nota lleva data-k (orden en la frase completa) para marcarla al sonar.
 */
export function rolloSVG(original: readonly NotaReal[], transformada: readonly NotaReal[], compases: number, idioma: 'es' | 'en' = 'es'): string {
  const todas = [...original, ...transformada];
  const alto = Math.max(...todas.map((x) => x.midi)) + 2;
  const bajo = Math.min(...todas.map((x) => x.midi)) - 1;
  const cx = 18; // ancho de una corchea
  const fy = 6; // alto de un semitono
  const arriba = 12; // sitio para el nombre de la nota más aguda
  const ancho = compases * 8 * cx;
  const altura = arriba + (alto - bajo) * fy;
  const y = (midi: number) => arriba + (alto - midi) * fy;
  const lineas: string[] = [];
  for (let c = 0; c <= compases * 8; c += 2) {
    const compas = c % 8 === 0;
    lineas.push(`<line class="${compas ? 'barra' : 'pulso'}" x1="${c * cx}" x2="${c * cx}" y1="0" y2="${altura}" />`);
  }
  const nota = (x: NotaReal, k: number, clase: string) => {
    const x0 = x.inicio * cx + 1;
    const w = Math.max(4, x.dur * cx - 2);
    return `<g class="${clase}" data-k="${k}"><rect x="${x0}" y="${y(x.midi) - fy + 1}" width="${w}" height="${fy * 2 - 2}" rx="2" /><text x="${x0 + 1}" y="${y(x.midi) - fy - 1}">${x.nota}</text></g>`;
  };
  return `<svg class="rollo" viewBox="0 0 ${ancho} ${altura}" role="img" aria-label="${idioma === 'en' ? 'Original and transformation over time' : 'Original y transformación en el tiempo'}">
    ${lineas.join('')}
    ${original.map((x, k) => nota(x, k, 'original')).join('')}
    ${transformada.map((x, k) => nota(x, original.length + k, 'transformada')).join('')}
  </svg>`;
}

export interface OpcionesMotivo {
  /** Proporción de la corchea larga (0,5 = iguales). */
  swing?: number;
  /** Acorde de la tónica de fondo (bajo y notas guía) en cada compás. */
  acorde?: boolean;
  sostenido?: boolean;
}

/** Acorde de la tónica de la escala: grados 1, 3, 5 y 7 (Cmaj7 en jónica, Cm7 en dórica…). */
const acordeTonica = (e: EscalaMotivo) => [e.formula[0], e.formula[2], e.formula[4], e.formula[6]];

/** Audio de una frase (original + transformación), y cuándo suena cada nota para marcarla. */
export function secuenciaFrase(
  ctx: Contexto,
  notas: readonly NotaReal[],
  compases: number,
  bpm: number,
  op: OpcionesMotivo = {},
): { eventos: Evento[]; tiempos: { inicio: number; fin: number }[]; duracion: number } {
  const pulso = 60 / bpm;
  const s = op.swing ?? 0.5;
  // Corchea (puede ser fraccionaria) → segundos, con la primera corchea de cada pulso más larga si hay swing.
  const momento = (c: number) => {
    const p = Math.floor(c / 2);
    const x = c - 2 * p;
    return p * pulso + (x < 1 ? x * s : s + (x - 1) * (1 - s)) * pulso;
  };
  const eventos: Evento[] = [];
  const tiempos = notas.map((x) => {
    const inicio = momento(x.inicio);
    const fin = momento(x.inicio + x.dur);
    eventos.push({ midi: x.midi, inicio, duracion: (fin - inicio) * 0.92 });
    return { inicio, fin };
  });
  const duracion = compases * 4 * pulso;
  if (op.acorde) {
    const pc = pitchClass(notaDeGrado(ctx.tonica, '1'));
    const bajo = 43 + ((pc - 7 + 12) % 12);
    const [, g3, , g7] = acordeTonica(ctx.escala);
    const guia = [g3, g7].map((g) => 48 + ((pc + semitonosGrado(g) - 48 + 120) % 12));
    for (let c = 0; c < compases; c++) {
      for (const midi of [bajo, ...guia]) {
        eventos.push({ midi, inicio: c * 4 * pulso, duracion: 4 * pulso * (op.sostenido ? 1 : 0.9) });
      }
    }
  }
  return { eventos: op.sostenido ? ligarRepetidos(eventos) : eventos, tiempos, duracion };
}
