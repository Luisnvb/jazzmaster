// Manifiesto de la web instalable (PWA) en cada idioma. Lo sirven los endpoints
// src/pages/manifest.webmanifest.ts (español) y src/pages/manifest.en.webmanifest.ts
// (inglés); Base.astro enlaza el del idioma de la página. Función pura: recibe la base
// del sitio para poder probarla sin import.meta.env.
import { conPrefijo, type Idioma } from './idiomas.ts';

const DESCRIPCION: Record<Idioma, string> = {
  es: 'Intervalos, escalas, acordes y repertorio para practicar guitarra.',
  en: 'Intervals, scales, chords and repertoire to practise guitar.',
};

/** Dirección del manifiesto de cada idioma, relativa a la base. */
export const ARCHIVO_MANIFIESTO: Record<Idioma, string> = { es: 'manifest.webmanifest', en: 'manifest.en.webmanifest' };

/**
 * El manifiesto de un idioma. Cada idioma es una app instalable distinta (su `id` y su
 * `start_url` son su portada), pero las dos abarcan toda la web (`scope` = la base): desde
 * la inglesa se puede ir a las páginas que solo están en español sin salir de la app.
 */
export function manifiesto(idioma: Idioma, base: string) {
  const raiz = base.endsWith('/') ? base : `${base}/`;
  const inicio = idioma === 'es' ? raiz : `${raiz}${conPrefijo(idioma, '')}/`;
  const icono = (archivo: string) => `${raiz}iconos/${archivo}`;
  return {
    id: inicio,
    name: 'JAZZMASTER',
    short_name: 'JAZZMASTER',
    description: DESCRIPCION[idioma],
    lang: idioma,
    dir: 'ltr',
    start_url: inicio,
    scope: raiz,
    display: 'standalone',
    background_color: '#ffffff', // COLOR: fondo al abrir la app instalada (igual que --fondo)
    theme_color: '#ffffff', // COLOR: barra del sistema en la app instalada
    icons: [
      { src: icono('icono-192.png'), sizes: '192x192', type: 'image/png' },
      { src: icono('icono-512.png'), sizes: '512x512', type: 'image/png' },
      { src: icono('icono-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

/** Respuesta HTTP con el manifiesto (para los endpoints). */
export const respuestaManifiesto = (idioma: Idioma, base: string) =>
  new Response(JSON.stringify(manifiesto(idioma, base), null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
