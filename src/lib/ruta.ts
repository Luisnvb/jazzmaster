// Ruta de aprendizaje: etapas en orden, cada una con pasos que llevan a páginas de la
// propia web. Cada paso dice qué hacer allí y cuándo darlo por bueno. Una página sale
// una sola vez en la ruta (la `direccion` es la clave del paso). El progreso (pasos
// hechos) se guarda en este navegador.
// Las direcciones son las de lib/secciones.ts sin la base ('estudio/drop2'); la página de
// la ruta (components/paginas/ruta.astro) comprueba al compilar que todas existen.
// Cada etapa y cada paso llevan su texto en inglés (`en`) para /en/learning-path/ y el
// aviso de las páginas inglesas; textoEtapa y textoPaso dan el del idioma pedido.
import { borrar, guardarJSON, leerJSON } from './almacen.ts';
import type { Idioma } from '../i18n/idiomas.ts';

export interface Paso {
  /** Página de la web, como en lib/secciones.ts: 'estudio/shells'. */
  direccion: string;
  /** Qué hacer en esa página. */
  tarea: string;
  /** Cuándo está superado. */
  meta: string;
  /** Lo mismo en inglés. */
  en: { tarea: string; meta: string };
}

export interface Etapa {
  id: string;
  nombre: string;
  objetivo: string;
  /** Lo mismo en inglés. */
  en: { nombre: string; objetivo: string };
  pasos: Paso[];
}

const paso = (direccion: string, tarea: string, meta: string, [enTarea, enMeta]: [string, string]): Paso => ({
  direccion,
  tarea,
  meta,
  en: { tarea: enTarea, meta: enMeta },
});

/** Nombre y objetivo de una etapa en un idioma. */
export const textoEtapa = (e: Etapa, idioma: Idioma) => (idioma === 'en' ? e.en : { nombre: e.nombre, objetivo: e.objetivo });

/** Tarea y meta de un paso en un idioma. */
export const textoPaso = (p: Paso, idioma: Idioma) => (idioma === 'en' ? p.en : { tarea: p.tarea, meta: p.meta });

