/** Ordena entradas de colección según su posición en el archivo YAML. */
export const porOrden = <T extends { data: { orden: number } }>(entradas: T[]): T[] =>
  [...entradas].sort((a, b) => a.data.orden - b.data.orden);
