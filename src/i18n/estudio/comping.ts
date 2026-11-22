// Textos de Comping (components/estudio/comping.astro).
import { CELULAS } from '../../lib/comping.ts';
import { textos } from '../idiomas.ts';

const celulasEs = Object.fromEntries(CELULAS.map((c) => [c.id, c.nombre])) as Record<string, string>;

export const COMPING = textos(
  {
    titulo: 'Comping',
    ejemplo: 'Acompañamiento',
    progresion: 'Progresión',
    ritmo: 'Ritmo',
    fijo: 'Fijo',
    variado: 'Variado',
    celula: 'Célula',
    celulas: celulasEs,
    otra: '↻ Otra variación',
    otraAyuda: 'Otra combinación de células',
    voicings: 'Voicings',
    registro: 'Registro',
    registros: { grave: 'Grave', medio: 'Medio', agudo: 'Agudo', alternar: 'Alternar' } as Record<string, string>,
    registrosMin: { grave: 'grave', medio: 'medio', agudo: 'agudo' } as Record<string, string>,
    bajo: 'Bajo',
    charles: 'Charles en 2 y 4',
    leyenda:
      'En cada compás, la célula rítmica (los golpes, con ↷ los que anticipan el acorde siguiente), el registro y el voicing de cada acorde. Los números de los diagramas son grados.',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
    sinVoicing: 'Algún acorde de esta progresión no tiene voicing en este registro.',
    y: 'y',
  },
  {
    titulo: 'Comping',
    ejemplo: 'Accompaniment',
    progresion: 'Progression',
    ritmo: 'Rhythm',
    fijo: 'Fixed',
    variado: 'Varied',
    celula: 'Cell',
    celulas: {
      negras: 'Quarter notes',
      charleston: 'Charleston',
      'charleston-inv': 'Reverse Charleston',
      'dos-cuatro': 'On 2 and 4',
      redonda: 'Whole note',
      anticipacion: 'Anticipation',
      sincopa: 'Syncopation',
    },
    otra: '↻ Another variation',
    otraAyuda: 'Another combination of cells',
    voicings: 'Voicings',
    registro: 'Register',
    registros: { grave: 'Low', medio: 'Middle', agudo: 'High', alternar: 'Alternate' },
    registrosMin: { grave: 'low', medio: 'middle', agudo: 'high' },
    bajo: 'Bass',
    charles: 'Hi-hat on 2 and 4',
    leyenda:
      'In each bar, the rhythmic cell (the hits, with ↷ marking those that anticipate the next chord), the register and the voicing of each chord. The numbers in the diagrams are degrees.',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
    sinVoicing: 'Some chord in this progression has no voicing in this register.',
    y: '&',
  },
);
