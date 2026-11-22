// Los títulos (h1–h4 y el de la cabecera) van en mayúsculas por CSS, pero el cifrado no
// se puede poner en mayúsculas sin cambiar de significado: m7 no es M7, b9 no es B9, ii–V
// no es II–V y Bb no es BB. Estas funciones envuelven esas palabras en <span class="cifra">,
// que en global.css se queda como está escrita.

/** Palabra de cifrado con minúsculas que importan. */
export function esCifrado(palabra: string): boolean {
  // Las entidades HTML (&#39; de un apóstrofo) no cuentan: «Today&#39;s» no es cifrado.
  palabra = palabra.replace(/&#?\w+;/g, '');
  if (!/[a-z]/.test(palabra)) return false;
  return /\d|[–#♭♯°ø]/.test(palabra) || /^[A-G][b#]$/.test(palabra) || /^b?(ii|iii|iv|vi|vii)$/.test(palabra);
}

// Una entidad HTML (&#39;) forma parte de la palabra: su «;» no la corta.
const PALABRA = /(?:&#?\w+;|[^\s()[\],.:;¿?¡!·])+/g;
const TITULO = /(<h[1-4]\b[^>]*>|<[^>]+class="[^"]*\btitulo-seccion\b[^"]*"[^>]*>)([\s\S]*?)(<\/(?:h[1-4]|p)>)/g;

/** Marca el cifrado del texto (ya escapado) de un trozo de HTML, sin tocar las etiquetas. */
export function marcarCifrado(html: string): string {
  return html.replace(/(^|>)([^<]+)/g, (_, antes: string, texto: string) =>
    antes + texto.replace(PALABRA, (p) => (esCifrado(p) ? `<span class="cifra">${p}</span>` : p)),
  );
}

/** Marca el cifrado de los títulos de una página HTML completa (fuera de los <script>). */
export function marcarCifradoEnPagina(html: string): string {
  return html
    .split(/(<script\b[\s\S]*?<\/script>)/)
    .map((trozo, i) => (i % 2 ? trozo : trozo.replace(TITULO, (_, abre: string, dentro: string, cierra: string) => abre + marcarCifrado(dentro) + cierra)))
    .join('');
}

const SELECTOR = 'h1, h2, h3, h4, .titulo-seccion';

/** En el navegador: marca los títulos que ya hay y los que vayan pintando los scripts. */
export function vigilarTitulos(raiz: HTMLElement = document.body) {
  const marcar = (titulo: Element) => {
    const recorrido = document.createTreeWalker(titulo, NodeFilter.SHOW_TEXT);
    const textos: Text[] = [];
    while (recorrido.nextNode()) textos.push(recorrido.currentNode as Text);
    for (const t of textos) {
      if (t.parentElement?.closest('.cifra')) continue;
      const valor = t.data;
      if (!valor.match(PALABRA)?.some(esCifrado)) continue;
      const trozo = document.createDocumentFragment();
      let ultimo = 0;
      for (const m of valor.matchAll(PALABRA)) {
        if (!esCifrado(m[0])) continue;
        trozo.append(valor.slice(ultimo, m.index));
        const span = document.createElement('span');
        span.className = 'cifra';
        span.textContent = m[0];
        trozo.append(span);
        ultimo = m.index! + m[0].length;
      }
      trozo.append(valor.slice(ultimo));
      t.replaceWith(trozo);
    }
  };
  const revisar = (nodo: Node) => {
    const el = nodo instanceof Element ? nodo : nodo.parentElement;
    if (!el) return;
    const titulo = el.closest(SELECTOR);
    if (titulo) marcar(titulo);
    el.querySelectorAll(SELECTOR).forEach(marcar);
  };
  revisar(raiz);
  new MutationObserver((cambios) => {
    for (const c of cambios) {
      if (c.type === 'characterData') revisar(c.target);
      else c.addedNodes.forEach(revisar);
    }
  }).observe(raiz, { childList: true, subtree: true, characterData: true });
}
