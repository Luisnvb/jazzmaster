// Al compilar cada página: marca el cifrado de los títulos para que las mayúsculas de los
// títulos no lo cambien (lib/titulos.ts). Los títulos que pintan los scripts los marca
// el navegador (vigilarTitulos, en layouts/Base.astro).
import { defineMiddleware } from 'astro:middleware';
import { marcarCifradoEnPagina } from './lib/titulos.ts';

export const onRequest = defineMiddleware(async (_, next) => {
  const respuesta = await next();
  if (!respuesta.headers.get('content-type')?.includes('text/html')) return respuesta;
  const html = marcarCifradoEnPagina(await respuesta.text());
  return new Response(html, { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
});
