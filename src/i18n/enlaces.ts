// Enlaces de los textos traducidos. Los .en.md de estudio conservan los mismos enlaces
// relativos que el español (../notas-guia/, ../../progresiones/); al compilar una página
// inglesa, el middleware los resuelve contra la dirección española de la página y los
// lleva a la página inglesa equivalente o, si aún no la hay, a la española (con
// hreflang="es"). Así los textos no dependen de las direcciones inglesas. Función pura.

/** Si un href es relativo a la página (no absoluto, ni ancla, ni de otro sitio). */
const esRelativo = (href: string) => !/^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(href);

/**
 * Cambia los href relativos del HTML de una página inglesa. `paginaEs` es la dirección de
 * la página española equivalente (con barra final); `aIngles` da la dirección inglesa de
 * una dirección española, si existe.
 */
export function localizarEnlaces(html: string, paginaEs: string, aIngles: (direccionEs: string) => string | undefined): string {
  return html.replace(/<a\b([^>]*?)\shref="([^"]*)"([^>]*)>/g, (todo, antes: string, href: string, despues: string) => {
    if (!esRelativo(href)) return todo;
    const destino = new URL(href, `http://x${paginaEs}`);
    const ruta = destino.pathname.endsWith('/') ? destino.pathname : `${destino.pathname}/`;
    const en = aIngles(ruta);
    const nuevo = (en ?? ruta) + destino.search + destino.hash;
    const idioma = en || /\shreflang=/.test(antes + despues) ? '' : ' hreflang="es"';
    return `<a${antes} href="${nuevo}"${idioma}${despues}>`;
  });
}
