// @ts-check
import { defineConfig } from 'astro/config';
import serviceWorker from './integraciones/service-worker.mjs';

// En GitHub Pages el flujo de despliegue (.github/workflows/desplegar.yml) pasa
// la URL y la base del sitio (p. ej. https://usuario.github.io y /practica-guitarra).
// En local no hacen falta: la web vive en la raíz.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  integrations: [serviceWorker()],
});
