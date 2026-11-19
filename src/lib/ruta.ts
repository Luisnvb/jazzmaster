// Ruta de aprendizaje: etapas en orden, cada una con pasos que llevan a páginas de la
// propia web. Cada paso dice qué hacer allí y cuándo darlo por bueno. Una página sale
// una sola vez en la ruta (la `direccion` es la clave del paso). El progreso (pasos
// hechos) se guarda en este navegador.
// Las direcciones son las de lib/secciones.ts sin la base ('estudio/drop2'); la página
// /ruta/ comprueba al compilar que todas existen.
import { borrar, guardarJSON, leerJSON } from './almacen.ts';

export interface Paso {
  /** Página de la web, como en lib/secciones.ts: 'estudio/shells'. */
  direccion: string;
  /** Qué hacer en esa página. */
  tarea: string;
  /** Cuándo está superado. */
  meta: string;
}

export interface Etapa {
  id: string;
  nombre: string;
  objetivo: string;
  pasos: Paso[];
}

const paso = (direccion: string, tarea: string, meta: string): Paso => ({ direccion, tarea, meta });

export const ETAPAS: Etapa[] = [
  {
    id: 'cimientos',
    nombre: 'Cimientos',
    objetivo: 'Una rutina, buen pulso y la mano izquierda situada en el mástil.',
    pasos: [
      paso('estudio/rutina', 'Lee cómo se organiza la práctica y prueba el sorteo del material del día.', 'Tienes una sesión fija de 30 a 60 minutos y la cumples una semana.'),
      paso('estudio/ritmo', 'Marca el pulso en 2 y 4 y toca corcheas con swing junto al metrónomo.', 'Aguantas dos minutos a 100 BPM sin adelantarte ni perder el 2 y 4.'),
      paso('estudio/digitacion', 'Toca la escala mayor en las posiciones de la página, primero en C y luego en otros tonos.', 'Recorres C mayor en cinco posiciones sin pararte a pensar el dedo.'),
      paso('estudio/pua', 'Púa alternada en corcheas y cambios de cuerda limpios, subiendo poco a poco el tempo.', 'Corcheas alternadas a 100 BPM, parejas y sin ruido de cuerdas.'),
      paso('intervalos', 'Aprende cómo suena y cómo se ve en el mástil cada intervalo; luego pasa al entrenador.', 'Aciertas 3as, 5as y 7as en el entrenador al menos 8 de cada 10 veces.'),
    ],
  },
  {
    id: 'acordes-basicos',
    nombre: 'Acordes de base',
    objetivo: 'Acompañar un blues y un ii–V–I con acordes de tres y cuatro notas.',
    pasos: [
      paso('estudio/shells', 'Shells de maj7, 7 y m7 con la raíz en la 6ª y en la 5ª cuerda.', 'Encadenas un ii–V–I en cualquier tono moviendo la mano lo mínimo.'),
      paso('acordes', 'Elige tus voicings de cada cualidad y quédate con dos o tres por acorde.', 'Tienes una selección propia y la tocas sin mirar el diagrama.'),
      paso('progresiones', 'Toca las progresiones de jazz más comunes con shells, en varios tonos.', 'ii–V–I mayor y menor en los 12 tonos, con el tempo a 80.'),
      paso('estudio/blues', 'Aprende el blues básico y el de jazz, compás a compás.', 'Acompañas 12 compases de blues de jazz en F y en Bb sin parar.'),
      paso('estudio/triadas', 'Tríadas cerradas en los cuatro grupos de cuerdas, con sus inversiones.', 'Encuentras C, Cm, F y Fm en cada grupo de cuerdas en menos de cinco segundos.'),
    ],
  },
  {
    id: 'primeros-solos',
    nombre: 'Primeros solos',
    objetivo: 'Tocar notas que suenan a la armonía: arpegios, escalas y notas guía.',
    pasos: [
      paso('estudio/arpegios', 'Arpegios de maj7, 7 y m7 en todo el mástil, nombrando cada grado.', 'Tocas el arpegio de cualquier acorde del ii–V–I en una zona fija del mástil.'),
      paso('escalas', 'Repasa qué escala va con cada tipo de acorde: mayor, dórica, mixolidia.', 'Sabes decir la escala de cada acorde de un ii–V–I sin consultar.'),
      paso('estudio/escalas', 'Practica esas escalas en el mástil con las notas del acorde marcadas.', 'Improvisas un coro sobre un ii–V–I quedándote en una posición.'),
      paso('estudio/notas-guia', 'Une las 3as y 7as de cada acorde en dos líneas de notas guía.', 'Tocas las notas guía de un blues entero mientras suena el acompañamiento.'),
      paso('estudio/pentatonicas', 'Usa las pentatónicas para sacar tensiones sobre cada acorde.', 'Sabes qué pentatónica tocar sobre maj7, m7 y 7 y lo usas en un solo.'),
      paso('estudio/oido-armonico', 'Entrena el oído para distinguir cualidades de acorde y grados.', 'Distingues maj7, m7, 7 y m7b5 al oído 8 de cada 10 veces.'),
    ],
  },
  {
    id: 'repertorio',
    nombre: 'Repertorio',
    objetivo: 'Aprender temas enteros: melodía, forma, acompañamiento e improvisación.',
    pasos: [
      paso('estudio/formas', 'Aprende las formas típicas (AABA, ABAC, blues, rhythm changes).', 'Al escuchar un standard, sabes en qué parte de la forma estás.'),
      paso('estudio/aprender-standard', 'Sigue el método paso a paso con un tema sencillo.', 'Has completado todos los pasos con un tema.'),
      paso('repertorio', 'Elige un tema del repertorio y llévalo de la melodía al solo.', 'Tocas la melodía, acompañas un coro e improvisas otro sin perderte.'),
      paso('estudio/capas', 'Trabaja un tema por capas en una sola zona del mástil.', 'Recorres raíz, tríada, arpegio y escala de cada acorde del tema en una zona.'),
      paso('estudio/transcripcion', 'Saca de oído una frase corta de una grabación.', 'Has transcrito y tocas junto a la grabación al menos cuatro compases.'),
    ],
  },
  {
    id: 'lenguaje',
    nombre: 'Lenguaje',
    objetivo: 'Sonar a jazz: cromatismo, frases bebop, ideas que se desarrollan y comping con intención.',
    pasos: [
      paso('estudio/aproximaciones', 'Llega a las notas del acorde por medio tono y con encierros.', 'Cada cambio de acorde de un ii–V–I cae en una nota del acorde tras una aproximación.'),
      paso('estudio/bebop', 'Escala bebop, encierros y frases tipo sobre dominantes.', 'Tienes tres frases bebop tuyas sobre un V7 y las usas en un solo.'),
      paso('patrones', 'Practica patrones de escala y arpegio por todo el mástil.', 'Tocas dos patrones en los 12 tonos a 100 BPM.'),
      paso('estudio/motivos', 'Desarrolla una idea corta: repítela, transpórtala, desplázala.', 'Improvisas un coro entero a partir de un solo motivo.'),
      paso('estudio/dictado', 'Repite de oído la frase que acaba de sonar.', 'Aciertas frases de dos compases sin mirar el mástil.'),
      paso('estudio/comping', 'Acompaña variando ritmo, voicing y registro.', 'Acompañas un blues dos coros sin repetir el mismo patrón rítmico.'),
    ],
  },
  {
    id: 'armonia',
    nombre: 'Armonía y voicings',
    objetivo: 'Entender por qué funcionan los cambios y tocar acordes más ricos.',
    pasos: [
      paso('estudio/armonia', 'Funciones de tónica, subdominante y dominante; analiza progresiones.', 'Analizas los grados de un tema del repertorio.'),
      paso('estudio/drop2', 'Voicings drop 2 en las cuatro cuerdas agudas, con sus inversiones.', 'Encadenas un ii–V–I en drop 2 en tres zonas del mástil.'),
      paso('estudio/drop3', 'Voicings drop 3 con el bajo separado.', 'Acompañas un tema lento solo con drop 3.'),
      paso('estudio/tensiones', 'Qué notas suenan y cuáles chocan sobre cada acorde.', 'Añades 9, 11 o 13 a tus voicings sabiendo cuál evitar.'),
      paso('estudio/rearmonizacion', 'Sustituciones, dominantes secundarios y tritonos.', 'Rearmonizas ocho compases de un tema y lo acompañas.'),
      paso('estudio/chord-melody', 'La melodía arriba y el acorde debajo.', 'Tocas la sección A de un tema en chord melody.'),
      paso('acordes/al-aire', 'Voicings con cuerdas al aire para baladas e intros.', 'Usas dos voicings con cuerdas al aire en un tema.'),
      paso('estudio/lectura', 'Lee notas en el pentagrama y encuéntralas en su octava.', 'Lees la melodía de un tema nuevo sin tablatura.'),
    ],
  },
  {
    id: 'sonido-moderno',
    nombre: 'Sonido moderno',
    objetivo: 'Colores modales, estructuras simétricas y salir de la armonía con intención.',
    pasos: [
      paso('estudio/modos', 'Modos paralelos y relativos, con su nota característica.', 'Improvisas sobre un vamp modal destacando la nota característica.'),
      paso('estudio/pares-triadas', 'Dos tríadas sin notas comunes para líneas modernas.', 'Tocas una línea de pares de tríadas sobre un m7 y un maj7.'),
      paso('estudio/simetricas', 'Disminuida y tonos enteros sobre dominantes.', 'Usas la disminuida semitono-tono sobre un V7b9 en un solo.'),
      paso('estudio/cuartas', 'Acordes por cuartas sobre un vamp modal.', 'Acompañas un vamp dórico solo con cuartas.'),
      paso('estudio/slash', 'Tríadas sobre otro bajo y estructuras superiores.', 'Sabes qué acorde sale de cada tríada sobre un bajo dado.'),
      paso('estudio/outside', 'Desplaza una frase medio tono y vuelve.', 'Sales y vuelves a la tonalidad dentro de un compás, a propósito.'),
      paso('estudio/coltrane', 'Los cambios de Giant Steps con notas guía y shells.', 'Acompañas los cambios de Coltrane a 120 BPM.'),
      paso('estudio/ciclos', 'Los acordes de la tonalidad por ciclos de Goodrick.', 'Encadenas un ciclo completo con buena conducción de voces.'),
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
