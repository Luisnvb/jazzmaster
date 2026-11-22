// Textos de Rearmonización (components/estudio/rearmonizacion.astro). En español, las
// técnicas salen de lib/rearmonizacion.ts.
import { TECNICAS } from '../../lib/rearmonizacion.ts';
import { textos } from '../idiomas.ts';

type Tecnicas = Record<string, { nombre: string; descripcion: string }>;
const tecnicasEs: Tecnicas = Object.fromEntries(TECNICAS.map(({ id, nombre, descripcion }) => [id, { nombre, descripcion }]));

export const REARMONIZACION = textos(
  {
    titulo: 'Rearmonización',
    laboratorio: 'Laboratorio de rearmonización',
    progresion: 'Progresión',
    tecnicasTitulo: 'Técnicas',
    tecnicas: tecnicasEs,
    original: 'Original',
    tocarOriginal: '▶ Original',
    rearmonizada: 'Rearmonizada',
    tocarRearmonizada: '▶ Rearmonizada',
    bucle: '⟲ Bucle',
    bucleAyuda: 'Al acabar, vuelve a empezar',
  },
  {
    titulo: 'Reharmonization',
    laboratorio: 'Reharmonization lab',
    progresion: 'Progression',
    tecnicasTitulo: 'Techniques',
    tecnicas: {
      diatonica: { nombre: 'Diatonic substitution', descripcion: 'A repeated chord is replaced by another with its function: I → VIm7, IV → IIm7.' },
      modal: { nombre: 'Modal interchange', descripcion: 'IV → IVm7 and IIm7 → IIø7: the subdominant borrowed from minor.' },
      cadena: { nombre: 'Chain of dominants', descripcion: 'Chords that rise a fourth become dominants: IIIm7 VIm7 → III7 VI7.' },
      dominantes: { nombre: 'Secondary dominants', descripcion: 'The dominant of each chord, in the second half of the previous bar.' },
      'ii-v': { nombre: 'Secondary ii–Vs', descripcion: 'The ii–V of each chord, in the second half of the previous bar (instead of the dominant alone).' },
      tritonal: { nombre: 'Tritone substitution', descripcion: 'Each resolving dominant becomes the dominant a tritone away: V7 → bII7.' },
      disminuidos: { nombre: 'Passing diminished', descripcion: 'A °7 between two chords a whole step apart: I → #I°7 → IIm7.' },
    },
    original: 'Original',
    tocarOriginal: '▶ Original',
    rearmonizada: 'Reharmonised',
    tocarRearmonizada: '▶ Reharmonised',
    bucle: '⟲ Loop',
    bucleAyuda: 'Starts again when it ends',
  },
);
