// Inicial de un título para agruparlo en un índice alfabético (Repertorio): la
// primera letra, en mayúscula y sin tilde; si empieza por número o símbolo, «#».

export function inicial(titulo: string): string {
  const letra = titulo
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .charAt(0)
    .toUpperCase();
  return /^[A-ZÑ]$/.test(letra) ? letra : '#';
}

/** Orden de los grupos: «#» primero y luego las letras. */
export const compararIniciales = (a: string, b: string): number =>
  a === b ? 0 : a === '#' ? -1 : b === '#' ? 1 : a.localeCompare(b, 'es');
