// Textos de Aproximaciones cromáticas (components/estudio/aproximaciones.astro). En español,
// los nombres y las descripciones de los patrones salen de lib/aproximaciones.ts.
import { PATRONES } from '../../lib/aproximaciones.ts';
import { textos } from '../idiomas.ts';

type Patrones = Record<string, { nombre: string; descripcion: string }>;
const patronesEs: Patrones = Object.fromEntries(PATRONES.map(({ id, nombre, descripcion }) => [id, { nombre, descripcion }]));

export const APROXIMACIONES = textos(
  {
    titulo: 'Aproximaciones cromáticas',
    ejemplo: 'Ejemplo',
    objetivos: 'Objetivos',
    notasAcorde: 'Notas de un acorde',
    progresion: 'Progresión',
    acorde: 'Acorde',
    patron: 'Patrón',
    patrones: patronesEs,
    conAcorde: 'Con acorde de fondo',
    leyenda1: 'En cada recuadro, las notas que llevan a su objetivo:',
    cromatica: 'cromática',
    escala: 'de la escala',
    objetivo: 'objetivo',
    leyenda2: '. Las aproximaciones suenan en las últimas corcheas del compás anterior y el objetivo en el tiempo 1.',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
  },
  {
    titulo: 'Chromatic approaches',
    ejemplo: 'Example',
    objetivos: 'Targets',
    notasAcorde: 'Tones of a chord',
    progresion: 'Progression',
    acorde: 'Chord',
    patron: 'Pattern',
    patrones: {
      'cromatica-abajo': { nombre: 'Chromatic from below', descripcion: 'A half step below.' },
      'cromatica-arriba': { nombre: 'Chromatic from above', descripcion: 'A half step above.' },
      'escala-arriba': { nombre: 'From the scale, above', descripcion: 'The scale note above (diatonic).' },
      'doble-abajo': { nombre: 'Double chromatic from below', descripcion: 'Two half steps in a row going up.' },
      'doble-arriba': { nombre: 'Double chromatic from above', descripcion: 'Two half steps in a row going down.' },
      encierro: { nombre: 'Enclosure: scale above, chromatic below', descripcion: 'The scale note above and a half step below.' },
      'encierro-cromatico': { nombre: 'Chromatic enclosure', descripcion: 'A half step above and a half step below.' },
      'encierro-inverso': { nombre: 'Reverse enclosure', descripcion: 'A half step below and the scale note above.' },
      'encierro-largo': { nombre: 'Long enclosure', descripcion: 'Scale above, scale below and a half step below.' },
      'triple-abajo': { nombre: 'Triple chromatic from below', descripcion: 'Three half steps in a row going up (bebop sound).' },
    },
    conAcorde: 'With background chord',
    leyenda1: 'In each box, the notes that lead to their target:',
    cromatica: 'chromatic',
    escala: 'from the scale',
    objetivo: 'target',
    leyenda2: '. The approaches sound on the last eighths of the previous bar and the target on beat 1.',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
  },
);
