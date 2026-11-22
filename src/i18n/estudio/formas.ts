// Textos de Formas de los standards (components/estudio/formas.astro), y las formas de
// lib/estructuras.ts en inglés (por id de forma y de ejemplo).
import { textos } from '../idiomas.ts';

export const FORMAS_TEXTOS = textos(
  {
    titulo: 'Formas de los standards',
    secciones: 'Las formas, sección a sección',
    forma: 'Forma',
    ejemplo: 'Ejemplo',
    mapa: 'Mapa de la forma',
    tocar: '▶ Tocar la forma',
    opciones: 'Opciones',
    metronomo: 'Metrónomo',
    metronomoAyuda: 'Un clic por pulso, más fuerte al empezar el compás',
    coros: '⟲ Coros seguidos',
    corosAyuda: 'Coro tras coro, sin parar, contando las vueltas',
    ocultar: 'Ocultar acordes',
    ocultarAyuda: 'Solo se ven los números de compás: sigue la forma de oído',
    seguir: 'Marcar dónde va',
    seguirAyuda: 'Marca la sección y el compás que suenan',
    pulsaTocar: 'Pulsa «Tocar la forma» para oírla.',
    otros: 'Otros temas con esta forma:',
    original: 'En la tonalidad original ({tonica}).',
    volverOriginal: '↺ Tonalidad original ({tonica})',
    abrirRepertorio: 'Abrir en el Repertorio',
    posicion: 'Coro {coro} · {seccion} · compás {n} de {total} ({k} de {todos})',
    coro: 'Coro {coro}',
    coroN: '{n} coros.',
    rango: 'compases {desde}–{hasta}',
  },
  {
    titulo: 'Standard forms',
    secciones: 'The forms, section by section',
    forma: 'Form',
    ejemplo: 'Example',
    mapa: 'Map of the form',
    tocar: '▶ Play the form',
    opciones: 'Options',
    metronomo: 'Metronome',
    metronomoAyuda: 'One click per beat, louder at the start of the bar',
    coros: '⟲ Choruses in a row',
    corosAyuda: 'Chorus after chorus, without stopping, counting the rounds',
    ocultar: 'Hide chords',
    ocultarAyuda: 'Only the bar numbers are shown: follow the form by ear',
    seguir: 'Follow along',
    seguirAyuda: 'Marks the section and bar that are sounding',
    pulsaTocar: 'Press “Play the form” to hear it.',
    otros: 'Other tunes with this form:',
    original: 'In the original key ({tonica}).',
    volverOriginal: '↺ Original key ({tonica})',
    abrirRepertorio: 'Open in the Repertoire (Spanish)',
    posicion: 'Chorus {coro} · {seccion} · bar {n} of {total} ({k} of {todos})',
    coro: 'Chorus {coro}',
    coroN: '{n} choruses.',
    rango: 'bars {desde}–{hasta}',
  },
);

/** Las formas en inglés (los ejemplos, con el papel de cada sección en orden). */
export const FORMAS_EN: Record<string, { nombre?: string; esquema: string; descripcion: string; standards?: string[] }> = {
  aaba: {
    esquema: 'A A B A · 32 bars',
    descripcion:
      'Broadway song form: an eight-bar idea that repeats, a contrasting bridge and the idea again. The most common in standards from the 1920s to the 50s.',
  },
  abac: {
    esquema: 'A B A C · 32 bars',
    descripcion:
      'Two 16-bar halves that start the same (A) and end differently: the first is left open (B) and the second closes (C). It sounds like a large-scale question and answer.',
  },
  blues: {
    esquema: 'A A B · 12 bars',
    descripcion:
      'Three four-bar phrases: tonic, subdominant and dominant with a turnaround. Blues lyrics follow the same scheme: a line, the same line again and the answer.',
    standards: ["Now's the Time", "Billie's Bounce", 'Blue Monk', 'Straight, No Chaser', 'Tenor Madness', 'Blues for Alice', 'C Jam Blues', 'Mr. P.C. (minor)', 'Equinox (minor)'],
  },
  'rhythm-changes': {
    esquema: 'A A B A · 32 bars',
    descripcion:
      'The chords of I Got Rhythm (Gershwin, 1930), on which dozens of bebop tunes were written. An AABA in which the As are fast I–VI–II–V turnarounds and the bridge is dominants by fifths, two bars each.',
  },
  otras: {
    nombre: 'Other forms',
    esquema: 'AB, ABCD, 16 bars…',
    descripcion:
      'Not every tune fits the moulds. Many modern standards have 16-bar forms, two almost identical halves (AA′) or no repetition at all (through-composed). Three examples from the Repertoire.',
    standards: ['Autumn Leaves (AABC)', 'Blue Bossa (16, AB)', 'Solar (12, not a blues)', 'Infant Eyes (27)', 'Footprints', 'Dolphin Dance (through-composed)'],
  },
};

