/**
 * Convierte el cifrado de una sección en compases:
 * "Fmaj7 | Gm7 C7 |" → [['Fmaj7'], ['Gm7', 'C7']]
 * Los compases vacíos ("| |") se conservan; las barras inicial y final se ignoran.
 */
export function compases(cifrado: string): string[][] {
  const trozos = cifrado.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
  if (trozos.length === 1 && trozos[0].trim() === '') return [];
  return trozos.map((c) => c.trim().split(/\s+/).filter(Boolean));
}

/** Texto en minúsculas y sin tildes, para buscar sin preocuparse de acentos. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
