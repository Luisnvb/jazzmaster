// Manifest of the installable site in English (i18n/manifiesto.ts); Base.astro links it
// from the /en/ pages.
import { BASE } from '../lib/rutas.ts';
import { respuestaManifiesto } from '../i18n/manifiesto.ts';

export const GET = () => respuestaManifiesto('en', BASE);
