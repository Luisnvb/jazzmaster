// Secciones y páginas en inglés, por la dirección española de cada una. `direccion` es la
// de la página inglesa (bajo /en/), solo en las que ya están traducidas; las demás, en el
// menú inglés, llevan a la página española (marcadas «ES»). Para traducir una página:
// su componente con `idioma`, su página en src/pages/en/… y aquí su `direccion`.

export interface PaginaEn {
  nombre: string;
  lema: string;
  /** Dirección de la página inglesa (sin el prefijo /en/), si existe. */
  direccion?: string;
}

export const SECCIONES_EN: Record<string, { nombre: string; lema: string }> = {
  rutina: { nombre: 'Routine', lema: 'Where to start, what to practise each day and how' },
  'oido-tecnica': { nombre: 'Ear & technique', lema: 'Intervals, harmonic ear, reading, fingering and picking' },
  repertorio: { nombre: 'Repertoire', lema: 'Tunes, their forms and how to learn them' },
  acordes: { nombre: 'Chords', lema: 'Voicings, triads, drops, comping and chord melody' },
  improvisacion: { nombre: 'Improvisation', lema: 'Scales, arpeggios, patterns and language' },
  armonia: { nombre: 'Harmony', lema: 'Progressions, functions and reharmonization' },
  herramientas: { nombre: 'Tools', lema: 'Reference utilities and your notes' },
};

