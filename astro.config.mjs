// @ts-check
import { defineConfig } from 'astro/config';
import serviceWorker from './integraciones/service-worker.mjs';

export default defineConfig({
  integrations: [serviceWorker()],
});
