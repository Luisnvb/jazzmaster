// Textos de Notas guía (components/estudio/notas-guia.astro).
import { textos } from '../idiomas.ts';

export const NOTAS_GUIA = textos(
  {
    titulo: 'Notas guía',
    ejemplo: 'Ejemplo',
    progresion: 'Progresión',
    vozAguda: 'Voz aguda del primer acorde',
    arriba: 'Arriba al empezar',
    la7: 'La 7',
    la3: 'La 3',
    conBajo: 'Con bajo (raíz)',
    leyenda1: 'Voz aguda arriba y grave abajo.',
    leyenda7: 'la 7 (o la 6),',
    leyenda3: 'la 3 (o la 4). Las flechas dicen cuánto se mueve cada voz: = se queda, ½ medio tono, 1 un tono.',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
    sinProgresiones: 'No hay progresiones.',
  },
  {
    titulo: 'Guide tones',
    ejemplo: 'Example',
    progresion: 'Progression',
    vozAguda: 'Top voice of the first chord',
    arriba: 'On top at the start',
    la7: 'The 7',
    la3: 'The 3',
    conBajo: 'With bass (root)',
    leyenda1: 'Top voice above and bottom voice below.',
    leyenda7: 'the 7 (or the 6),',
    leyenda3: 'the 3 (or the 4). The arrows show how far each voice moves: = stays, ½ a half step, 1 a whole step.',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
    sinProgresiones: 'There are no progressions.',
  },
);