export const PAGINAS_EN: Record<string, PaginaEn> = {
  ruta: { nombre: 'Learning path', lema: 'Seven stages through the site, from the foundations to the modern sound' },
  'estudio/rutina': { nombre: 'Practice routine', lema: 'One note and one quality; repertoire in one position' },
  'estudio/capas': { nombre: 'Fretboard in layers', lema: 'Root, triads, arpeggio, pentatonic, scale and chord in one CAGED zone' },
  'estudio/ritmo': { nombre: 'Rhythm', lema: 'Pulse, subdivisions, swing and comping patterns' },
  intervalos: { nombre: 'Intervals', lema: 'Cards, audio and ear trainer' },
  'estudio/oido-armonico': { nombre: 'Harmonic ear', lema: 'Chord quality trainer, degree chains and progressions' },
  'estudio/dictado': { nombre: 'Melodic dictation', lema: 'Call and response: play back the phrase in the next bar' },
  'estudio/lectura': { nombre: 'Sight reading', lema: 'A note on the staff: find it on the neck, in its octave' },
  'estudio/digitacion': { nombre: 'Fingering and positions', lema: 'The 12 positions, three notes per string and shifting' },
  'estudio/pua': { nombre: 'Picking technique', lema: 'Alternate, economy and sweep, with a metronome and tempo ramps' },
  repertorio: { nombre: 'Repertoire', lema: 'Chord charts, lyrics and notes' },
  'estudio/aprender-standard': { nombre: 'Learning a standard', lema: 'Melody, form, guide tones, shells and improvisation, in that order' },
  'estudio/formas': { nombre: 'Standard forms', lema: 'AABA, ABAC, blues and rhythm changes, with tunes from the Repertoire' },
  'estudio/transcripcion': { nombre: 'Transcription', lema: 'Taking solos and comping off records, step by step' },
  acordes: { nombre: 'Voicings', lema: 'Your selection of voicings, with their degrees' },
  'acordes/al-aire': { nombre: 'Open strings', lema: 'Voicings with open strings: resonance a closed shape cannot give' },
  'estudio/triadas': { nombre: 'Triads', lema: 'Close and open, on every string set' },
  'estudio/shells': { nombre: 'Shell voicings', lema: 'Root, 3 and 7: the basic jazz accompaniment' },
  'estudio/drop2': { nombre: 'Drop 2', lema: 'Four notes on four strings: inversions and voice leading' },
  'estudio/drop3': { nombre: 'Drop 3', lema: 'Separate bass and three voices above, skipping a string' },
  'estudio/cuartas': { nombre: 'Quartal voicings', lema: 'Fourth chords McCoy Tyner style over a modal vamp' },
  'estudio/ciclos': { nombre: 'Goodrick cycles', lema: 'The chords of the key by cycles, with voice leading' },
  'estudio/comping': { nombre: 'Comping', lema: 'Accompanying: rhythm, voicing and register, fixed or changing by bar' },
  'estudio/chord-melody': { nombre: 'Chord melody', lema: 'Melody on top and the chord below: shapes with any note as the top voice' },
  escalas: { nombre: 'Scale dictionary', lema: 'The scales for each chord type' },
  'estudio/escalas': { nombre: 'Scales on the neck', lema: 'Practise them on the neck, with the chord tones marked' },
  'estudio/arpegios': { nombre: 'Arpeggios', lema: 'Every chord degree across the neck' },
  'estudio/modos': { nombre: 'Modes', lema: 'Parallel and relative, with their characteristic note' },
  patrones: { nombre: 'Patterns', lema: 'Scale and arpeggio exercises' },
  'estudio/notas-guia': { nombre: 'Guide tones', lema: 'The 3 and the 7: two lines that outline the harmony' },
  'estudio/aproximaciones': { nombre: 'Chromatic approaches', lema: 'Reaching chord tones by half step and with enclosures' },
  'estudio/bebop': { nombre: 'Bebop language', lema: 'Bebop scale, enclosures and stock phrases: chord tones on the beats' },
  'estudio/pentatonicas': { nombre: 'Pentatonics in jazz', lema: 'Which pentatonic to play over each chord to bring out tensions' },
  'estudio/pares-triadas': { nombre: 'Triad pairs', lema: 'Two triads with no common notes: modern lines over each chord' },
  'estudio/simetricas': { nombre: 'Diminished and whole tone', lema: 'Symmetric scales: a shape that repeats every 3 or 2 frets' },
  'estudio/motivos': { nombre: 'Motifs and development', lema: 'Repeat, transpose, invert and displace a short idea' },
  'estudio/outside': { nombre: 'Outside and in', lema: 'Shift a phrase a half step (or a tritone) and come back' },
  progresiones: { nombre: 'Progressions', lema: 'Jazz and classical, in any key' },
  'estudio/armonia': { nombre: 'Functional harmony', lema: 'Tonic, subdominant and dominant; analysing progressions' },
  'estudio/blues': { nombre: 'Blues', lema: 'Basic, jazz, Bird blues and minor, bar by bar' },
  'estudio/rearmonizacion': { nombre: 'Reharmonization', lema: 'Substitutions, secondary dominants, tritones and more' },
  'estudio/tensiones': { nombre: 'Tensions and avoid notes', lema: 'The 12 notes over a chord: which ones sound and which clash' },
  'estudio/slash': { nombre: 'Slash chords', lema: 'Triads over another bass and upper structures: what chord you get' },
  'estudio/coltrane': { nombre: 'Coltrane changes', lema: 'Giant Steps and the cycle of major thirds, with guide tones and shells' },
  'herramientas/buscador-acordes': {
    nombre: 'Chord finder',
    lema: 'Type some notes or mark them on the neck and it names the chord',
    direccion: 'tools/chord-finder',
  },
  'herramientas/buscador-escalas': {
    nombre: 'Scale finder',
    lema: 'Which scales contain some notes, a chord or a progression',
    direccion: 'tools/scale-finder',
  },
  'herramientas/calculadora-intervalos': {
    nombre: 'Interval calculator',
    lema: 'The exact interval between two notes and the note an interval away',
    direccion: 'tools/interval-calculator',
  },
  'herramientas/transpositor': {
    nombre: 'Transposer',
    lema: 'A chord chart in another key or for a B♭, E♭ or F instrument',
    direccion: 'tools/transposer',
  },
  'herramientas/metronomo': {
    nombre: 'Metronome',
    lema: 'Accents per beat, subdivisions, tempo ramps and silent bars',
    direccion: 'tools/metronome',
  },
  'herramientas/circulo-quintas': {
    nombre: 'Circle of fifths',
    lema: 'Key signatures, relatives, the chords of each key and secondary dominants',
    direccion: 'tools/circle-of-fifths',
  },
  'herramientas/progresiones-aleatorias': {
    nombre: 'Random progressions',
    lema: 'New changes to read, comp and improvise over, in any key',
    direccion: 'tools/random-progressions',
  },
  'herramientas/registro': {
    nombre: 'Practice log',
    lema: 'Timer per activity, minutes per day, per section and streak',
    direccion: 'tools/practice-log',
  },
  apuntes: { nombre: 'Notes', lema: 'Your own notes and links to scores and books on your computer', direccion: 'notes' },
};
