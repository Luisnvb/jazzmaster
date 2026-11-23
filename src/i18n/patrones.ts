// Textos de Patrones (components/paginas/patrones.astro).
import { textos } from './idiomas.ts';

export const PATRONES = textos(
  {
    titulo: 'Patrones',
    escala: 'Escala',
    arpegio: 'Arpegio',
    metronomo: 'Metrónomo',
    bucle: '⟲ Bucle',
    bucleAyuda: 'Al acabar, vuelve a empezar',
    escalas: 'Escalas',
    arpegios: 'Arpegios',
    tocar: '▶ Tocar',
    continuo: '∞ Continuo',
    continuoAyuda: 'Se repite sin parar hasta pulsar Detener',
  },
  {
    titulo: 'Patterns',
    escala: 'Scale',
    arpegio: 'Arpeggio',
    metronomo: 'Metronome',
    bucle: '⟲ Loop',
    bucleAyuda: 'Starts again when it ends',
    escalas: 'Scales',
    arpegios: 'Arpeggios',
    tocar: '▶ Play',
    continuo: '∞ Continuous',
    continuoAyuda: 'Repeats without stopping until you press Stop',
  },
);
