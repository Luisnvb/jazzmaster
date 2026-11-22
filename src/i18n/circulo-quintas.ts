// Textos del Círculo de quintas (components/herramientas/circulo-quintas.astro).
import { textos } from './idiomas.ts';

export const CIRCULO_TEXTOS = textos(
  {
    titulo: 'Círculo de quintas',
    intro:
      'En el sentido de las agujas del reloj, cada tonalidad está una quinta por encima de la anterior y suma un sostenido (o quita un bemol). Fuera, las mayores; dentro, sus relativas menores, con la misma armadura (en el centro). Pulsa una para ver sus acordes. Las de al lado se diferencian en una sola alteración: son las tonalidades vecinas.',
    escala: 'Escala',
    acordes: 'Acordes de la tonalidad',
    secundarios: 'Dominantes secundarios',
    oirEscala: '▶ Escala',
    o: 'o',
    sinAlteraciones: 'Sin alteraciones en la armadura.',
    armadura: 'Armadura: {n} ({notas}).',
    relativaMenor: 'Relativa menor',
    relativaMayor: 'Relativa mayor',
    homonima: 'Homónima',
    vecinas: 'Vecinas',
    tritono: 'Sustituto por tritono del {v7}: {sub} (bII7), que resuelve igual a la tónica bajando por semitonos.',
  },
  {
    titulo: 'Circle of fifths',
    intro:
      'Going clockwise, each key is a fifth above the previous one and adds a sharp (or loses a flat). Outside, the major keys; inside, their relative minors, with the same key signature (in the centre). Press one to see its chords. The keys next to each other differ by just one accidental: they are closely related keys.',
    escala: 'Scale',
    acordes: 'Chords of the key',
    secundarios: 'Secondary dominants',
    oirEscala: '▶ Scale',
    o: 'or',
    sinAlteraciones: 'No sharps or flats in the key signature.',
    armadura: 'Key signature: {n} ({notas}).',
    relativaMenor: 'Relative minor',
    relativaMayor: 'Relative major',
    homonima: 'Parallel key',
    vecinas: 'Neighbours',
    tritono: 'Tritone substitute for {v7}: {sub} (bII7), which resolves to the tonic just the same, moving down by half steps.',
  },
);
