# JazzMaster

Web personal de práctica de guitarra de jazz. Documentación completa en `docs/` (empieza por `docs/00-resumen.md`).

## Arquitectura en breve

- **Sitio estático con Astro 7** (`astro.config.mjs` → `dist/`). No hay backend ni base de datos: el código de servidor corre solo al compilar.
- **Contenido** en archivos versionados: `src/data/*.yaml`, `src/data/estudio/*.md`, `src/content/repertorio/*.md` + `*.cmb.json`. Se valida con esquemas Zod en `src/content.config.ts`; un dato inválido rompe el build.
- **Rutas**: `src/pages/` (una URL por archivo). Layout único: `src/layouts/Base.astro`. Menú y secciones: `src/lib/secciones.ts`. Todo enlace interno con `ruta()`/`archivo()` de `src/lib/rutas.ts` (la web vive en `/jazzmaster/` en GitHub Pages).
- **Lógica** en `src/lib/*.ts`: los módulos de dominio son funciones puras sin DOM, con su `*.test.ts` (`node:test`). No deben importar nada que use `import.meta.env` ni el navegador. Lo del navegador va en `cliente.ts`, `audio.ts`, `ficha-cancion.ts`… o en el `<script>` de cada página.
- **Idiomas**: español en la raíz e inglés bajo `/en/` (de momento, interfaz y Herramientas). Cada herramienta es un componente con `idioma` (`src/components/herramientas/`) que usan su página española y la inglesa; los textos van en diccionarios tipados de `src/i18n/` (`textos(es, en)`, `formatear`). Los scripts leen el idioma de `<html lang>`. Ver `docs/decisiones/0011`.
- **Interacción** sin framework de UI: `<script>` por página, enganches `data-*`, datos del build como JSON en `<script type="application/json">`, HTML generado escapando con `esc()`.
- **Datos del usuario** en el navegador: localStorage vía `src/lib/almacen.ts` (claves `<sección>:<qué>`) e IndexedDB para los archivos de Apuntes (`src/lib/apuntes.ts`). Se llevan al repo exportando a archivo. Sin migraciones: el código debe tolerar datos antiguos.
- **Diseño**: variables en `:root` de `src/styles/global.css` (`--tarjeta`, `--radio-tarjeta`, `--ancho-texto`…).
- **Sin conexión**: `integraciones/service-worker.mjs` genera `dist/sw.js` al compilar.
- **Despliegue**: cada push a `main` → `.github/workflows/desplegar.yml` (tests, `astro check`, build, GitHub Pages).

## Comandos

```sh
npm run dev        # http://localhost:4321
npm test           # tests de src/lib
npx astro check    # tipos
npm run build      # dist/
```

Antes de hacer commit: `npm test && npx astro check && npm run build`.

## Mantenimiento de la documentación

Cuando un cambio afecte a la arquitectura, el stack, la BD o un flujo documentado, actualiza el archivo de docs/ correspondiente en el mismo commit.

(En este proyecto "la BD" es el almacenamiento: los esquemas de `src/content.config.ts` y las claves de localStorage/IndexedDB, documentados en `docs/05-almacenamiento.md`. Una decisión de arquitectura nueva lleva su ADR en `docs/decisiones/`.)

Nota: `docs/` está excluido de Git en local (`.git/info/exclude`) por decisión del autor, así que solo existe en su equipo; "en el mismo commit" significa, en la práctica, "en el mismo cambio". Si `docs/` no existe (por ejemplo, en un clon nuevo), no hay nada que actualizar.
