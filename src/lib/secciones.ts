// Secciones de la web, en el orden de la navegación y la portada, ordenadas por su
// peso en la rutina de práctica. Cada sección reúne páginas (sus `partes`); no tiene
// página propia: es un desplegable del menú. Las direcciones de las páginas no
// dependen de la sección (/acordes/, /estudio/drop2/…): para mover una página de
// sección basta con cambiarla de lista aquí. Para añadir una, súmala a las `partes`.
// La versión inglesa de la lista sale de `secciones('en')`, con los nombres de
// src/i18n/secciones-en.ts (al añadir una página, añádela también allí).
import { conPrefijo, type Idioma } from "../i18n/idiomas.ts";
import { PAGINAS_EN, SECCIONES_EN } from "../i18n/secciones-en.ts";
import { ruta } from "./rutas.ts";

export interface Pagina {
  nombre: string;
  href: string;
  lema: string;
  /** Dirección española, sin base (clave de la tabla inglesa). */
  direccion: string;
  /** En el menú inglés: la página aún no está traducida y lleva a la española. */
  soloEspanol?: boolean;
  /** La misma página en el otro idioma, si existe. */
  otroIdioma?: string;
}

export interface Seccion {
  id: string;
  nombre: string;
  lema: string;
  partes: Pagina[];
}

const pagina = (nombre: string, direccion: string, lema: string): Pagina => {
  const en = PAGINAS_EN[direccion]?.direccion;
  return { nombre, href: ruta(direccion), lema, direccion, otroIdioma: en ? ruta(conPrefijo("en", en)) : undefined };
};
const seccion = (
  id: string,
  nombre: string,
  lema: string,
  partes: Pagina[],
): Seccion => ({ id, nombre, lema, partes });

