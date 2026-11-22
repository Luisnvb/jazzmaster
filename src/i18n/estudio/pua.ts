// Textos de Técnica de púa (components/estudio/pua.astro).
import { EJERCICIOS } from '../../lib/pua.ts';
import { textos } from '../idiomas.ts';

const ejerciciosEs = Object.fromEntries(EJERCICIOS.map((e) => [e.id, [e.nombre, e.descripcion]])) as Record<string, [string, string]>;

export const PUA = textos(
  {
    titulo: 'Técnica de púa',
    ejercicios: 'Ejercicios de púa',
    ejercicio: 'Ejercicio',
    ejerciciosPorId: ejerciciosEs,
    subdivisiones: ['Corcheas (2)', 'Tresillos (3)', 'Semicorcheas (4)', 'Seisillos (6)'],
    notasPorPulso: 'Notas por pulso',
    metronomo: 'Metrónomo',
    cuenta: 'Cuenta de 4 antes',
    leyenda:
      'Tablatura: la 1ª cuerda arriba; los números son trastes. Encima, el golpe de cada nota con púa alternada (Alt.) y con economy o sweep (Eco.): ⊓ hacia abajo, V hacia arriba, h y p ligados sin púa. En color, los golpes de economy que cambian respecto a la alternada. Las líneas finas separan los pulsos.',
    subida: 'Subida progresiva',
    subir: 'Subir',
    nada: 'nada',
    cada: 'cada',
    vuelta: 'vuelta',
    vueltas: 'vueltas',
    hasta: 'hasta',
    una: '▶ Una vuelta',
    bucle: '∞ Bucle',
    bucleAyuda: 'Al tempo elegido, sin parar hasta pulsar Detener',
    subidaBoton: '↗ Subida progresiva',
    planFijo: 'Subida progresiva: {n} {vueltas} a {bpm} BPM.',
    plan: 'Subida progresiva: de {desde} a {hasta} BPM, {paso} más cada {cada} ({n} vueltas).',
    tecnicas: { alternada: 'Alternada', economy: 'Economy' } as Record<string, string>,
    impar: ' <span class="suave">(impar: la vuelta siguiente empieza hacia arriba)</span>',
    datos: '{golpes} golpes{impar}; cambios de cuerda por dentro <strong>{dentro}</strong>, por fuera <strong>{fuera}</strong>, barridos <strong>{barridos}</strong>',
    cuentaEstado: 'Cuenta… {bpm} BPM',
    ahoraVuelta: 'Ahora: {bpm} BPM · vuelta {n} de {total}',
    ahora: 'Ahora: {bpm} BPM',
  },
  {
    titulo: 'Picking technique',
    ejercicios: 'Picking exercises',
    ejercicio: 'Exercise',
    ejerciciosPorId: {
      arana: [
        'Chromatic 1-2-3-4',
        'Four consecutive frets on each string, one finger per fret, from the root on the 6th string. An even number of notes per string: each string starts with a downstroke.',
      ],
      pentatonica: [
        'Minor pentatonic, two per string',
        'The first box of the minor pentatonic. With two notes per string, alternate picking always changes string the same way: inside going up and outside going down.',
      ],
      posicion: [
        'Major scale in position',
        'The scale in a fixed position (see Fingering): some strings have three notes and others two, so with alternate picking the string changes alternate between inside and outside.',
      ],
      tres: [
        'Major scale, three per string',
        'Three notes on each string. With economy, each new string is played in the direction the hand is moving: going up, each string starts with a downstroke; going down, with an upstroke.',
      ],
      barrido: [
        'Swept minor arpeggio',
        'One note per string from the 5th: a single downward pick motion going up and an upward one going down, with slurs at the ends. This is sweep picking.',
      ],
    },
    subdivisiones: ['Eighths (2)', 'Triplets (3)', 'Sixteenths (4)', 'Sextuplets (6)'],
    notasPorPulso: 'Notes per beat',
    metronomo: 'Metronome',
    cuenta: 'Count-in of 4',
    leyenda:
      'Tab view: 1st string on top; the numbers are frets. Above, the stroke for each note with alternate picking (Alt.) and with economy or sweep (Eco.): ⊓ down, V up, h and p slurred without the pick. In colour, the economy strokes that differ from alternate. The thin lines separate the beats.',
    subida: 'Tempo ramp',
    subir: 'Raise by',
    nada: 'nothing',
    cada: 'every',
    vuelta: 'round',
    vueltas: 'rounds',
    hasta: 'up to',
    una: '▶ One round',
    bucle: '∞ Loop',
    bucleAyuda: 'At the chosen tempo, without stopping until you press Stop',
    subidaBoton: '↗ Tempo ramp',
    planFijo: 'Tempo ramp: {n} {vueltas} at {bpm} BPM.',
    plan: 'Tempo ramp: from {desde} to {hasta} BPM, {paso} more every {cada} ({n} rounds).',
    tecnicas: { alternada: 'Alternate', economy: 'Economy' },
    impar: ' <span class="suave">(odd: the next round starts with an upstroke)</span>',
    datos: '{golpes} strokes{impar}; inside string changes <strong>{dentro}</strong>, outside <strong>{fuera}</strong>, swept <strong>{barridos}</strong>',
    cuentaEstado: 'Count-in… {bpm} BPM',
    ahoraVuelta: 'Now: {bpm} BPM · round {n} of {total}',
    ahora: 'Now: {bpm} BPM',
  },
);