export const EJEMPLOS_EN: Record<string, { nombre?: string; nota: string; papeles: string[] }> = {
  'aaba-modelo': {
    nombre: 'AABA model',
    nota: 'Example harmony, not from a specific tune: tonic, turnarounds and a bridge that goes to the IV. There is no AABA tune in the Repertoire yet.',
    papeles: [
      'Presents the melody. Ends on a turnaround (IIm7–V7) that goes back to the top.',
      'The same melody; the ending changes and closes on the tonic (2nd ending).',
      'Bridge: another harmonic area (here the IV, with its ii–V) and a dominant leading back to A.',
      'The last A, like the second: closes the chorus on the tonic.',
    ],
  },
  'days-of-wine-and-roses': {
    nota: 'Henry Mancini (1962). The Repertoire chart simplifies a bar or two (Eb7 for the whole of bar 7, without the Bbm7).',
    papeles: [
      'Fmaj7 – Eb7 and a chain of ii–Vs going down to Gm7.',
      'First ending: passes through Dm (the VIm), with its ii–V, and is left open on C7, the dominant.',
      'Same as the first A: the listener recognises that the second half is starting.',
      'Second ending: Bø7–E7 towards Am and a chain of ii–Vs closing on Fmaj7 (with the turnaround to go back).',
    ],
  },
  turnaround: {
    nota: 'Ornette Coleman (1959): a blues in C with a chromatic descent of minor chords in bars 9 and 10.',
    papeles: [
      'Tonic: C7 with a move to F7 in bar 2 (the "quick change").',
      'Subdominant: F7 and Fm7, and back to C7. The line "repeats" over another chord.',
      'Answer: instead of V7, a descent of parallel m7 chords (Cm7 C#m7 – Bm7 Am7) and the C7 – G7 turnaround.',
    ],
  },
  footprints: {
    nombre: 'Footprints (minor blues)',
    nota: 'Wayne Shorter (1966). A 24-bar minor blues in 3/4: the same 12-bar scheme, with each 6/4 bar split in two.',
    papeles: [
      'Eight bars of 3/4 (four of 6/4) on Cm7: the tonic, unhurried.',
      'Fm7 (the IVm) and back to Cm7.',
      'F#ø7 – F7 – E7 – A7: dominants moving down by half steps instead of V7, and Cm7 again.',
    ],
  },
  'rhythm-modelo': {
    nota: 'In Bb, the key of almost every bebop tune on these changes. The bars are the ones in Progressions (Rhythm changes A and bridge).',
    papeles: [
      'I–VI–II–V turnarounds; in bar 5, I7 going to the IV and a passing diminished chord.',
      'The same A, but with the 2nd ending: the last two bars close on the tonic.',
      'Bridge: III7 – VI7 – II7 – V7, two bars each, around the cycle of fifths to the dominant.',
      'Last A, like the second.',
    ],
  },
  'cantaloupe-island': {
    nota: 'Herbie Hancock (1964). 16 bars, four chords of four bars each: the form is what gives meaning to a tune with almost no changes.',
    papeles: [
      'Fm7 for four bars: a modal (Dorian) vamp.',
      'Db7: a half step below… or a major 3rd below the tonic.',
      'Dm7: the most surprising change, a minor 3rd below.',
      'Fm7 again: closes the 16-bar cycle.',
    ],
  },
  esp: {
    nota: 'Wayne Shorter (1965). AA′ form: two halves of 16 that only differ at the end, like ABAC but with the middle part repeated.',
    papeles: [
      'E7 – Fmaj7 and E7 – Ebmaj7; dominants resolving down a half step.',
      'The first 12 bars are the same; the last four change to close on Fmaj7.',
    ],
  },
  'stella-by-starlight': {
    nota: 'Victor Young (1944). 32 bars with no repeated section (through-composed): you have to learn all of it, no shortcuts.',
    papeles: [
      'Eø7 – A7 and a chain of ii–Vs that never settles: the key is revealed little by little.',
      'G7 towards Cm7 and Ab7 towards Bb: the most stable moment.',
      'Descending ii–Vs that finally end on Bbmaj7.',
    ],
  },
};
