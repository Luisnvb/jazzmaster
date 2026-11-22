// Textos de Lenguaje bebop (components/estudio/bebop.astro). En español, los recursos y
// las escalas salen de lib/bebop.ts.
import { ESCALAS_BEBOP, RECURSOS } from '../../lib/bebop.ts';
import { textos } from '../idiomas.ts';

type Recursos = Record<string, { nombre: string; descripcion: string }>;
const recursosEs: Recursos = Object.fromEntries(RECURSOS.map(({ id, nombre, descripcion }) => [id, { nombre, descripcion }]));
const escalasEs: Record<string, string> = Object.fromEntries(ESCALAS_BEBOP.map((e) => [e.id, e.nombre]));

export const BEBOP = textos(
  {
    titulo: 'Lenguaje bebop',
    ejemplo: 'Ejemplo',
    progresion: 'Progresión',
    recurso: 'Recurso',
    recursos: recursosEs,
    escalas: escalasEs,
    otra: '↻ Otra línea',
    otraAyuda: 'Genera otra línea con el mismo recurso',
    conAcorde: 'Con acorde de fondo',
    notaAcorde: 'nota del acorde',
    tension: 'tensión',
    escala: 'de la escala',
    cromatica: 'cromática',
    leyenda: '. Encima de cada nota, el pulso del compás («y» es el contratiempo): las notas del acorde caen en los números.',
    y: 'y',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
  },
  {
    titulo: 'Bebop language',
    ejemplo: 'Example',
    progresion: 'Progression',
    recurso: 'Tool',
    recursos: {
      escala: {
        nombre: 'Bebop scale',
        descripcion: 'From a chord tone, the bebop scale stepwise in eighths. Thanks to the passing note, every beat falls on a chord tone.',
      },
      arpegio: {
        nombre: '3 to 9',
        descripcion: 'The stock phrase: arpeggio up from the 3 to the 9 (b9 on a resolving dominant) and down the bebop scale from the root.',
      },
      encierros: {
        nombre: 'Chained enclosures',
        descripcion: 'A chord tone on beats 1 and 3, and in between a scale step and an enclosure (scale above, half step below) towards the next.',
      },
      mezcla: {
        nombre: 'Mix',
        descripcion: 'Arpeggio and bebop scale alternating from one chord to the next, with an enclosure leading to the first note of each chord.',
      },
    },
    escalas: {
      dominante: 'Dominant bebop',
      mayor: 'Major bebop',
      menor: 'Minor bebop',
      'menor-melodica': 'Melodic minor bebop',
      semidisminuida: 'Locrian bebop',
      disminuida: 'Diminished',
    },
    otra: '↻ Another line',
    otraAyuda: 'Generates another line with the same tool',
    conAcorde: 'With background chord',
    notaAcorde: 'chord tone',
    tension: 'tension',
    escala: 'from the scale',
    cromatica: 'chromatic',
    leyenda: '. Above each note, the beat in the bar ("&" is the off-beat): the chord tones fall on the numbers.',
    y: '&',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
  },
);
