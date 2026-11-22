// Textos de Fuera y dentro (components/estudio/outside.astro). En español, los acordes,
// las frases y las técnicas salen de lib/outside.ts.
import { ACORDES_OUT, CELULAS, TECNICAS } from '../../lib/outside.ts';
import { textos } from '../idiomas.ts';

const porId = <T extends { id: string; nombre: string }>(lista: readonly T[]): Record<string, string> =>
  Object.fromEntries(lista.map((x) => [x.id, x.nombre]));
type Tecnicas = Record<string, { nombre: string; descripcion: string }>;
const tecnicasEs: Tecnicas = Object.fromEntries(TECNICAS.map(({ id, nombre, descripcion }) => [id, { nombre, descripcion }]));

export const OUTSIDE = textos(
  {
    titulo: 'Fuera y dentro',
    ejemplo: 'Ejemplo',
    acordeVamp: 'Acorde del vamp',
    acordes: porId(ACORDES_OUT),
    frase: 'Frase',
    celulas: porId(CELULAS),
    conAcorde: 'Con acorde de fondo',
    tecnicaSalir: 'Técnica para salir',
    salir: 'Salir',
    tecnicas: tecnicasEs,
    todoDentro: 'Todo dentro',
    conSalida: 'Con salida en el compás 2',
    tocar: '▶ Tocar',
    dentro: 'dentro',
    fueraEscala: 'fuera de la escala',
    leyenda: '. Encima de cada compás, la tonalidad en la que se piensa. El acorde de fondo no cambia.',
    ambas: '▶ Las dos seguidas',
    bucle: '∞ Bucle (con salida)',
    bucleAyuda: 'La frase con salida, sin parar hasta pulsar Detener',
    fuera: 'fuera: ',
  },
  {
    titulo: 'Outside and inside',
    ejemplo: 'Example',
    acordeVamp: 'Vamp chord',
    acordes: { m7: 'Minor (Dorian)', '7': 'Dominant (Mixolydian)', maj7: 'Major (Ionian)' },
    frase: 'Phrase',
    celulas: { pentatonica: 'Pentatonic', arpegio: 'Arpeggio', escala: 'Scale' },
    conAcorde: 'With background chord',
    tecnicaSalir: 'Technique for going out',
    salir: 'Go out',
    tecnicas: {
      arriba: {
        nombre: 'Half step up',
        descripcion:
          'The same phrase a half step higher (side-slipping): over Dm7 you think Ebm7. Almost every note is outside, and on the way back it resolves down a half step.',
      },
      abajo: {
        nombre: 'Half step down',
        descripcion: 'The same phrase a half step lower: over Dm7 you think C#m7. It sounds like a whole-bar chromatic approach that resolves upwards.',
      },
      tritono: {
        nombre: 'Tritone',
        descripcion:
          'The phrase a tritone away: the most distant key. Very tense over a minor chord; over a dominant it is the tritone substitution and sounds altered.',
      },
      escalera: {
        nombre: 'Chromatic staircase',
        descripcion:
          'The first piece of the phrase, a half step up and then a whole step up: the idea climbs by half steps and falls back into the key.',
      },
    },
    todoDentro: 'All inside',
    conSalida: 'Going out in bar 2',
    tocar: '▶ Play',
    dentro: 'inside',
    fueraEscala: 'outside the scale',
    leyenda: '. Above each bar, the key you are thinking in. The background chord does not change.',
    ambas: '▶ Both in a row',
    bucle: '∞ Loop (going out)',
    bucleAyuda: 'The phrase that goes out, until you press Stop',
    fuera: 'out: ',
  },
);
