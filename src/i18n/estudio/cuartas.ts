// Textos de Cuartas (components/estudio/cuartas.astro).
import { textos } from '../idiomas.ts';

export const CUARTAS = textos(
  {
    titulo: 'Cuartas',
    ejemplo: 'Voicings por cuartas',
    tipos: ['3 notas', '4 notas', 'So What'],
    modos: { dorico: 'Dórico', mixolidio: 'Mixolidio (sus)', lidio: 'Lidio' } as Record<string, string>,
    cuerdas: 'Cuerdas',
    grupo: 'Cuerdas {cuerdas}',
    justas: 'Solo cuartas justas',
    patron: 'Patrón',
    escalera: 'Escalera (sube y baja)',
    vecinos: 'Vecinos',
    leyenda:
      'Los números son grados sobre el acorde del vamp (las tensiones, como 9, 11 y 13). Pulsa un voicing para elegirlo (y oírlo); el patrón «Vecinos» parte del elegido. Suena con la raíz como pedal en el bajo.',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
    titulo2: 'Vamp <strong>{vamp}</strong> · {modo} · {n} voicings en escalera',
    intervalos: { 4: '3ª M', 5: '4ª', 6: '4ª aum.' } as Record<number, string>,
  },
  {
    titulo: 'Quartal voicings',
    ejemplo: 'Quartal voicings',
    tipos: ['3 notes', '4 notes', 'So What'],
    modos: { dorico: 'Dorian', mixolidio: 'Mixolydian (sus)', lidio: 'Lydian' },
    cuerdas: 'Strings',
    grupo: 'Strings {cuerdas}',
    justas: 'Perfect fourths only',
    patron: 'Pattern',
    escalera: 'Ladder (up and down)',
    vecinos: 'Neighbours',
    leyenda:
      'The numbers are degrees over the vamp chord (tensions such as 9, 11 and 13). Press a voicing to choose it (and hear it); the "Neighbours" pattern starts from the chosen one. It sounds with the root as a pedal in the bass.',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
    titulo2: 'Vamp <strong>{vamp}</strong> · {modo} · {n} voicings in a ladder',
    intervalos: { 4: 'M3', 5: 'P4', 6: 'aug4' },
  },
);
