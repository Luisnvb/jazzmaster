// Al compilar cada página: marca el cifrado de los títulos para que las mayúsculas de los
// títulos no lo cambien (lib/titulos.ts). Los títulos que pintan los scripts los marca
// el navegador (vigilarTitulos, en layouts/Base.astro). En las páginas inglesas, además,
// los enlaces relativos de los textos traducidos (los .en.md, que conservan los del
// español) se llevan a la página inglesa equivalente o a la española (i18n/enlaces.ts).
import { defineMiddleware } from 'astro:middleware';
import { marcarCifradoEnPagina } from './lib/titulos.ts';
import { BASE } from './lib/rutas.ts';
import { PAGINAS, paginas } from './lib/secciones.ts';
import { idiomaDeDireccion } from './i18n/idiomas.ts';
import { localizarEnlaces } from './i18n/enlaces.ts';

/** Dirección española → inglesa, de las páginas traducidas. */
const A_INGLES = new Map(PAGINAS.filter((p) => p.otroIdioma).map((p) => [p.href, p.otroIdioma!]));
/** Dirección inglesa → española. */
const A_ESPANOL = new Map(paginas('en').filter((p) => p.otroIdioma).map((p) => [p.href, p.otroIdioma!]));

export const onRequest = defineMiddleware(async (contexto, next) => {
  const respuesta = await next();
  if (!respuesta.headers.get('content-type')?.includes('text/html')) return respuesta;
  let html = marcarCifradoEnPagina(await respuesta.text());
  const direccion = contexto.url.pathname.endsWith('/') ? contexto.url.pathname : `${contexto.url.pathname}/`;
  const espanola = idiomaDeDireccion(direccion, BASE) === 'en' ? A_ESPANOL.get(direccion) : undefined;
  if (espanola) html = localizarEnlaces(html, espanola, (r) => A_INGLES.get(r));
  return new Response(html, { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
});
