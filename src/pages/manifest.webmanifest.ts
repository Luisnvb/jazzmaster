// Manifiesto de la web instalable. Se genera al compilar para que las rutas
// lleven la base del sitio (en GitHub Pages, /<repositorio>/).
import { archivo, BASE } from '../lib/rutas.ts';

export function GET() {
  const manifiesto = {
    name: 'Práctica de guitarra',
    short_name: 'Práctica',
    description: 'Intervalos, escalas, acordes y repertorio para practicar guitarra.',
    lang: 'es',
    start_url: BASE,
    scope: BASE,
    display: 'standalone',
    background_color: '#14130f',
    theme_color: '#b5541c',
    icons: [
      { src: archivo('iconos/icono-192.png'), sizes: '192x192', type: 'image/png' },
      { src: archivo('iconos/icono-512.png'), sizes: '512x512', type: 'image/png' },
      { src: archivo('iconos/icono-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifiesto, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
