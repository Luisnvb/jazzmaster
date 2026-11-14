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
      { nombre: 'Ciclos de Goodrick', href: ruta('estudio/ciclos'), lema: 'Los acordes de la tonalidad por ciclos, con conducción de voces' },
    ],
  },
];

/** Si la página actual (con barra final) pertenece a una sección o a alguna de sus partes. */
export const esActual = (s: Seccion, actual: string): boolean =>
  actual.startsWith(s.href) || (s.partes ?? []).some((p) => esActual(p, actual));
