// Manifiesto de la web instalable en español. Se genera al compilar para que las rutas
// lleven la base del sitio (en GitHub Pages, /<repositorio>/). El contenido, en
// i18n/manifiesto.ts (también el inglés: manifest.en.webmanifest.ts).
import { BASE } from '../lib/rutas.ts';
import { respuestaManifiesto } from '../i18n/manifiesto.ts';

export const GET = () => respuestaManifiesto('es', BASE);
