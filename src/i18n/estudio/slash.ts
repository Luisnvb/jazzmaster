// Textos de Acordes slash (components/estudio/slash.astro). En español, las tríadas, las
// bases y los sonidos de las combinaciones útiles salen de lib/slash.ts.
import { BASES, TRIADAS, UTILES } from '../../lib/slash.ts';
import { textos } from '../idiomas.ts';

const porId = <T extends { id: string; nombre: string }>(lista: readonly T[]): Record<string, string> =>
  Object.fromEntries(lista.map((x) => [x.id, x.nombre]));
/** Sonido de cada combinación útil, por base y en el mismo orden que `UTILES[base]`. */
const utilesEs: Record<string, string[]> = Object.fromEntries(Object.entries(UTILES).map(([b, us]) => [b, us.map((u) => u.sonido)]));

export const SLASH = textos(
  {
    titulo: 'Acordes slash',
    bajo: 'Bajo',
    combinador: 'Combinador',
    debajo: 'Debajo',
    bases: porId(BASES),
    solo: 'Solo',
    triadaSobre: 'Tríada sobre',
    tipoTriada: 'Tipo de tríada',
    triadas: porId(TRIADAS),
    baseSola: '▶ Base sola',
    conTriada: '▶ Con la tríada',
    arpegiado: '▶ Arpegiado',
    utiles: 'Combinaciones útiles',
    sonidos: utilesEs,
    inversion: 'Es una <strong>inversión</strong>: el bajo es una nota de la tríada.',
    suenaA: 'Suena a <strong class="simbolo">{simbolo}</strong>{sin3}',
    sin3: ' <span class="suave">(sin 3ª)</span>',
    triada: 'Tríada {triada}:',
    gradosBajo: 'Grados sobre el bajo',
    sobre: 'sobre {acorde}',
  },
  {
    titulo: 'Slash chords',
    bajo: 'Bass',
    combinador: 'Combiner',
    debajo: 'Underneath',
    bases: { bajo: 'Bass only', dom: 'Over a dominant', maj: 'Over a maj7', men: 'Over an m7' },
    solo: 'Only',
    triadaSobre: 'Triad on',
    tipoTriada: 'Triad type',
    triadas: { mayor: 'Major', menor: 'Minor', dis: 'Diminished', aum: 'Augmented', sus4: 'Sus4' },
    baseSola: '▶ Base only',
    conTriada: '▶ With the triad',
    arpegiado: '▶ Arpeggiated',
    utiles: 'Useful combinations',
    sonidos: {
      bajo: [
        'Major a whole step up: Lydian, no 3rd. Very open, the ending of many ballads.',
        'Major a whole step down: 9sus4, the sound of the modern sus (Herbie Hancock).',
        'Major a half step up: Phrygian. Dark and Spanish; over a dominant it sounds like sus(b9).',
        'Major a 3rd up: maj7#5, the sound of Lydian augmented.',
        'Minor a 5th up: 9 with no 3rd. A suspended dominant softer than sus4.',
        'Major a minor 3rd up: the m7 written as a triad over the bass.',
      ],
      dom: [
        'II major: 9, #11 and 13. Lydian dominant, unresolved (IV7, bVII7).',
        'VI major: 13 and b9. Diminished scale (half-whole).',
        'bV major: b9 and #11. Also diminished; the chord’s tritone.',
        'bVI major: #9 and b13. The most used altered sound.',
        'bIII major: #9 with the 5 and the b7. The sound of the blues.',
        'bII minor: b9 and b13 with the 3. A dominant heading to minor.',
      ],
      maj: [
        'V major: maj9, without the root in the triad.',
        'II major: maj13(#11). The complete Lydian.',
        'VII minor: maj9(#11). Lydian without the 13.',
        'III minor: the rootless chord (3, 5, 7).',
      ],
      men: [
        'IV major: m13. The Dorian sound (the 13 is the major 6).',
        'bVII major: m11 (b7, 9 and 11).',
        'II minor: m13 (9, 11, 13), very open.',
        'bIII major: the rootless chord (b3, 5, b7).',
      ],
    },
    inversion: 'It is an <strong>inversion</strong>: the bass is a note of the triad.',
    suenaA: 'It sounds like <strong class="simbolo">{simbolo}</strong>{sin3}',
    sin3: ' <span class="suave">(no 3rd)</span>',
    triada: '{triada} triad:',
    gradosBajo: 'Degrees over the bass',
    sobre: 'over {acorde}',
  },
);
