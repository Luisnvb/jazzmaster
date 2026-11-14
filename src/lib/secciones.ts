// Secciones de la web, en el orden de la navegación y la portada. Una sección
// múltiple (con `partes`) agrupa varias páginas: para añadir otra, basta con
// sumarla a sus `partes`.
import { ruta } from './rutas.ts';

export interface Seccion {
  nombre: string;
  href: string;
  lema: string;
  partes?: Seccion[];
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
      { nombre: 'Rutina de práctica', href: ruta('estudio/rutina'), lema: 'Una nota y una cualidad; repertorio en una posición' },
      { nombre: 'Ritmo', href: ruta('estudio/ritmo'), lema: 'Pulso, subdivisiones, swing y patrones de acompañamiento' },
      { nombre: 'Armonía funcional', href: ruta('estudio/armonia'), lema: 'Tónica, subdominante y dominante; analizar progresiones' },
      { nombre: 'Rearmonización', href: ruta('estudio/rearmonizacion'), lema: 'Sustituciones, dominantes secundarios, tritonos y más' },
      { nombre: 'Ciclos de Goodrick', href: ruta('estudio/ciclos'), lema: 'Los acordes de la tonalidad por ciclos, con conducción de voces' },
      { nombre: 'Notas guía', href: ruta('estudio/notas-guia'), lema: 'La 3 y la 7: dos líneas que dibujan la armonía' },
      { nombre: 'Aproximaciones cromáticas', href: ruta('estudio/aproximaciones'), lema: 'Llegar a las notas del acorde por medio tono y con encierros' },
      { nombre: 'Escalas', href: ruta('estudio/escalas'), lema: 'Practicarlas en el mástil, con las notas del acorde marcadas' },
      { nombre: 'Modos', href: ruta('estudio/modos'), lema: 'Paralelos y relativos, con su nota característica' },
      { nombre: 'Arpegios', href: ruta('estudio/arpegios'), lema: 'Cada grado del acorde en todo el mástil' },
      { nombre: 'Tríadas', href: ruta('estudio/triadas'), lema: 'Cerradas y abiertas en todos los grupos de cuerdas' },
      { nombre: 'Shell voicings', href: ruta('estudio/shells'), lema: 'Raíz, 3 y 7: el acompañamiento básico del jazz' },
      { nombre: 'Drop 2', href: ruta('estudio/drop2'), lema: 'Cuatro notas en cuatro cuerdas: inversiones y encadenamientos' },
      { nombre: 'Drop 3', href: ruta('estudio/drop3'), lema: 'Bajo separado y tres voces arriba, con una cuerda saltada' },
    ],
  },
];

/** Si la página actual (con barra final) pertenece a una sección o a alguna de sus partes. */
export const esActual = (s: Seccion, actual: string): boolean =>
  actual.startsWith(s.href) || (s.partes ?? []).some((p) => esActual(p, actual));
