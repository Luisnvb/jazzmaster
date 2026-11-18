// Páginas favoritas (guardadas en este navegador). Salen las primeras en el menú de
// su sección, en la portada de la sección y en la de la web. Las listas que se ordenan son los elementos
// [data-lista-paginas] con hijos [data-pagina="<href>"].
import { favoritos, favoritosPrimero, type Favoritos } from './favoritos.ts';

export const paginasFavoritas = (): Favoritos => favoritos('paginas');

/** Las favoritas primero, en su orden de siempre; el resto, detrás, también en su orden. */
export const ordenarConFavoritas = (hrefs: readonly string[], esFavorita: (href: string) => boolean) => favoritosPrimero(hrefs, esFavorita);

/** Ordena las listas de páginas de la página con las favoritas primero y las marca. */
export function aplicarFavoritas(raiz: ParentNode = document) {
  const f = paginasFavoritas();
  for (const lista of raiz.querySelectorAll<HTMLElement>('[data-lista-paginas]')) {
    const elementos = [...lista.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el.dataset.pagina !== undefined);
    // El orden original se guarda la primera vez, para volver a él al quitar una favorita.
    elementos.forEach((el, i) => (el.dataset.orden ??= String(i)));
    const porHref = new Map(elementos.map((el) => [el.dataset.pagina!, el]));
    const original = [...elementos].sort((a, b) => Number(a.dataset.orden) - Number(b.dataset.orden)).map((el) => el.dataset.pagina!);
    for (const href of ordenarConFavoritas(original, (h) => f.tiene(h))) {
      const el = porHref.get(href)!;
      el.classList.toggle('favorita', f.tiene(href));
      lista.append(el);
    }
  }
}