export const SECCIONES: Seccion[] = [
  seccion(
    "rutina",
    "Rutina",
    "Por dónde empezar, qué practicar cada día y cómo",
    [
      pagina(
        "Ruta de aprendizaje",
        "ruta",
        "Siete etapas por las páginas de la web, de los cimientos al sonido moderno",
      ),
      pagina(
        "Rutina de práctica",
        "estudio/rutina",
        "Una nota y una cualidad; repertorio en una posición",
      ),
      pagina(
        "Mástil por capas",
        "estudio/capas",
        "Raíz, tríadas, arpegio, pentatónica, escala y acorde en una zona CAGED",
      ),
      pagina(
        "Ritmo",
        "estudio/ritmo",
        "Pulso, subdivisiones, swing y patrones de acompañamiento",
      ),
    ],
  ),
  seccion(
    "oido-tecnica",
    "Oído y técnica",
    "Intervalos, oído armónico, lectura, digitación y púa",
    [
      pagina("Intervalos", "intervalos", "Fichas, audio y entrenador de oído"),
      pagina(
        "Oído armónico",
        "estudio/oido-armonico",
        "Entrenador de cualidades, cadenas por grados y progresiones",
      ),
      pagina(
        "Dictado melódico",
        "estudio/dictado",
        "Llamada y respuesta: repite en el compás siguiente la frase que acaba de sonar",
      ),
      pagina(
        "Lectura a primera vista",
        "estudio/lectura",
        "Una nota en el pentagrama: encuéntrala en el mástil, en su octava",
      ),
      pagina(
        "Digitación y posiciones",
        "estudio/digitacion",
        "Las 12 posiciones, tres notas por cuerda y cómo cambiar de sitio la mano",
      ),
      pagina(
        "Técnica de púa",
        "estudio/pua",
        "Alternada, economy y sweep, con metrónomo y subida progresiva de tempo",
      ),
    ],
  ),
  seccion(
    "repertorio",
    "Repertorio",
    "Canciones, sus formas y cómo aprenderlas",
    [
      pagina("Repertorio", "repertorio", "Cifrados, letras y notas"),
      pagina(
        "Aprender un standard",
        "estudio/aprender-standard",
        "Melodía, forma, notas guía, shells e improvisación, en ese orden",
      ),
      pagina(
        "Formas de los standards",
        "estudio/formas",
        "AABA, ABAC, blues y rhythm changes, con temas del Repertorio",
      ),
      pagina(
        "Transcripción",
        "estudio/transcripcion",
        "Sacar solos y acompañamientos de las grabaciones, paso a paso",
      ),
    ],
  ),
  seccion(
    "acordes",
    "Acordes",
    "Voicings, tríadas, drops, comping y chord melody",
    [
      pagina("Voicings", "acordes", "Tu selección de voicings, con sus grados"),
      pagina(
        "Cuerdas al aire",
        "acordes/al-aire",
        "Voicings con cuerdas al aire: la resonancia que no da una forma cerrada",
      ),
      pagina(
        "Tríadas",
        "estudio/triadas",
        "Cerradas y abiertas en todos los grupos de cuerdas",
      ),
      pagina(
        "Shell voicings",
        "estudio/shells",
        "Raíz, 3 y 7: el acompañamiento básico del jazz",
      ),
      pagina(
        "Drop 2",
        "estudio/drop2",
        "Cuatro notas en cuatro cuerdas: inversiones y encadenamientos",
      ),
      pagina(
        "Drop 3",
        "estudio/drop3",
        "Bajo separado y tres voces arriba, con una cuerda saltada",
      ),
      pagina(
        "Cuartas",
        "estudio/cuartas",
        "Acordes por cuartas al estilo McCoy Tyner sobre un vamp modal",
      ),
      pagina(
        "Ciclos de Goodrick",
        "estudio/ciclos",
        "Los acordes de la tonalidad por ciclos, con conducción de voces",
      ),
      pagina(
        "Comping",
        "estudio/comping",
        "Acompañar: ritmo, voicing y registro, fijos o variando por compases",
      ),
      pagina(
        "Chord melody",
        "estudio/chord-melody",
        "Melodía arriba y acorde debajo: formas con la nota que quieras en la voz aguda",
      ),
    ],
  ),
  seccion(
    "improvisacion",
    "Improvisación",
    "Escalas, arpegios, patrones y lenguaje",
    [
      pagina(
        "Diccionario de escalas",
        "escalas",
        "Las escalas de cada tipo de acorde",
      ),
      pagina(
        "Escalas en el mástil",
        "estudio/escalas",
        "Practicarlas en el mástil, con las notas del acorde marcadas",
      ),
      pagina(
        "Arpegios",
        "estudio/arpegios",
        "Cada grado del acorde en todo el mástil",
      ),
      pagina(
        "Modos",
        "estudio/modos",
        "Paralelos y relativos, con su nota característica",
      ),
      pagina("Patrones", "patrones", "Ejercicios de escalas y arpegios"),
      pagina(
        "Notas guía",
        "estudio/notas-guia",
        "La 3 y la 7: dos líneas que dibujan la armonía",
      ),
      pagina(
        "Aproximaciones cromáticas",
        "estudio/aproximaciones",
        "Llegar a las notas del acorde por medio tono y con encierros",
      ),
      pagina(
        "Lenguaje bebop",
        "estudio/bebop",
        "Escala bebop, encierros y frases tipo: notas del acorde en los tiempos",
      ),
      pagina(
        "Pentatónicas en jazz",
        "estudio/pentatonicas",
        "Qué pentatónica tocar sobre cada acorde para sacar tensiones",
      ),
      pagina(
        "Pares de tríadas",
        "estudio/pares-triadas",
        "Dos tríadas sin notas comunes: líneas modernas sobre cada acorde",
      ),
      pagina(
        "Disminuida y tonos enteros",
        "estudio/simetricas",
        "Escalas simétricas: un dibujo que se repite cada 3 o 2 trastes",
      ),
      pagina(
        "Motivos y desarrollo",
        "estudio/motivos",
        "Repetir, transponer, invertir y desplazar una idea corta",
      ),
      pagina(
        "Fuera y dentro",
        "estudio/outside",
        "Desplazar una frase medio tono (o un tritono) y volver",
      ),
    ],
  ),
  seccion("armonia", "Armonía", "Progresiones, funciones y rearmonización", [
    pagina("Progresiones", "progresiones", "Jazz y clásica, en cualquier tono"),
    pagina(
      "Armonía funcional",
      "estudio/armonia",
      "Tónica, subdominante y dominante; analizar progresiones",
    ),
    pagina(
      "Blues",
      "estudio/blues",
      "Básico, de jazz, Bird blues y menor, compás a compás",
    ),
    pagina(
      "Rearmonización",
      "estudio/rearmonizacion",
      "Sustituciones, dominantes secundarios, tritonos y más",
    ),
    pagina(
      "Tensiones y avoid notes",
      "estudio/tensiones",
      "Las 12 notas sobre un acorde: cuáles suenan y cuáles chocan",
    ),
    pagina(
      "Acordes slash",
      "estudio/slash",
      "Tríadas sobre otro bajo y estructuras superiores: qué acorde sale",
    ),
    pagina(
      "Cambios de Coltrane",
      "estudio/coltrane",
      "Giant Steps y el ciclo de terceras mayores, con notas guía y shells",
    ),
  ]),
  seccion("herramientas", "Herramientas", "Utilidades de consulta y tus apuntes", [
    pagina(
      "Buscador de acordes",
      "herramientas/buscador-acordes",
      "Escribe unas notas o márcalas en el mástil y te dice qué acorde forman",
    ),
    pagina(
      "Buscador de escalas",
      "herramientas/buscador-escalas",
      "Qué escalas contienen unas notas, un acorde o una progresión",
    ),
    pagina(
      "Calculadora de intervalos",
      "herramientas/calculadora-intervalos",
      "El intervalo exacto entre dos notas y la nota a un intervalo de otra",
    ),
    pagina(
      "Transpositor",
      "herramientas/transpositor",
      "Un cifrado a otro tono o para un instrumento en Si♭, Mi♭ o Fa",
    ),
    pagina(
      "Metrónomo",
      "herramientas/metronomo",
      "Acentos por pulso, subdivisiones, subida de tempo y compases en silencio",
    ),
    pagina(
      "Círculo de quintas",
      "herramientas/circulo-quintas",
      "Armaduras, relativas, acordes de cada tonalidad y dominantes secundarios",
    ),
    pagina(
      "Progresiones aleatorias",
      "herramientas/progresiones-aleatorias",
      "Cambios nuevos para leer, acompañar e improvisar, en cualquier tono",
    ),
    pagina(
      "Registro de práctica",
      "herramientas/registro",
      "Cronómetro por actividad, minutos por día, por sección y racha",
    ),
    pagina(
      "Apuntes",
      "apuntes",
      "Notas propias y enlaces a partituras y libros de tu equipo",
    ),
  ]),
];

