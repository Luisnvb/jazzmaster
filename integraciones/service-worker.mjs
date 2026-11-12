// Integración de Astro: al terminar la compilación genera dist/sw.js con la
// lista de todos los archivos del sitio para que funcione sin conexión.
// La versión de la caché es un hash del contenido: cada despliegue con cambios
// instala una caché nueva y borra la anterior.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

async function listar(dir) {
  const entradas = await readdir(dir, { withFileTypes: true });
  const archivos = await Promise.all(
    entradas.map((e) => (e.isDirectory() ? listar(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return archivos.flat();
}

/** Ruta de archivo → URL pública: "acordes/index.html" → "/acordes/". */
function aUrl(base, rutaRelativa) {
  const ruta = rutaRelativa.split(sep).join('/');
  const url = ruta === 'index.html' ? '' : ruta.replace(/(^|\/)index\.html$/, '$1');
  return base + url;
}

const codigoSW = (version, base, urls) => `// Generado al compilar por integraciones/service-worker.mjs. No editar.
const CACHE = 'practica-${version}';
const BASE = ${JSON.stringify(base)};
const ARCHIVOS = ${JSON.stringify(urls)};

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith('practica-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Primero la caché (el sitio entero está precargado); si falta algo, la red.
self.addEventListener('fetch', (e) => {
  const peticion = e.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin !== location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // ignoreSearch: /acordes?tonica=Bb usa la misma página que /acordes/.
    // ignoreVary: los scripts módulo llevan cabecera Origin y el servidor puede
    // responder con "Vary: Origin"; sin esto no coincidirían con la copia precargada.
    const opciones = { ignoreSearch: true, ignoreVary: true };
    let respuesta = await cache.match(peticion, opciones);
    if (!respuesta && !url.pathname.endsWith('/') && !/\\.[a-z0-9]+$/i.test(url.pathname)) {
      respuesta = await cache.match(url.pathname + '/', opciones);
    }
    if (respuesta) return respuesta;
    try {
      return await fetch(peticion);
    } catch (error) {
      if (peticion.mode === 'navigate') {
        const portada = await cache.match(BASE, { ignoreVary: true });
        if (portada) return portada;
      }
      throw error;
    }
  })());
});
`;

export default function serviceWorker() {
  let base = '/';
  return {
    name: 'service-worker',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const raiz = fileURLToPath(dir);
        const archivos = (await listar(raiz)).filter((f) => !/(^|[\\/])sw\.js$/.test(f) && !f.endsWith('.md')).sort();
        // El propio código del service worker también cuenta para la versión.
        const hash = createHash('sha256').update(codigoSW('', base, []));
        const urls = [];
        for (const f of archivos) {
          const rel = relative(raiz, f);
          hash.update(rel).update(await readFile(f));
          urls.push(aUrl(base, rel));
        }
        const version = hash.digest('hex').slice(0, 12);
        await writeFile(join(raiz, 'sw.js'), codigoSW(version, base, urls));
        logger.info(`sw.js: ${urls.length} archivos en caché (versión ${version})`);
      },
    },
  };
}
