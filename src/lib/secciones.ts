// Secciones de la web, en el orden de la navegación y la portada. Una sección
// múltiple (con `partes`) agrupa varias páginas: para añadir otra, basta con
// sumarla a sus `partes`. Las partes pueden llevar un `grupo` (Estudio: Rutina,
// Armonía, Improvisación, Acordes); los grupos salen en el orden en que aparecen.
import { ruta } from './rutas.ts';

export interface Seccion {
  nombre: string;
  href: string;
  lema: string;
  partes?: Seccion[];
  /** Grupo dentro de su sección múltiple. */
  grupo?: string;
}

export const SECCIONES: Seccion[] = [
  { nombre: 'Repertorio', href: ruta('repertorio'), lema: 'Cifrados, letras y notas' },
  { nombre: 'Acordes', href: ruta('acordes'), lema: 'Voicings con sus grados' },
  { nombre: 'Escalas', href: ruta('escalas'), lema: 'Diccionario por tipo de acorde' },
  { nombre: 'Patrones', href: ruta('patrones'), lema: 'Ejercicios de escalas y arpegios' },
  { nombre: 'Intervalos', href: ruta('intervalos'), lema: 'Fichas, audio y entrenador de oído' },
  { nombre: 'Progresiones', href: ruta('progresiones'), lema: 'Jazz y clásica, en cualquier tono' },
  {
    nombre: 'Estudio',
    href: ruta('estudio'),
    lema: 'Teoría, ideas y prácticas concretas',
    partes: [
      // Rutina
      { grupo: 'Rutina', nombre: 'Rutina de práctica', href: ruta('estudio/rutina'), lema: 'Una nota y una cualidad; repertorio en una posición' },
      { grupo: 'Rutina', nombre: 'Ritmo', href: ruta('estudio/ritmo'), lema: 'Pulso, subdivisiones, swing y patrones de acompañamiento' },
      // Armonía
      { grupo: 'Armonía', nombre: 'Armonía funcional', href: ruta('estudio/armonia'), lema: 'Tónica, subdominante y dominante; analizar progresiones' },
      { grupo: 'Armonía', nombre: 'Oído armónico', href: ruta('estudio/oido-armonico'), lema: 'Entrenador de cualidades, cadenas por grados y progresiones' },
      { grupo: 'Armonía', nombre: 'Rearmonización', href: ruta('estudio/rearmonizacion'), lema: 'Sustituciones, dominantes secundarios, tritonos y más' },
      { grupo: 'Armonía', nombre: 'Blues', href: ruta('estudio/blues'), lema: 'Básico, de jazz, Bird blues y menor, compás a compás' },
      { grupo: 'Armonía', nombre: 'Tensiones y avoid notes', href: ruta('estudio/tensiones'), lema: 'Las 12 notas sobre un acorde: cuáles suenan y cuáles chocan' },
      // Improvisación
      { grupo: 'Improvisación', nombre: 'Notas guía', href: ruta('estudio/notas-guia'), lema: 'La 3 y la 7: dos líneas que dibujan la armonía' },
      { grupo: 'Improvisación', nombre: 'Aproximaciones cromáticas', href: ruta('estudio/aproximaciones'), lema: 'Llegar a las notas del acorde por medio tono y con encierros' },
      { grupo: 'Improvisación', nombre: 'Lenguaje bebop', href: ruta('estudio/bebop'), lema: 'Escala bebop, encierros y frases tipo: notas del acorde en los tiempos' },
      { grupo: 'Improvisación', nombre: 'Escalas', href: ruta('estudio/escalas'), lema: 'Practicarlas en el mástil, con las notas del acorde marcadas' },
      { grupo: 'Improvisación', nombre: 'Modos', href: ruta('estudio/modos'), lema: 'Paralelos y relativos, con su nota característica' },
      { grupo: 'Improvisación', nombre: 'Arpegios', href: ruta('estudio/arpegios'), lema: 'Cada grado del acorde en todo el mástil' },
      { grupo: 'Improvisación', nombre: 'Disminuida y tonos enteros', href: ruta('estudio/simetricas'), lema: 'Escalas simétricas: un dibujo que se repite cada 3 o 2 trastes' },
      { grupo: 'Improvisación', nombre: 'Pares de tríadas', href: ruta('estudio/pares-triadas'), lema: 'Dos tríadas sin notas comunes: líneas modernas sobre cada acorde' },
      // Acordes
      { grupo: 'Acordes', nombre: 'Ciclos de Goodrick', href: ruta('estudio/ciclos'), lema: 'Los acordes de la tonalidad por ciclos, con conducción de voces' },
      { grupo: 'Acordes', nombre: 'Tríadas', href: ruta('estudio/triadas'), lema: 'Cerradas y abiertas en todos los grupos de cuerdas' },
      { grupo: 'Acordes', nombre: 'Shell voicings', href: ruta('estudio/shells'), lema: 'Raíz, 3 y 7: el acompañamiento básico del jazz' },
      { grupo: 'Acordes', nombre: 'Drop 2', href: ruta('estudio/drop2'), lema: 'Cuatro notas en cuatro cuerdas: inversiones y encadenamientos' },
      { grupo: 'Acordes', nombre: 'Drop 3', href: ruta('estudio/drop3'), lema: 'Bajo separado y tres voces arriba, con una cuerda saltada' },
    ],
  },
];

/** Si la página actual (con barra final) pertenece a una sección o a alguna de sus partes. */
export const esActual = (s: Seccion, actual: string): boolean =>
  actual.startsWith(s.href) || (s.partes ?? []).some((p) => esActual(p, actual));

export interface Grupo {
  nombre: string;
  /** Ancla en la página de la sección múltiple (#armonia). */
  id: string;
  partes: Seccion[];
}

/** Ancla de un grupo: "Improvisación" → "improvisacion". */
export const idGrupo = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

/** Partes de una sección múltiple por grupos, en el orden en que aparecen (sin grupo → un único grupo sin nombre). */
export function agrupar(partes: readonly Seccion[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const p of partes) {
    const nombre = p.grupo ?? '';
    let g = grupos.find((x) => x.nombre === nombre);
    if (!g) grupos.push((g = { nombre, id: idGrupo(nombre), partes: [] }));
    g.partes.push(p);
  }
  return grupos;
}
