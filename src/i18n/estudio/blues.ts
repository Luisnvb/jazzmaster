// Textos de Blues (components/estudio/blues.astro). En español, las variantes y las
// frases salen de lib/blues.ts; las explicaciones del análisis se traducen con
// notaAnalisis (i18n/estudio/armonia.ts).
import { FRASES, VARIANTES } from '../../lib/blues.ts';
import { textos } from '../idiomas.ts';

type Variantes = Record<string, { nombre: string; descripcion: string }>;
const variantesEs: Variantes = Object.fromEntries(VARIANTES.map(({ id, nombre, descripcion }) => [id, { nombre, descripcion }]));

export const BLUES = textos(
  {
    titulo: 'Blues',
    variantesLado: 'Las variantes, una al lado de otra',
    variantesVer: 'Variantes que se ven',
    variantes: variantesEs,
    queSeVe: 'Qué se ve',
    analisis: 'Análisis',
    analisisAyuda: 'Función (T, SD, D) y papel de cada acorde',
    cambios: 'Cambios respecto al básico',
    cambiosAyuda: 'Marca los acordes que no están en el blues básico',
    bucle: '⟲ Bucle',
    bucleAyuda: 'Al acabar, vuelve a empezar',
    papeles: 'Qué significa cada papel',
    tocar: '▶ Tocar',
    analizar: 'Analizar',
    analizarAyuda: 'Abrir en el analizador de Armonía funcional',
    rutaArmonia: 'estudio/armonia',
    frases: FRASES.map(({ nombre, papel }) => ({ nombre, papel })) as { nombre: string; papel: string }[],
    elige: 'Elige al menos una variante.',
  },
  {
    titulo: 'Blues',
    variantesLado: 'The variants side by side',
    variantesVer: 'Variants shown',
    variantes: {
      'blues-basico': { nombre: 'Basic', descripcion: 'Three seventh chords: I7, IV7 and V7. All dominants, none of them fully resolves.' },
      'blues-jazz': {
        nombre: 'Jazz',
        descripcion: 'The basic one with ii–Vs: Vm7–I7 towards the IV, a passing diminished, VI7 towards IIm7 and a turnaround at the end.',
      },
      'blues-bird': {
        nombre: 'Bird blues',
        descripcion: 'Charlie Parker: starts on Imaj7 and descends through secondary ii–Vs (and one substitute) down to the IIm7 of bar 9.',
      },
      'blues-menor': { nombre: 'Minor', descripcion: 'Im7 and IVm7 of the minor key; in bar 9, bVI7 (tritone substitute of V7/V) towards V7alt.' },
    },
    queSeVe: 'What is shown',
    analisis: 'Analysis',
    analisisAyuda: 'Function (T, SD, D) and role of each chord',
    cambios: 'Changes from the basic',
    cambiosAyuda: 'Marks the chords that are not in the basic blues',
    bucle: '⟲ Loop',
    bucleAyuda: 'Starts again when it ends',
    papeles: 'What each role means',
    tocar: '▶ Play',
    analizar: 'Analyse',
    analizarAyuda: 'Open in the Functional harmony analyser',
    rutaArmonia: 'en/study/harmony',
    frases: [
      { nombre: 'Bars 1–4', papel: 'Tonic: the I settles in and, at the end, the IV is prepared.' },
      { nombre: 'Bars 5–8', papel: 'Subdominant: the IV and the way back to I.' },
      { nombre: 'Bars 9–12', papel: 'Dominant and turnaround: V (or ii–V) and back to the top.' },
    ],
    elige: 'Choose at least one variant.',
  },
);
