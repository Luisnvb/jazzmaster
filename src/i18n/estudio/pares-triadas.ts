// Textos de Pares de tríadas (components/estudio/pares-triadas.astro). En español, la
// escala y la nota de cada par salen de lib/pares-triadas.ts.
import { PARES } from '../../lib/pares-triadas.ts';
import { textos } from '../idiomas.ts';

type Pares = Record<string, { escala: string; nota: string }>;
const paresEs: Pares = Object.fromEntries(PARES.map(({ id, escala, nota }) => [id, { escala, nota }]));

export const PARES_TRIADAS = textos(
  {
    titulo: 'Pares de tríadas',
    mapa: 'Mapa del par de tríadas',
    acorde: 'Acorde',
    pares: paresEs,
    zona: 'Zona',
    todo: 'Todo',
    posicion: 'Posición',
    unaCuerda: 'Una cuerda',
    dosCuerdas: 'Dos cuerdas',
    desde: 'Desde el traste',
    cuerda: 'Cuerda',
    cuerdas: 'Cuerdas',
    y: 'y',
    figura: 'Figura',
    figuras: ['Sube (las dos tríadas hacia arriba)', 'Baja (cada tríada hacia abajo)', 'A sube, B baja', 'Escala de seis notas'],
    pedal: 'Nota pedal (tónica)',
    leyenda:
      'Tablatura: la 1ª cuerda arriba. Rellenas, la tríada A; en blanco, la tríada B. Los números son grados sobre el acorde; la raíz del acorde, en color.',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
  },
  {
    titulo: 'Triad pairs',
    mapa: 'Triad pair map',
    acorde: 'Chord',
    pares: {
      lidio: { escala: 'Lydian', nota: 'II major and IIIm: the minor on the 3 is the rootless chord (3 5 7); the major on the 9 brings the tensions, with the #11.' },
      jonico: { escala: 'Ionian without the 4', nota: 'V and VIm of the key: the 6/9 and maj9 sound, without the 4 that clashes with the 3.' },
      dorico: { escala: 'Dorian without the 9', nota: 'bIII and IV major: with the major 6, the Dorian colour. Over the IIm7 of a ii–V they are the IV and V of the key.' },
      eolio: { escala: 'Aeolian without the 5', nota: 'bVI and bVII major: a darker minor, with the b6. Works on the VIm or the Im of a minor key.' },
      mixolidio: { escala: 'Mixolydian without the 4', nota: 'Vm and VIm: the 9 and 13 tensions of the dominant without the 4 (avoid note).' },
      'lidio-dominante': {
        escala: 'Lydian dominant without the 7',
        nota: 'I and II major: the chord and, a whole step above, its tensions. For dominants that do not resolve (IV7, bVII7, tritone substitutes).',
      },
      alterado: { escala: 'Altered', nota: 'bV and bVI major (in C7: Gb and Ab). Every altered tension; the b7 and the root hold the chord together.' },
      disminuido: { escala: 'Half-whole', nota: 'I and #IV major, a tritone apart: the two major triads of the diminished scale that share no notes.' },
      'tonos-enteros': { escala: 'Whole tone', nota: 'Two augmented triads a whole step apart: together they are the complete whole-tone scale.' },
      locrio: { escala: 'Locrian #2 without the 2', nota: 'bIIIm and IVm: the half-diminished of the minor ii–V, with the 11 and the b13.' },
    },
    zona: 'Area',
    todo: 'All',
    posicion: 'Position',
    unaCuerda: 'One string',
    dosCuerdas: 'Two strings',
    desde: 'From fret',
    cuerda: 'String',
    cuerdas: 'Strings',
    y: 'and',
    figura: 'Figure',
    figuras: ['Up (both triads ascending)', 'Down (each triad descending)', 'A up, B down', 'Six-note scale'],
    pedal: 'Pedal note (root)',
    leyenda:
      'Tab view: 1st string on top. Filled in, triad A; hollow, triad B. The numbers are degrees over the chord; the chord root in colour.',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
  },
);
