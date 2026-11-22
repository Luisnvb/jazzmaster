// Textos de Tensiones y avoid notes (components/estudio/tensiones.astro). En español, los
// papeles, los acordes y las explicaciones salen de lib/tensiones.ts; `notaTension` traduce
// las explicaciones al inglés.
import { CONTEXTOS, ROLES } from '../../lib/tensiones.ts';
import { textos, type Idioma } from '../idiomas.ts';

type Roles = Record<string, { nombre: string; resumen: string }>;
type Contextos = Record<string, { uso: string; escala: string }>;
const rolesEs: Roles = Object.fromEntries(ROLES.map(({ id, nombre, resumen }) => [id, { nombre, resumen }]));
const contextosEs: Contextos = Object.fromEntries(CONTEXTOS.map((c) => [c.id, { uso: c.uso, escala: c.escala.nombre }]));

export const TENSIONES = textos(
  {
    titulo: 'Tensiones y avoid notes',
    raiz: 'Raíz',
    doce: 'Las 12 notas sobre un acorde',
    acorde: 'Acorde',
    roles: rolesEs,
    contextos: contextosEs,
    tocarAcorde: '▶ Acorde',
    tocarDoce: '▶ Las 12 sobre el acorde',
    tocarDoceAyuda: 'El acorde con cada una de las 12 notas encima, de la raíz a la 7',
    soloTensiones: '▶ Solo tensiones',
    soloTensionesAyuda: 'Solo las tensiones y las alteradas',
    evitar: '▶ Avoid notes y resolución',
    evitarAyuda: 'Cada nota a evitar y su resolución medio tono abajo',
    todos: 'Todos los acordes',
    todosAyuda: 'Las 12 notas desde la raíz (en semitonos) sobre cada acorde. Pulsa una fila para verla arriba.',
    resumen: '<strong class="cifrado">{cifrado}</strong> como {grados}, con la escala <strong>{escala}</strong>. <span class="suave">{uso}.</span>',
    pulsa: 'Pulsa una nota para oírla sobre el acorde y ver por qué tiene ese papel.',
    sinEvitar: 'Este acorde no tiene notas a evitar.',
    sinTensiones: 'Este acorde no tiene tensiones.',
  },
  {
    titulo: 'Tensions and avoid notes',
    raiz: 'Root',
    doce: 'The 12 notes over a chord',
    acorde: 'Chord',
    roles: {
      acorde: { nombre: 'Chord tone', resumen: 'A safe place to rest.' },
      tension: { nombre: 'Tension', resumen: 'In the scale and without a clash: it can be held and used in the voicing.' },
      alterada: { nombre: 'Altered tension', resumen: 'Only on dominants: b9, #9, #11, b13. More tension before resolving.' },
      evitar: { nombre: 'Avoid note', resumen: 'In the scale, but a half step above a chord tone: it clashes. In passing, yes; held, no.' },
      fuera: { nombre: 'Outside the scale', resumen: 'Chromatic: in passing or as an approach, not to rest on.' },
    },
    contextos: {
      'maj7-jonico': { uso: 'I of the major key', escala: 'Ionian' },
      'maj7-lidio': { uso: 'IV of the major key; also borrowed bVImaj7 and bIIImaj7', escala: 'Lydian' },
      'm7-dorico': { uso: 'II of the major key; Im7 of the minor blues and of modal jazz', escala: 'Dorian' },
      'm7-frigio': { uso: 'III of the major key', escala: 'Phrygian' },
      'm7-eolico': { uso: 'VI of the major key; Im7 of natural minor', escala: 'Aeolian' },
      'mmaj7-melodica': { uso: 'Minor tonic with a major 7 (Im6 and ImMaj7)', escala: 'Melodic minor' },
      'dom-mixolidio': { uso: 'V of the major key; I7, IV7 of the blues', escala: 'Mixolydian' },
      'dom-lidio': { uso: 'Dominants that do not resolve by fifths: bVII7, IV7, subV7 (bII7)', escala: 'Lydian dominant' },
      'dom-alterado': { uso: 'V7 going to a minor chord (V7/II, V7/VI, V7 of minor), or when maximum tension is wanted', escala: 'Superlocrian (altered)' },
      sus: { uso: 'Suspended dominant: modal jazz, IIm7/V', escala: 'Mixolydian' },
      'm7b5-locrio2': { uso: 'II of minor; VIIø7 of the major key', escala: 'Locrian #2' },
      dim7: { uso: 'Passing diminished (#I°7, #IV°7) and VII°7 of minor', escala: 'Diminished (W–H)' },
    },
    tocarAcorde: '▶ Chord',
    tocarDoce: '▶ All 12 over the chord',
    tocarDoceAyuda: 'The chord with each of the 12 notes on top, from the root to the 7',
    soloTensiones: '▶ Tensions only',
    soloTensionesAyuda: 'Only the tensions and the altered ones',
    evitar: '▶ Avoid notes and resolution',
    evitarAyuda: 'Each avoid note and its resolution a half step down',
    todos: 'All the chords',
    todosAyuda: 'The 12 notes from the root (in semitones) over each chord. Press a row to see it above.',
    resumen: '<strong class="cifrado">{cifrado}</strong> as {grados}, with the <strong>{escala}</strong> scale. <span class="suave">{uso}.</span>',
    pulsa: 'Press a note to hear it over the chord and see why it has that role.',
    sinEvitar: 'This chord has no avoid notes.',
    sinTensiones: 'This chord has no tensions.',
  },
);

