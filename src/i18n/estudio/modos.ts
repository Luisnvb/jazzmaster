// Textos de Modos (components/estudio/modos.astro). En español, los nombres y las
// descripciones de cada modo salen de lib/modos.ts; aquí va su traducción, por escala
// madre y en el mismo orden que `MADRES[i].modos`.
import { MADRES } from '../../lib/modos.ts';
import { textos } from '../idiomas.ts';

interface TextoModo {
  nombre: string;
  acorde: string;
  frente: string;
  sonido: string;
}
type PorMadre<T> = Record<string, T>;

const modosEs: PorMadre<TextoModo[]> = Object.fromEntries(
  MADRES.map((m) => [m.id, m.modos.map(({ nombre, acorde, frente, sonido }) => ({ nombre, acorde, frente, sonido }))]),
);

export const MODOS = textos(
  {
    titulo: 'Modos',
    sieteModos: 'Los siete modos',
    escalaMadre: 'Escala madre',
    madres: { mayor: 'Escala mayor', melodica: 'Menor melódica', armonica: 'Menor armónica' } as PorMadre<string>,
    /** La madre dentro de una frase («de la escala mayor») y en corto («de C mayor»). */
    madresFrase: { mayor: 'escala mayor', melodica: 'menor melódica', armonica: 'menor armónica' } as PorMadre<string>,
    madresCorto: { mayor: 'mayor', melodica: 'menor melódica', armonica: 'menor armónica' } as PorMadre<string>,
    vista: 'Vista',
    paralelos: 'Paralelos',
    paralelosAyuda: 'Todos los modos sobre la misma tónica',
    relativos: 'Relativos',
    relativosAyuda: 'Todos los modos con las mismas notas',
    tocarSiete: '▶ Tocar los siete',
    descParalela: 'Los siete modos de la {madre} sobre {tonica}{brillo}. Resaltada, la nota característica de cada uno.',
    brillo: ', de más luminoso a más oscuro',
    descRelativa: 'Los siete modos de {tonica} {madre}: las mismas notas empezando en cada grado.',
    minusculas: true,
    tocar: 'Tocar {modo}',
    sobre: 'Sobre {acorde}',
    frente: '(frente al {modo})',
    modos: modosEs,
  },
  {
    titulo: 'Modes',
    sieteModos: 'The seven modes',
    escalaMadre: 'Parent scale',
    madres: { mayor: 'Major scale', melodica: 'Melodic minor', armonica: 'Harmonic minor' },
    madresFrase: { mayor: 'major scale', melodica: 'melodic minor', armonica: 'harmonic minor' },
    madresCorto: { mayor: 'major', melodica: 'melodic minor', armonica: 'harmonic minor' },
    vista: 'View',
    paralelos: 'Parallel',
    paralelosAyuda: 'All the modes on the same root',
    relativos: 'Relative',
    relativosAyuda: 'All the modes with the same notes',
    tocarSiete: '▶ Play all seven',
    descParalela: 'The seven modes of the {madre} on {tonica}{brillo}. Highlighted, the characteristic note of each one.',
    brillo: ', from brightest to darkest',
    descRelativa: 'The seven modes of {tonica} {madre}: the same notes starting on each degree.',
    minusculas: false,
    tocar: 'Play {modo}',
    sobre: 'Over {acorde}',
    frente: '(compared with {modo})',
    modos: {
      mayor: [
        { nombre: 'Ionian', acorde: 'maj7', frente: 'Lydian', sonido: 'The major scale: stable, with the 4 as the note to avoid over the chord.' },
        { nombre: 'Dorian', acorde: 'm7', frente: 'Aeolian', sonido: 'Bright minor: the major 6 takes away the drama. The mode of modal jazz.' },
        { nombre: 'Phrygian', acorde: 'm7', frente: 'Aeolian', sonido: 'Dark, Spanish-sounding minor, because of the b2.' },
        { nombre: 'Lydian', acorde: 'maj7#11', frente: 'Ionian', sonido: 'Floating, bright major: the #4 does not need to resolve.' },
        { nombre: 'Mixolydian', acorde: '7', frente: 'Ionian', sonido: 'Major with the b7: the sound of the dominant, of blues and of rock.' },
        { nombre: 'Aeolian', acorde: 'm7', frente: 'Dorian', sonido: 'Natural minor: sad, because of the b6.' },
        { nombre: 'Locrian', acorde: 'm7b5', frente: 'Phrygian', sonido: 'Unstable: the b5 keeps the root from resting. Over m7b5.' },
      ],
      melodica: [
        { nombre: 'Melodic minor', acorde: 'mMaj7', frente: 'Dorian', sonido: 'Minor with major 6 and 7: sophisticated, the jazz minor.' },
        { nombre: 'Dorian b2', acorde: 'm7 (or 7sus4b9)', frente: 'Dorian', sonido: 'Dorian with the b2 of Phrygian: widely used over sus4b9.' },
        { nombre: 'Lydian augmented', acorde: 'maj7#5', frente: 'Lydian', sonido: 'Lydian with an augmented 5: bright and suspended.' },
        { nombre: 'Lydian dominant', acorde: '7#11', frente: 'Mixolydian', sonido: 'Dominant with #11: the sound of bII7 and of dominants that do not resolve.' },
        { nombre: 'Mixolydian b6', acorde: '7b13', frente: 'Mixolydian', sonido: 'A dominant that looks towards minor, because of the b13.' },
        { nombre: 'Locrian #2', acorde: 'm7b5', frente: 'Locrian', sonido: 'Locrian with a natural 9: the most used m7b5 sound in jazz.' },
        { nombre: 'Superlocrian (altered)', acorde: '7alt', frente: 'Mixolydian', sonido: 'Dominant with every tension altered: maximum tension before resolving.' },
      ],
      armonica: [
        { nombre: 'Harmonic minor', acorde: 'mMaj7', frente: 'Aeolian', sonido: 'Aeolian with a major 7: the b6–7 leap gives it its Eastern flavour.' },
        { nombre: 'Locrian 6', acorde: 'm7b5', frente: 'Locrian', sonido: 'Locrian with a major 6.' },
        { nombre: 'Ionian augmented', acorde: 'maj7#5', frente: 'Ionian', sonido: 'Ionian with an augmented 5.' },
        { nombre: 'Dorian #4', acorde: 'm7', frente: 'Dorian', sonido: 'Dorian with the #4: minor with an Eastern European flavour.' },
        { nombre: 'Phrygian dominant', acorde: '7b9', frente: 'Phrygian', sonido: 'The dominant of minor (V7b9): flamenco and Middle Eastern music.' },
        { nombre: 'Lydian #2', acorde: 'maj7#11', frente: 'Lydian', sonido: 'Lydian with the #2: exotic and bright.' },
        { nombre: 'Ultralocrian', acorde: '°7', frente: 'Locrian', sonido: 'The scale of the diminished chord that comes from V7b9.' },
      ],
    },
  },
);
