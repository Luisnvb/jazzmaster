// Rutas internas teniendo en cuenta la base del sitio: en GitHub Pages la web
// vive en /<repositorio>/, no en la raíz. Todo enlace interno pasa por aquí.

/** Base del sitio, siempre terminada en "/" ("/" en local, "/trastero-251/" en Pages). */
export const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/** Página interna: ruta('acordes') → "/trastero-251/acordes/". */
export function ruta(pagina = ''): string {
  const limpia = pagina.replace(/^\/+|\/+$/g, '');
  return limpia ? `${BASE}${limpia}/` : BASE;
}

/** Archivo estático de public/: archivo('iconos/icono-192.png'). */
export function archivo(ruta: string): string {
  return BASE + ruta.replace(/^\/+/, '');
}
