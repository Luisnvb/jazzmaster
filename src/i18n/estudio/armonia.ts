// Textos de Armonía funcional (components/estudio/armonia.astro). Las explicaciones
// del análisis las escribe lib/armonia.ts en español; `notaAnalisis` las traduce.
import { formatear, textos, type Idioma } from '../idiomas.ts';

export const ARMONIA = textos(
  {
    titulo: 'Armonía funcional',
    funcionesTonalidad: 'Funciones en la tonalidad',
    modo: 'Modo',
    mayor: 'Mayor',
    menor: 'Menor',
    analizar: 'Analizar una progresión',
    progresion: 'Progresión',
    modoAnalisis: 'Modo del análisis',
    automatico: 'Automático',
    automaticoAyuda: 'Mayor o menor según la tónica de la progresión',
    tocar: '▶ Tocar',
    bucle: '∞ Bucle',
    bucleAyuda: 'Suena sin parar hasta pulsar Detener',
    funciones: { T: 'Tónica', SD: 'Subdominante', D: 'Dominante', '?': 'Otra' } as Record<string, string>,
    modos: { mayor: 'mayor', menor: 'menor' } as Record<string, string>,
    enTonalidad: 'En {tonica} {modo}{detectado}.',
    detectado: ' (detectado)',
  },
  {
    titulo: 'Functional harmony',
    funcionesTonalidad: 'Functions in the key',
    modo: 'Mode',
    mayor: 'Major',
    menor: 'Minor',
    analizar: 'Analyse a progression',
    progresion: 'Progression',
    modoAnalisis: 'Analysis mode',
    automatico: 'Automatic',
    automaticoAyuda: 'Major or minor depending on the progression’s tonic',
    tocar: '▶ Play',
    bucle: '∞ Loop',
    bucleAyuda: 'Keeps playing until you press Stop',
    funciones: { T: 'Tonic', SD: 'Subdominant', D: 'Dominant', '?': 'Other' },
    modos: { mayor: 'major', menor: 'minor' },
    enTonalidad: 'In {tonica} {modo}{detectado}.',
    detectado: ' (detected)',
  },
);

