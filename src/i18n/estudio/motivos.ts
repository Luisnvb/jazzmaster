// Textos de Motivos y desarrollo (components/estudio/motivos.astro). En español, las
// escalas, los ejemplos y las transformaciones salen de lib/motivos.ts.
import { ESCALAS_MOTIVO, MOTIVOS_EJEMPLO, TRANSFORMACIONES } from '../../lib/motivos.ts';
import { textos } from '../idiomas.ts';

const porId = <T extends { id: string; nombre: string }>(lista: readonly T[]): Record<string, string> =>
  Object.fromEntries(lista.map((x) => [x.id, x.nombre]));
type Transformaciones = Record<string, { nombre: string; descripcion: string }>;
const transformacionesEs: Transformaciones = Object.fromEntries(
  TRANSFORMACIONES.map(({ id, nombre, descripcion }) => [id, { nombre, descripcion }]),
);

export const MOTIVOS = textos(
  {
    titulo: 'Motivos y desarrollo',
    ejemplo: 'Ejemplo',
    escala: 'Escala',
    escalas: porId(ESCALAS_MOTIVO),
    partirDe: 'Partir de',
    ejemplos: porId(MOTIVOS_EJEMPLO),
    empiezaEn: 'Empieza en',
    tiempo: 'tiempo {n}',
    contratiempo: 'y (contratiempo del {n})',
    conAcorde: 'Con acorde de fondo',
    anadir: '+ Nota',
    todas: '▶ Todas seguidas',
    leyenda:
      'En cada tarjeta, el original en gris (primer compás) y la transformación en color. Las líneas gruesas son las barras de compás y las finas, los pulsos.',
    nota: 'Nota',
    alteracion: 'Alteración',
    duracion: 'Duración',
    silencioAntes: 'Silencio antes',
    duraciones: ['Corchea', 'Corchea con puntillo', 'Negra', 'Negra con puntillo', 'Blanca'],
    quitarNota: 'Quitar la nota {n}',
    quitar: 'Quitar',
    ocupa: 'Ocupa {l} de 8 corcheas del compás.',
    noCabe: 'Ocupa {l} corcheas: no cabe en un compás. Acorta alguna nota o un silencio.',
    tocar: 'Tocar {nombre}',
    transformaciones: transformacionesEs,
  },
  {
    titulo: 'Motifs and development',
    ejemplo: 'Example',
    escala: 'Scale',
    escalas: {
      jonica: 'Major (Ionian)',
      dorica: 'Dorian',
      mixolidia: 'Mixolydian',
      eolica: 'Natural minor (Aeolian)',
      armonica: 'Harmonic minor',
    },
    partirDe: 'Start from',
    ejemplos: {
      arpegio: 'Arpeggio 1–3–5',
      cromatico: 'Chromatic descent 5–b5–4–3',
      llamada: 'Three repeated notes and a leap',
      charleston: 'Rhythmic (Charleston)',
    },
    empiezaEn: 'Starts on',
    tiempo: 'beat {n}',
    contratiempo: '& (off-beat of {n})',
    conAcorde: 'With background chord',
    anadir: '+ Note',
    todas: '▶ All in a row',
    leyenda:
      'In each card, the original in grey (first bar) and the transformation in colour. The thick lines are bar lines and the thin ones, beats.',
    nota: 'Note',
    alteracion: 'Accidental',
    duracion: 'Duration',
    silencioAntes: 'Rest before',
    duraciones: ['Eighth', 'Dotted eighth', 'Quarter', 'Dotted quarter', 'Half'],
    quitarNota: 'Remove note {n}',
    quitar: 'Remove',
    ocupa: 'It takes {l} of the 8 eighths in the bar.',
    noCabe: 'It takes {l} eighths: it does not fit in one bar. Shorten a note or a rest.',
    tocar: 'Play {nombre}',
    transformaciones: {
      repeticion: { nombre: 'Repetition', descripcion: 'The same idea again. It seems little, but it is what makes the listener recognise it.' },
      secuencia: {
        nombre: 'Sequence (one degree up)',
        descripcion: 'Each note goes up one scale degree. The intervals change a little (a major 3rd may become minor) and the idea stays in the key.',
      },
      transposicion: {
        nombre: 'Real transposition (a 4th up)',
        descripcion: 'The same exact intervals from another note: the idea leaves the scale. It is what you do when taking a motif to the next chord of a ii–V.',
      },
      inversion: {
        nombre: 'Inversion',
        descripcion: 'The intervals upside down from the first note: what went up goes down and vice versa (diatonic inversion, by scale degrees).',
      },
      retrogradacion: { nombre: 'Retrograde', descripcion: 'The idea back to front: the notes and the rhythm in reverse order.' },
      desplazamiento: {
        nombre: 'Rhythmic displacement',
        descripcion: 'The same notes one eighth later. What fell on the beat falls off it and the idea sounds different without changing a note.',
      },
      aumentacion: { nombre: 'Augmentation', descripcion: 'The rhythm twice as slow: the same notes at double the duration.' },
      disminucion: { nombre: 'Diminution', descripcion: 'The rhythm twice as fast: the idea fits twice where it used to fit once.' },
      fragmentacion: {
        nombre: 'Fragmentation',
        descripcion: 'Only a piece (the first two notes), repeated. Useful for insisting on the most recognisable part of the idea.',
      },
      ampliacion: {
        nombre: 'Interval expansion',
        descripcion: 'Each note moves twice as many degrees away from the first: the same contour, with bigger leaps.',
      },
    },
  },
);
