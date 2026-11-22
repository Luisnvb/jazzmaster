// Textos de Disminuida y tonos enteros (components/estudio/simetricas.astro). En español,
// el nombre y el uso de cada escala salen de lib/simetricas.ts.
import { SIMETRICAS } from '../../lib/simetricas.ts';
import { textos } from '../idiomas.ts';

type Escalas = Record<string, { nombre: string; uso: string }>;
const escalasEs: Escalas = Object.fromEntries(SIMETRICAS.map(({ id, nombre, uso }) => [id, { nombre, uso }]));

export const SIMETRICAS_TEXTOS = textos(
  {
    titulo: 'Disminuida y tonos enteros',
    mapa: 'Mapa de la escala simétrica',
    escala: 'Escala',
    escalas: escalasEs,
    zona: 'Zona',
    todo: 'Todo',
    posicion: 'Posición',
    unaCuerda: 'Una cuerda',
    dosCuerdas: 'Dos cuerdas',
    haciaCejuela: 'Mover el dibujo hacia la cejuela',
    haciaPuente: 'Mover el dibujo hacia el puente',
    desde: 'Desde el traste',
    cuerda: 'Cuerda',
    cuerdas: 'Cuerdas',
    y: 'y',
    recorrido: 'Recorrido',
    recorridos: ['Por grados', 'En terceras', 'Grupos de 4', 'Posición y su eco'],
    pedal: 'Nota pedal (raíz)',
    leyenda:
      'Tablatura: la 1ª cuerda arriba. Rellenas, las notas del acorde; en blanco, el resto de la escala; la raíz, en color. En «Posición», el recuadro discontinuo es la posición vecina con el mismo dibujo.',
    misma: 'La misma escala: {acordes}',
    repite: '{uso} Se repite cada {n} trastes.',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
  },
  {
    titulo: 'Diminished and whole tone',
    mapa: 'Symmetric scale map',
    escala: 'Scale',
    escalas: {
      'semitono-tono': {
        nombre: 'Half-whole diminished',
        uso: 'Dominants with b9, #9, #11 and natural 13 (7b9, 13b9). The same scale works for the four dominants a minor 3rd apart.',
      },
      'tono-semitono': {
        nombre: 'Whole-half diminished',
        uso: '°7 chords, especially passing ones (I–#I°7–IIm7). The notes outside the chord are those of the °7 a whole step above.',
      },
      'tonos-enteros': {
        nombre: 'Whole tone',
        uso: 'Augmented dominants (7#5, 9#5, 7#11). There are only two different whole-tone scales: each one works for six dominants.',
      },
    },
    zona: 'Area',
    todo: 'All',
    posicion: 'Position',
    unaCuerda: 'One string',
    dosCuerdas: 'Two strings',
    haciaCejuela: 'Move the shape towards the nut',
    haciaPuente: 'Move the shape towards the bridge',
    desde: 'From fret',
    cuerda: 'String',
    cuerdas: 'Strings',
    y: 'and',
    recorrido: 'Route',
    recorridos: ['By step', 'In thirds', 'Groups of 4', 'Position and its echo'],
    pedal: 'Pedal note (root)',
    leyenda:
      'Tab view: 1st string on top. Filled in, the chord tones; hollow, the rest of the scale; the root in colour. In "Position", the dashed box is the neighbouring position with the same shape.',
    misma: 'The same scale: {acordes}',
    repite: '{uso} It repeats every {n} frets.',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
  },
);