export const ETAPAS: Etapa[] = [
  {
    id: 'cimientos',
    nombre: 'Cimientos',
    objetivo: 'Una rutina, buen pulso y la mano izquierda situada en el mástil.',
    en: { nombre: 'Foundations', objetivo: 'A routine, a steady pulse and your fretting hand at home on the neck.' },
    pasos: [
      paso('estudio/rutina', 'Lee cómo se organiza la práctica y prueba el sorteo del material del día.', 'Tienes una sesión fija de 30 a 60 minutos y la cumples una semana.',
        ['Read how practice is organised and try the draw for the day’s material.', 'You have a fixed 30–60 minute session and keep to it for a week.']),
      paso('estudio/ritmo', 'Marca el pulso en 2 y 4 y toca corcheas con swing junto al metrónomo.', 'Aguantas dos minutos a 100 BPM sin adelantarte ni perder el 2 y 4.',
        ['Mark the pulse on 2 and 4 and play swung eighth notes with the metronome.', 'You last two minutes at 100 BPM without rushing or losing 2 and 4.']),
      paso('estudio/digitacion', 'Toca la escala mayor en las posiciones de la página, primero en C y luego en otros tonos.', 'Recorres C mayor en cinco posiciones sin pararte a pensar el dedo.',
        ['Play the major scale in the positions on the page, first in C and then in other keys.', 'You go through C major in five positions without stopping to think about fingers.']),
      paso('estudio/pua', 'Púa alternada en corcheas y cambios de cuerda limpios, subiendo poco a poco el tempo.', 'Corcheas alternadas a 100 BPM, parejas y sin ruido de cuerdas.',
        ['Alternate picking in eighth notes and clean string changes, raising the tempo little by little.', 'Alternate-picked eighth notes at 100 BPM, even and with no string noise.']),
      paso('intervalos', 'Aprende cómo suena y cómo se ve en el mástil cada intervalo; luego pasa al entrenador.', 'Aciertas 3as, 5as y 7as en el entrenador al menos 8 de cada 10 veces.',
        ['Learn how each interval sounds and looks on the neck; then move on to the trainer.', 'You get 3rds, 5ths and 7ths right in the trainer at least 8 times out of 10.']),
    ],
  },
  {
    id: 'acordes-basicos',
    nombre: 'Acordes de base',
    objetivo: 'Acompañar un blues y un ii–V–I con acordes de tres y cuatro notas.',
    en: { nombre: 'Basic chords', objetivo: 'Comp a blues and a ii–V–I with three- and four-note chords.' },
    pasos: [
      paso('estudio/shells', 'Shells de maj7, 7 y m7 con la raíz en la 6ª y en la 5ª cuerda.', 'Encadenas un ii–V–I en cualquier tono moviendo la mano lo mínimo.',
        ['Maj7, 7 and m7 shells with the root on the 6th and the 5th string.', 'You link a ii–V–I in any key moving your hand as little as possible.']),
      paso('acordes', 'Elige tus voicings de cada cualidad y quédate con dos o tres por acorde.', 'Tienes una selección propia y la tocas sin mirar el diagrama.',
        ['Choose your voicings for each quality and keep two or three per chord.', 'You have your own selection and play it without looking at the diagram.']),
      paso('progresiones', 'Toca las progresiones de jazz más comunes con shells, en varios tonos.', 'ii–V–I mayor y menor en los 12 tonos, con el tempo a 80.',
        ['Play the most common jazz progressions with shells, in several keys.', 'Major and minor ii–V–I in all 12 keys, with the tempo at 80.']),
      paso('estudio/blues', 'Aprende el blues básico y el de jazz, compás a compás.', 'Acompañas 12 compases de blues de jazz en F y en Bb sin parar.',
        ['Learn the basic blues and the jazz blues, bar by bar.', 'You comp 12 bars of jazz blues in F and in Bb without stopping.']),
      paso('estudio/triadas', 'Tríadas cerradas en los cuatro grupos de cuerdas, con sus inversiones.', 'Encuentras C, Cm, F y Fm en cada grupo de cuerdas en menos de cinco segundos.',
        ['Close triads on the four string sets, with their inversions.', 'You find C, Cm, F and Fm on each string set in under five seconds.']),
    ],
  },
  {
    id: 'primeros-solos',
    nombre: 'Primeros solos',
    objetivo: 'Tocar notas que suenan a la armonía: arpegios, escalas y notas guía.',
    en: { nombre: 'First solos', objetivo: 'Play notes that sound like the harmony: arpeggios, scales and guide tones.' },
    pasos: [
      paso('estudio/arpegios', 'Arpegios de maj7, 7 y m7 en todo el mástil, nombrando cada grado.', 'Tocas el arpegio de cualquier acorde del ii–V–I en una zona fija del mástil.',
        ['Maj7, 7 and m7 arpeggios across the neck, naming each degree.', 'You play the arpeggio of any chord in a ii–V–I in one fixed area of the neck.']),
      paso('escalas', 'Repasa qué escala va con cada tipo de acorde: mayor, dórica, mixolidia.', 'Sabes decir la escala de cada acorde de un ii–V–I sin consultar.',
        ['Go over which scale goes with each chord type: major, Dorian, Mixolydian.', 'You can name the scale for each chord of a ii–V–I without looking it up.']),
      paso('estudio/escalas', 'Practica esas escalas en el mástil con las notas del acorde marcadas.', 'Improvisas un coro sobre un ii–V–I quedándote en una posición.',
        ['Practise those scales on the neck with the chord tones marked.', 'You improvise a chorus over a ii–V–I staying in one position.']),
      paso('estudio/notas-guia', 'Une las 3as y 7as de cada acorde en dos líneas de notas guía.', 'Tocas las notas guía de un blues entero mientras suena el acompañamiento.',
        ['Connect the 3rds and 7ths of each chord into two guide-tone lines.', 'You play the guide tones of a whole blues while the backing plays.']),
      paso('estudio/pentatonicas', 'Usa las pentatónicas para sacar tensiones sobre cada acorde.', 'Sabes qué pentatónica tocar sobre maj7, m7 y 7 y lo usas en un solo.',
        ['Use pentatonics to bring out tensions over each chord.', 'You know which pentatonic to play over maj7, m7 and 7 and use it in a solo.']),
      paso('estudio/oido-armonico', 'Entrena el oído para distinguir cualidades de acorde y grados.', 'Distingues maj7, m7, 7 y m7b5 al oído 8 de cada 10 veces.',
        ['Train your ear to tell chord qualities and degrees apart.', 'You tell maj7, m7, 7 and m7b5 apart by ear 8 times out of 10.']),
    ],
  },
  {
    id: 'repertorio',
    nombre: 'Repertorio',
    objetivo: 'Aprender temas enteros: melodía, forma, acompañamiento e improvisación.',
    en: { nombre: 'Repertoire', objetivo: 'Learn whole tunes: melody, form, comping and improvisation.' },
    pasos: [
      paso('estudio/formas', 'Aprende las formas típicas (AABA, ABAC, blues, rhythm changes).', 'Al escuchar un standard, sabes en qué parte de la forma estás.',
        ['Learn the typical forms (AABA, ABAC, blues, rhythm changes).', 'When you listen to a standard, you know where you are in the form.']),
      paso('estudio/aprender-standard', 'Sigue el método paso a paso con un tema sencillo.', 'Has completado todos los pasos con un tema.',
        ['Follow the step-by-step method with an easy tune.', 'You have completed every step with one tune.']),
      paso('repertorio', 'Elige un tema del repertorio y llévalo de la melodía al solo.', 'Tocas la melodía, acompañas un coro e improvisas otro sin perderte.',
        ['Choose a tune from the repertoire and take it from the melody to the solo.', 'You play the melody, comp one chorus and improvise another without getting lost.']),
      paso('estudio/capas', 'Trabaja un tema por capas en una sola zona del mástil.', 'Recorres raíz, tríada, arpegio y escala de cada acorde del tema en una zona.',
        ['Work on a tune in layers in a single area of the neck.', 'You go through root, triad, arpeggio and scale of every chord in the tune in one area.']),
      paso('estudio/transcripcion', 'Saca de oído una frase corta de una grabación.', 'Has transcrito y tocas junto a la grabación al menos cuatro compases.',
        ['Learn a short phrase from a recording by ear.', 'You have transcribed at least four bars and play them along with the recording.']),
    ],
  },
  {
    id: 'lenguaje',
    nombre: 'Lenguaje',
    objetivo: 'Sonar a jazz: cromatismo, frases bebop, ideas que se desarrollan y comping con intención.',
    en: { nombre: 'Language', objetivo: 'Sound like jazz: chromaticism, bebop phrases, ideas that develop and comping with intent.' },
    pasos: [
      paso('estudio/aproximaciones', 'Llega a las notas del acorde por medio tono y con encierros.', 'Cada cambio de acorde de un ii–V–I cae en una nota del acorde tras una aproximación.',
        ['Reach the chord tones by half step and with enclosures.', 'Every chord change in a ii–V–I lands on a chord tone after an approach.']),
      paso('estudio/bebop', 'Escala bebop, encierros y frases tipo sobre dominantes.', 'Tienes tres frases bebop tuyas sobre un V7 y las usas en un solo.',
        ['Bebop scale, enclosures and stock phrases over dominants.', 'You have three bebop phrases of your own over a V7 and use them in a solo.']),
      paso('patrones', 'Practica patrones de escala y arpegio por todo el mástil.', 'Tocas dos patrones en los 12 tonos a 100 BPM.',
        ['Practise scale and arpeggio patterns all over the neck.', 'You play two patterns in all 12 keys at 100 BPM.']),
      paso('estudio/motivos', 'Desarrolla una idea corta: repítela, transpórtala, desplázala.', 'Improvisas un coro entero a partir de un solo motivo.',
        ['Develop a short idea: repeat it, transpose it, displace it.', 'You improvise a whole chorus from a single motif.']),
      paso('estudio/dictado', 'Repite de oído la frase que acaba de sonar.', 'Aciertas frases de dos compases sin mirar el mástil.',
        ['Play back by ear the phrase that has just sounded.', 'You get two-bar phrases right without looking at the neck.']),
      paso('estudio/comping', 'Acompaña variando ritmo, voicing y registro.', 'Acompañas un blues dos coros sin repetir el mismo patrón rítmico.',
        ['Comp varying rhythm, voicing and register.', 'You comp two choruses of a blues without repeating the same rhythmic pattern.']),
    ],
  },
  {
    id: 'armonia',
    nombre: 'Armonía y voicings',
    objetivo: 'Entender por qué funcionan los cambios y tocar acordes más ricos.',
    en: { nombre: 'Harmony and voicings', objetivo: 'Understand why the changes work and play richer chords.' },
    pasos: [
      paso('estudio/armonia', 'Funciones de tónica, subdominante y dominante; analiza progresiones.', 'Analizas los grados de un tema del repertorio.',
        ['Tonic, subdominant and dominant functions; analyse progressions.', 'You analyse the degrees of a tune from the repertoire.']),
      paso('estudio/drop2', 'Voicings drop 2 en las cuatro cuerdas agudas, con sus inversiones.', 'Encadenas un ii–V–I en drop 2 en tres zonas del mástil.',
        ['Drop 2 voicings on the top four strings, with their inversions.', 'You link a ii–V–I in drop 2 in three areas of the neck.']),
      paso('estudio/drop3', 'Voicings drop 3 con el bajo separado.', 'Acompañas un tema lento solo con drop 3.',
        ['Drop 3 voicings with the bass set apart.', 'You comp a slow tune using only drop 3.']),
      paso('estudio/tensiones', 'Qué notas suenan y cuáles chocan sobre cada acorde.', 'Añades 9, 11 o 13 a tus voicings sabiendo cuál evitar.',
        ['Which notes sound good and which clash over each chord.', 'You add 9, 11 or 13 to your voicings knowing which one to avoid.']),
      paso('estudio/rearmonizacion', 'Sustituciones, dominantes secundarios y tritonos.', 'Rearmonizas ocho compases de un tema y lo acompañas.',
        ['Substitutions, secondary dominants and tritone subs.', 'You reharmonise eight bars of a tune and comp them.']),
      paso('estudio/chord-melody', 'La melodía arriba y el acorde debajo.', 'Tocas la sección A de un tema en chord melody.',
        ['The melody on top and the chord below.', 'You play the A section of a tune in chord melody.']),
      paso('acordes/al-aire', 'Voicings con cuerdas al aire para baladas e intros.', 'Usas dos voicings con cuerdas al aire en un tema.',
        ['Voicings with open strings for ballads and intros.', 'You use two open-string voicings in a tune.']),
      paso('estudio/lectura', 'Lee notas en el pentagrama y encuéntralas en su octava.', 'Lees la melodía de un tema nuevo sin tablatura.',
        ['Read notes on the staff and find them in their octave.', 'You read the melody of a new tune without tab.']),
    ],
  },
  {
    id: 'sonido-moderno',
    nombre: 'Sonido moderno',
    objetivo: 'Colores modales, estructuras simétricas y salir de la armonía con intención.',
    en: { nombre: 'Modern sound', objetivo: 'Modal colours, symmetric structures and going outside the harmony on purpose.' },
    pasos: [
      paso('estudio/modos', 'Modos paralelos y relativos, con su nota característica.', 'Improvisas sobre un vamp modal destacando la nota característica.',
        ['Parallel and relative modes, with their characteristic note.', 'You improvise over a modal vamp bringing out the characteristic note.']),
      paso('estudio/pares-triadas', 'Dos tríadas sin notas comunes para líneas modernas.', 'Tocas una línea de pares de tríadas sobre un m7 y un maj7.',
        ['Two triads with no common notes for modern lines.', 'You play a triad-pair line over an m7 and a maj7.']),
      paso('estudio/simetricas', 'Disminuida y tonos enteros sobre dominantes.', 'Usas la disminuida semitono-tono sobre un V7b9 en un solo.',
        ['Diminished and whole tone over dominants.', 'You use the half-whole diminished scale over a V7b9 in a solo.']),
      paso('estudio/cuartas', 'Acordes por cuartas sobre un vamp modal.', 'Acompañas un vamp dórico solo con cuartas.',
        ['Quartal chords over a modal vamp.', 'You comp a Dorian vamp using only fourths.']),
      paso('estudio/slash', 'Tríadas sobre otro bajo y estructuras superiores.', 'Sabes qué acorde sale de cada tríada sobre un bajo dado.',
        ['Triads over another bass note and upper structures.', 'You know which chord comes from each triad over a given bass note.']),
      paso('estudio/outside', 'Desplaza una frase medio tono y vuelve.', 'Sales y vuelves a la tonalidad dentro de un compás, a propósito.',
        ['Shift a phrase a half step and come back.', 'You go out and come back to the key within one bar, on purpose.']),
      paso('estudio/coltrane', 'Los cambios de Giant Steps con notas guía y shells.', 'Acompañas los cambios de Coltrane a 120 BPM.',
        ['The Giant Steps changes with guide tones and shells.', 'You comp the Coltrane changes at 120 BPM.']),
      paso('estudio/ciclos', 'Los acordes de la tonalidad por ciclos de Goodrick.', 'Encadenas un ciclo completo con buena conducción de voces.',
        ['The chords of the key by Goodrick cycles.', 'You link a whole cycle with good voice leading.']),
    ],
  },
];