/** Las secciones en inglés: nombres traducidos; las páginas sin traducir llevan a la española. */
const SECCIONES_INGLES: Seccion[] = SECCIONES.map((s) => ({
  ...s,
  nombre: SECCIONES_EN[s.id]?.nombre ?? s.nombre,
  lema: SECCIONES_EN[s.id]?.lema ?? s.lema,
  partes: s.partes.map((p): Pagina => {
    const en = PAGINAS_EN[p.direccion];
    if (!en) return { ...p, soloEspanol: true, otroIdioma: undefined };
    return en.direccion
      ? { ...p, nombre: en.nombre, lema: en.lema, href: ruta(conPrefijo("en", en.direccion)), otroIdioma: p.href }
      : { ...p, nombre: en.nombre, lema: en.lema, soloEspanol: true, otroIdioma: undefined };
  }),
}));

/** Las secciones de la web en un idioma. */
export const secciones = (idioma: Idioma): Seccion[] => (idioma === "en" ? SECCIONES_INGLES : SECCIONES);

/** Todas las páginas, en el orden de las secciones. */
export const PAGINAS: Pagina[] = SECCIONES.flatMap((s) => s.partes);

/**
 * Nombre de una página en un idioma a partir de su nombre español (el que se guarda en el
 * Registro de práctica). Si no es una página de la lista («Otra», texto libre), tal cual.
 */
export function nombreActividad(nombre: string, idioma: Idioma): string {
  if (idioma === "es") return nombre;
  const p = PAGINAS.find((x) => x.nombre === nombre);
  return (p && PAGINAS_EN[p.direccion]?.nombre) ?? (nombre === "Otra" ? "Other" : nombre);
}

/** Todas las páginas de un idioma (en inglés, con las españolas que aún no están traducidas). */
export const paginas = (idioma: Idioma): Pagina[] => secciones(idioma).flatMap((s) => s.partes);

/** Si la página actual (con barra final) es esta página o está dentro de ella (/intervalos/entrenador/). */
export const esActual = (p: Pick<Pagina, "href">, actual: string): boolean =>
  actual.startsWith(p.href);

/**
 * La página de la lista en la que estamos: la de dirección más larga que la contiene
 * (/estudio/escalas/ y no /escalas/… aunque aquí no se solapan; /repertorio/x/ → Repertorio).
 */
export const paginaActual = (actual: string, idioma: Idioma = "es"): Pagina | undefined =>
  paginas(idioma)
    .filter((p) => esActual(p, actual))
    .sort((a, b) => b.href.length - a.href.length)[0];

/** La sección en la que estamos: la de la página actual. */
export const seccionActual = (actual: string, idioma: Idioma = "es"): Seccion | undefined => {
  const p = paginaActual(actual, idioma);
  return p && secciones(idioma).find((s) => s.partes.includes(p));
};