/** Las explicaciones fijas de lib/armonia.ts, en inglés. */
const NOTAS_EN: Record<string, string> = {
  'Tónica: el reposo.': 'Tonic: the point of rest.',
  'Tónica menor, prestada del modo menor (intercambio modal).': 'Minor tonic, borrowed from the minor mode (modal interchange).',
  'Tónica con b7, como en el blues.': 'Tonic with a b7, as in the blues.',
  'Sustituto tritonal del V7: comparte su 3 y su 7.': 'Tritone substitute of V7: it shares its 3 and its 7.',
  'Napolitano, prestado del frigio.': 'Neapolitan, borrowed from Phrygian.',
  'Subdominante: prepara el V.': 'Subdominant: prepares the V.',
  'Subdominante menor (intercambio modal): prepara un V7b9.': 'Minor subdominant (modal interchange): prepares a V7b9.',
  'Prestado del modo menor (intercambio modal).': 'Borrowed from the minor mode (modal interchange).',
  'Disminuido de paso entre IIm y IIIm.': 'Passing diminished between IIm and IIIm.',
  'Sustituto de la tónica: comparte tres notas con Imaj7.': 'Tonic substitute: it shares three notes with Imaj7.',
  'Tónica de otro centro a una 3ª mayor: el ciclo de terceras de los cambios de Coltrane.':
    'Tonic of another centre a major 3rd away: the cycle of thirds of Coltrane changes.',
  'Subdominante: se aleja del reposo sin tensión.': 'Subdominant: moves away from rest without tension.',
  'Subdominante menor (intercambio modal): sonido melancólico.': 'Minor subdominant (modal interchange): a melancholy sound.',
  'Subdominante con b7, típico del blues.': 'Subdominant with a b7, typical of the blues.',
  'Disminuido de paso entre IV y I/5 (o V).': 'Passing diminished between IV and I/5 (or V).',
  'Sustituto de la tónica en la cadena #IVø–VII7–IIIm.': 'Tonic substitute in the #IVø–VII7–IIIm chain.',
  'Dominante: la tensión que pide volver al I (tritono entre su 3 y su 7).': 'Dominant: the tension that wants to return to I (tritone between its 3 and its 7).',
  'Dominante (tríada).': 'Dominant (triad).',
  'IIm7 del IV: prepara un I7 → IV.': 'IIm7 of IV: prepares a I7 → IV.',
  'Subdominante menor prestada (intercambio modal).': 'Borrowed minor subdominant (modal interchange).',
  'Sustituto tritonal del V7/V.': 'Tritone substitute of V7/V.',
  'Sustituto de la tónica (relativo menor).': 'Tonic substitute (relative minor).',
  'Dominante "por la puerta de atrás" (backdoor): subdominante menor que resuelve al I.': 'Backdoor dominant: a minor subdominant that resolves to I.',
  'Prestado del mixolidio o del menor.': 'Borrowed from Mixolydian or from minor.',
  'Dominante sin raíz: es un V9 sin la fundamental.': 'Rootless dominant: a V9 without its root.',
  'Dominante sin raíz (V7b9).': 'Rootless dominant (V7b9).',
  'Tónica menor.': 'Minor tonic.',
  'Tónica mayor al final (tercera de picardía).': 'Major tonic at the end (Picardy third).',
  'Sustituto tritonal del V7.': 'Tritone substitute of V7.',
  'Napolitano: subdominante con la b2 del frigio.': 'Neapolitan: a subdominant with the Phrygian b2.',
  'Subdominante del menor: prepara el V7.': 'Minor-key subdominant: prepares the V7.',
  'Subdominante del menor dórico.': 'Subdominant of Dorian minor.',
  'Relativo mayor: sustituto de la tónica.': 'Relative major: tonic substitute.',
  'Subdominante menor.': 'Minor subdominant.',
  'Subdominante del menor melódico o dórico (con la 6 mayor).': 'Subdominant of melodic or Dorian minor (with the major 6).',
  'Subdominante del dórico (con la 6 mayor).': 'Dorian subdominant (with the major 6).',
  'Dominante del menor (con la 7 de la menor armónica).': 'Minor-key dominant (with the 7 of harmonic minor).',
  'Dominante débil del menor natural, sin sensible.': 'Weak dominant of natural minor, without a leading tone.',
  'Subdominante del menor.': 'Minor-key subdominant.',
  'Subtónica: dominante del bIII o vuelta al Im.': 'Subtonic: dominant of bIII or a way back to Im.',
  'Subtónica del menor natural.': 'Subtonic of natural minor.',
  'Dominante sin raíz (V7b9 de la menor armónica).': 'Rootless dominant (V7b9 of harmonic minor).',
  'Disminuido de paso: un dominante sin raíz hacia el acorde de medio tono por encima.': 'Passing diminished: a rootless dominant towards the chord a half step above.',
  'Fuera de la tonalidad.': 'Outside the key.',
};

/** Las explicaciones que llevan grados dentro. */
const PATRONES_EN: [RegExp, string][] = [
  [/^Dominante secundario: lleva al (\S+)\.$/, 'Secondary dominant: leads to {1}.'],
  [/^(IIm|IIø) de un ii–V secundario hacia el (\S+)\.$/, '{1} of a secondary ii–V towards {2}.'],
  [
    /^Dominante de un ii–V hacia el (\S+) que no resuelve: el ii–V baja medio tono \(ii–V cromáticos\)\.$/,
    'Dominant of a ii–V towards {1} that does not resolve: the ii–V drops a half step (chromatic ii–Vs).',
  ],
  [/^Sustituto tritonal del V7\/(\S+): resuelve medio tono por debajo, al (\S+)\.$/, 'Tritone substitute of V7/{1}: resolves a half step down, to {2}.'],
  [
    /^IIm de un ii–V hacia el (\S+) que no resuelve: medio tono por encima del (\S+) que sigue \(ii–V cromáticos\)\.$/,
    'IIm of a ii–V towards {1} that does not resolve: a half step above the {2} that follows (chromatic ii–Vs).',
  ],
  [
    /^IIm del ii–V sustituto hacia el (\S+): el ii–V a un tritono, que resuelve por medio tono\.$/,
    'IIm of the substitute ii–V towards {1}: the ii–V a tritone away, resolving by half step.',
  ],
];

/** Explicación de un análisis (lib/armonia.ts) en el idioma pedido. Si no la conoce, la deja como está. */
export function notaAnalisis(nota: string, idioma: Idioma): string {
  if (idioma === 'es') return nota;
  if (NOTAS_EN[nota]) return NOTAS_EN[nota];
  for (const [re, en] of PATRONES_EN) {
    const m = re.exec(nota);
    if (m) return formatear(en, Object.fromEntries(m.slice(1).map((v, i) => [String(i + 1), v])));
  }
  return nota;
}
