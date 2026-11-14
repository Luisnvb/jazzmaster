// Favoritos (voicings, canciones…): una lista de ids por sección, guardada en este
// navegador. Los favoritos se muestran antes que el resto.
import { borrar, guardarJSON, leerJSON } from './almacen.ts';

export interface Favoritos {
  tiene(id: string): boolean;
  /** Marca o desmarca; devuelve si queda como favorito. */
  alternar(id: string): boolean;
}

export function favoritos(seccion: string): Favoritos {
  const clave = `${seccion}:favoritos`;
  const ids = new Set(leerJSON<string[]>(clave) ?? []);
  return {
    tiene: (id) => ids.has(id),
    alternar(id) {
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      if (ids.size) guardarJSON(clave, [...ids]);
      else borrar(clave);
      return ids.has(id);
    },
  };
}

/** Los favoritos primero, conservando el orden relativo dentro de cada parte. */
export function favoritosPrimero<T>(lista: readonly T[], esFavorito: (x: T) => boolean): T[] {
  return [...lista.filter(esFavorito), ...lista.filter((x) => !esFavorito(x))];
}

/** Botón de estrella (el estado va en aria-pressed). */
export const botonFavorito = (activo: boolean, nombre: string) =>
  `<button type="button" class="favorito" data-favorito aria-pressed="${activo}" aria-label="Favorito: ${nombre.replace(/"/g, '&quot;')}" title="${activo ? 'Quitar de favoritos' : 'Marcar como favorito'}">${activo ? '★' : '☆'}</button>`;