/** Todos los pasos, en orden, con el número de su etapa. */
export const PASOS: (Paso & { etapa: Etapa; numero: number })[] = ETAPAS.flatMap((etapa) =>
  etapa.pasos.map((p) => ({ ...p, etapa })),
).map((p, i) => ({ ...p, numero: i + 1 }));

/** El primer paso sin hacer (a partir de un paso dado, si se indica); undefined si no queda ninguno. */
export function siguientePaso(hechos: ReadonlySet<string>, despuesDe?: string) {
  const desde = despuesDe === undefined ? 0 : PASOS.findIndex((p) => p.direccion === despuesDe) + 1;
  return PASOS.slice(desde).find((p) => !hechos.has(p.direccion)) ?? PASOS.find((p) => !hechos.has(p.direccion));
}

/** Pasos hechos de una etapa. */
export const hechosDeEtapa = (etapa: Etapa, hechos: ReadonlySet<string>) => etapa.pasos.filter((p) => hechos.has(p.direccion)).length;

const CLAVE = 'ruta:hechos';

/** Pasos hechos (sus direcciones), guardados en este navegador. Solo en el navegador. */
export function progresoRuta() {
  const hechos = new Set(leerJSON<string[]>(CLAVE) ?? []);
  const guardar = () => (hechos.size ? guardarJSON(CLAVE, [...hechos]) : borrar(CLAVE));
  return {
    hechos: hechos as ReadonlySet<string>,
    marcar(direccion: string, hecho: boolean) {
      if (hecho) hechos.add(direccion);
      else hechos.delete(direccion);
      guardar();
      document.dispatchEvent(new CustomEvent('ruta-cambiada'));
    },
    reiniciar() {
      hechos.clear();
      guardar();
      document.dispatchEvent(new CustomEvent('ruta-cambiada'));
    },
  };
}
