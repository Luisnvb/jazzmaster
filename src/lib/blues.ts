// Blues de 12 compases: sus variantes (los compases están en progresiones.yaml,
// para que también salgan en Progresiones, Armonía funcional y Rearmonización)
// y lo que cambia de una a otra. Funciones puras.

export interface Variante {
  /** Id de la progresión en progresiones.yaml. */
  id: string;
  nombre: string;
  descripcion: string;
}

export const VARIANTES: Variante[] = [
  { id: 'blues-basico', nombre: 'Básico', descripcion: 'Tres acordes de séptima: I7, IV7 y V7. Todos dominantes, ninguno resuelve del todo.' },
  { id: 'blues-jazz', nombre: 'De jazz', descripcion: 'El básico con ii–V: Vm7–I7 hacia el IV, disminuido de paso, VI7 hacia el IIm7 y turnaround al final.' },
  { id: 'blues-bird', nombre: 'Bird blues', descripcion: 'Charlie Parker: empieza en Imaj7 y baja por ii–V secundarios (y uno sustituto) hasta el IIm7 del compás 9.' },
  { id: 'blues-menor', nombre: 'Menor', descripcion: 'Im7 e IVm7 de la tonalidad menor; en el 9, bVI7 (sustituto tritonal del V7/V) hacia el V7alt.' },
];

/** Las tres frases de cuatro compases del blues. */
export const FRASES = [
  { desde: 0, nombre: 'Compases 1–4', papel: 'Tónica: se asienta el I y, al final, se prepara el IV.' },
  { desde: 4, nombre: 'Compases 5–8', papel: 'Subdominante: el IV y la vuelta al I.' },
  { desde: 8, nombre: 'Compases 9–12', papel: 'Dominante y turnaround: V (o ii–V) y vuelta al principio.' },
] as const;

/**
 * Qué acordes de un compás no están en el mismo compás de otra versión
 * (para marcar lo que cambia respecto al blues básico).
 */
export function cambiados(compas: string, referencia: string): boolean[] {
  const ref = referencia.trim().split(/\s+/);
  return compas
    .trim()
    .split(/\s+/)
    .map((a) => !ref.includes(a));
}
