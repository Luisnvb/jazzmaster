// Textos del Diccionario de escalas (components/paginas/escalas.astro).
import { textos } from './idiomas.ts';

export const ESCALAS = textos(
  {
    titulo: 'Escalas',
    arpegio: 'Arpegio',
    buscar: 'Buscar escala…',
    tocarArpegio: 'Tocar arpegio {nombre}',
    subir: 'Escala ↑',
    bajar: 'Escala ↓',
    porGrado: 'Arpegios por grado',
    continuo: '∞ Continuo',
    continuoAyuda: 'Sube y baja sin parar hasta pulsar Detener',
  },
  {
    titulo: 'Scale dictionary',
    arpegio: 'Arpeggio',
    buscar: 'Search scales…',
    tocarArpegio: 'Play the {nombre} arpeggio',
    subir: 'Scale ↑',
    bajar: 'Scale ↓',
    porGrado: 'Arpeggios by degree',
    continuo: '∞ Continuous',
    continuoAyuda: 'Goes up and down without stopping until you press Stop',
  },
);