/** Nombres de las escalas (los de lib/tensiones.ts) en inglés, para las explicaciones. */
const ESCALAS_EN: Record<string, string> = Object.fromEntries(CONTEXTOS.map((c) => [c.escala.nombre, TENSIONES.en.contextos[c.id].escala]));
const escalaEn = (nombre: string) => ESCALAS_EN[nombre] ?? nombre;

const NOTAS_EN: Record<string, string> = {
  'La raíz.': 'The root.',
  'Tensión característica del dórico. En el IIm7 de un ii–V algunos la evitan como nota larga: con la b3 forma un tritono y suena al V7 que viene.':
    'The characteristic Dorian tension. On the IIm7 of a ii–V some players avoid it as a long note: with the b3 it forms a tritone and sounds like the coming V7.',
  'La 3 choca con la 4, que hace su papel: medio tono por debajo. Si suena apoyada, el acorde deja de ser sus (es la resolución de la 4).':
    'The 3 clashes with the 4, which plays its role: a half step below. If it is held, the chord stops being sus (it is the resolution of the 4).',
  'b9: da el sonido frigio del sus(b9) (como en Maiden Voyage o el frigio de McCoy Tyner).':
    'b9: gives the Phrygian sound of sus(b9) (as in Maiden Voyage or McCoy Tyner’s Phrygian).',
  'b9: es la del locrio (el VIIø7 de la escala mayor), y ahí es la nota a evitar: medio tono por encima de la raíz. Con el locrio #2 se cambia por la 9.':
    'b9: it belongs to Locrian (the VIIø7 of the major scale), and there it is the avoid note: a half step above the root. Locrian #2 replaces it with the 9.',
};

const PATRONES_EN: [RegExp, (m: RegExpExecArray) => string][] = [
  [/^Nota del acorde \((\S+)\): apoyo seguro\.$/, (m) => `Chord tone (${m[1]}): a safe place to rest.`],
  [
    /^Tensión alterada \((\S+)\): más tensión antes de resolver\. Está en la escala \((.+)\)\.$/,
    (m) => `Altered tension (${m[1]}): more tension before resolving. It is in the scale (${escalaEn(m[2])}).`,
  ],
  [
    /^Tensión alterada \((\S+)\): más tensión antes de resolver\. No está en la escala (.+): pide la alterada, la disminuida o la mixolidia b9 b13\.$/,
    (m) => `Altered tension (${m[1]}): more tension before resolving. It is not in the ${escalaEn(m[2])} scale: it calls for the altered, the diminished or Mixolydian b9 b13.`,
  ],
  [
    /^Medio tono por encima de la (\S+) del acorde: choca con ella \(intervalo de b9\)\. De paso, sí; apoyada o en el voicing, no\.$/,
    (m) => `A half step above the chord’s ${m[1]}: it clashes with it (a b9 interval). In passing, yes; held or in the voicing, no.`,
  ],
  [
    /^Tensión disponible \((\S+)\): está en la escala \((.+)\) y no choca con ninguna nota del acorde\.$/,
    (m) => `Available tension (${m[1]}): it is in the scale (${escalaEn(m[2])}) and does not clash with any chord tone.`,
  ],
  [
    /^No está en la escala \((.+?)\): medio tono por encima de la (\S+) del acorde\. Cromática: de paso, no apoyada\.$/,
    (m) => `Not in the scale (${escalaEn(m[1])}): a half step above the chord’s ${m[2]}. Chromatic: in passing, not held.`,
  ],
  [
    /^No está en la escala \((.+?)\): medio tono por debajo de la (\S+) del acorde \(buena aproximación cromática hacia ella\)\. Cromática: de paso, no apoyada\.$/,
    (m) => `Not in the scale (${escalaEn(m[1])}): a half step below the chord’s ${m[2]} (a good chromatic approach to it). Chromatic: in passing, not held.`,
  ],
  [/^No está en la escala \((.+?)\)\. Cromática: de paso, no apoyada\.$/, (m) => `Not in the scale (${escalaEn(m[1])}). Chromatic: in passing, not held.`],
];

/** Explicación de una nota sobre un acorde (lib/tensiones.ts) en el idioma pedido. */
export function notaTension(nota: string, idioma: Idioma): string {
  if (idioma === 'es') return nota;
  if (NOTAS_EN[nota]) return NOTAS_EN[nota];
  for (const [re, en] of PATRONES_EN) {
    const m = re.exec(nota);
    if (m) return en(m);
  }
  return nota;
}

