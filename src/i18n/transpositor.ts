// Textos del Transpositor (components/herramientas/transpositor.astro).
import { textos } from './idiomas.ts';

export const TRANSPOSITOR = textos(
  {
    titulo: 'Transpositor',
    intro:
      'Pega un cifrado: compases con barras (<code>| Dm7 G7 | Cmaj7 |</code>) o una hoja con la letra y los acordes encima. Solo cambian las líneas de acordes; la letra, las barras y los espacios se quedan como están.',
    comoTransportar: 'Cómo transportar',
    tonos: 'De un tono a otro',
    instrumentoTransp: 'Instrumento transpositor',
    semitonos: 'Semitonos',
    de: 'De',
    a: 'a',
    instrumento: 'Instrumento',
    sentido: 'Sentido',
    haciaInstrumento: 'Del sonido real a su parte',
    haciaConcierto: 'De su parte al sonido real',
    medioAbajo: 'Medio tono abajo',
    medioArriba: 'Medio tono arriba',
    semitonosMin: 'semitonos',
    alteraciones: 'Alteraciones',
    segunTono: 'Según el tono',
    bemoles: 'Siempre bemoles',
    sostenidos: 'Siempre sostenidos',
    original: 'Original',
    transportado: 'Transportado',
    copiar: 'Copiar',
    usar: 'Usar como original',
    ejemplo: `| Dm7 G7 | Cmaj7 | Cm7 F7 | Bbmaj7 |
| Bbm7 Eb7 | Abmaj7 | Dm7b5 G7(b9) | Cm6 |

Am7          D7(b9)      Gmaj7
Aquí va la letra: esta línea no se toca`,
    parece: 'Parece {tono} {modo} (por el último acorde)',
    mayor: 'mayor',
    menor: 'menor',
    sinCambios: '(sin cambios)',
    resumen: '({intervalo} hacia {direccion})',
    arriba: 'arriba',
    abajo: 'abajo',
  },
  {
    titulo: 'Transposer',
    intro:
      'Paste a chord chart: bars with barlines (<code>| Dm7 G7 | Cmaj7 |</code>) or a lead sheet with the chords above the lyrics. Only chord lines change; lyrics, barlines and spacing stay as they are.',
    comoTransportar: 'How to transpose',
    tonos: 'From one key to another',
    instrumentoTransp: 'Transposing instrument',
    semitonos: 'Semitones',
    de: 'From',
    a: 'to',
    instrumento: 'Instrument',
    sentido: 'Direction',
    haciaInstrumento: 'Concert pitch to their part',
    haciaConcierto: 'Their part to concert pitch',
    medioAbajo: 'Half step down',
    medioArriba: 'Half step up',
    semitonosMin: 'semitones',
    alteraciones: 'Accidentals',
    segunTono: 'Follow the key',
    bemoles: 'Always flats',
    sostenidos: 'Always sharps',
    original: 'Original',
    transportado: 'Transposed',
    copiar: 'Copy',
    usar: 'Use as original',
    ejemplo: `| Dm7 G7 | Cmaj7 | Cm7 F7 | Bbmaj7 |
| Bbm7 Eb7 | Abmaj7 | Dm7b5 G7(b9) | Cm6 |

Am7          D7(b9)      Gmaj7
The lyrics go here: this line is left alone`,
    parece: 'Looks like {tono} {modo} (from the last chord)',
    mayor: 'major',
    menor: 'minor',
    sinCambios: '(no change)',
    resumen: '({intervalo} {direccion})',
    arriba: 'up',
    abajo: 'down',
  },
);
