// Textos de Chord melody (components/estudio/chord-melody.astro).
import { textos } from '../idiomas.ts';

export const CHORD_MELODY = textos(
  {
    titulo: 'Chord melody',
    acorde: 'Acorde',
    buscador: 'Buscador de formas',
    calidadAcorde: 'Calidad del acorde',
    calidad: 'Calidad',
    notaMelodia: 'Nota de la melodía',
    melodia: 'Melodía',
    otraNota: 'Otra nota',
    tensiones: 'Tensiones debajo (9, 13…)',
    tres: 'Solo 3 notas',
    leyenda:
      'Los números son grados sobre el acorde; la melodía es la nota de la cuerda más aguda. Pulsa una forma para oírla: el acorde y después la melodía sola.',
    todas: '▶ Todas seguidas',
    papeles: { acorde: 'nota del acorde', tension: 'tensión', fuera: 'choca con el acorde' } as Record<string, string>,
    titulo2: '<strong>{mel}</strong> arriba de <strong>{acorde}</strong>: es la <strong>{grado}</strong>, {papel} · {n} formas',
    forma: 'Forma {n}',
    detalle: 'Melodía en la {cuerda}, traste {traste}',
    raizBajo: ' · raíz en el bajo',
  },
  {
    titulo: 'Chord melody',
    acorde: 'Chord',
    buscador: 'Shape finder',
    calidadAcorde: 'Chord quality',
    calidad: 'Quality',
    notaMelodia: 'Melody note',
    melodia: 'Melody',
    otraNota: 'Other note',
    tensiones: 'Tensions underneath (9, 13…)',
    tres: 'Only 3 notes',
    leyenda:
      'The numbers are degrees over the chord; the melody is the note on the highest string. Press a shape to hear it: the chord and then the melody alone.',
    todas: '▶ All in a row',
    papeles: { acorde: 'chord tone', tension: 'tension', fuera: 'clashes with the chord' },
    titulo2: '<strong>{mel}</strong> on top of <strong>{acorde}</strong>: it is the <strong>{grado}</strong>, {papel} · {n} shapes',
    forma: 'Shape {n}',
    detalle: 'Melody on the {cuerda} string, fret {traste}',
    raizBajo: ' · root in the bass',
  },
);
