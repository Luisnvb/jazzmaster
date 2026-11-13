# Práctica de guitarra

Web personal de práctica: repertorio, acordes, escalas, patrones y teoría (intervalos con entrenador de oído y progresiones).
Estática, pensada para un monitor de escritorio y con modo sin conexión. La especificación está en `Guitarra practica spec.md`.

## Uso en local

```sh
npm install
npm run dev        # http://localhost:4321
npm test           # tests de la lógica (teoría, secuencias, cifrado…)
npx astro check    # comprobación de tipos
npm run build      # web final en dist/
```

## Editar el contenido

Todo el contenido está en archivos de datos; no hace falta tocar el código.

| Qué | Dónde |
|---|---|
| Intervalos | `src/data/intervalos.yaml` |
| Escalas | `src/data/escalas.yaml` |
| Voicings | `src/data/acordes.yaml` (formato explicado al principio del archivo) |
| Tipos de acorde | `src/data/grupos.yaml` |
| Progresiones | `src/data/progresiones.yaml` (grados romanos; formato al principio del archivo) |
| Patrones de práctica | `src/data/patrones.yaml` (formato al principio del archivo) |
| Canciones | `src/content/repertorio/*.md` (ficha y letra) — copia `_plantilla.md` |
| Cifrados | `src/content/repertorio/<canción>.cmb.json` (formato del [Chord Melody Builder](https://www.noeljohnston.com/chord-melody-builder.html)) |

Si algo está mal escrito (un grado, una nota, un traste), `npm run build` falla y dice dónde.

### Editar desde la web

Acordes y Repertorio tienen un botón **Editar**. Lo editado se guarda en el navegador
(localStorage), así que solo existe en ese dispositivo hasta que se exporta:

- **Acordes → Exportar YAML** descarga la lista completa; sustituye con ella `src/data/acordes.yaml`.
- **Canción → Exportar .cmb.json** descarga el cifrado (con la ficha y la letra dentro, en el campo
  `practica`). Guárdalo como `src/content/repertorio/<canción>.cmb.json`. El mismo archivo se puede
  abrir en el Chord Melody Builder, y lo que se guarde allí se puede importar aquí.
- **Repertorio → + Canción nueva / Importar .cmb.json** crea canciones que viven solo en el navegador
  hasta que las pases al repositorio (un `.md` copiado de la plantilla y su `.cmb.json`).

En el cifrado, cada acorde se edita como en el Builder: raíz, calidad, nota de la melodía (▼▲) y forma
(◀▶, empezando por tus voicings de la sección Acordes), o trastes a mano. También secciones,
repeticiones, finales, cambios de compás y saltos de línea.

## Publicar en GitHub Pages

Cada push a `main` ejecuta `.github/workflows/desplegar.yml`: pasa los tests y la comprobación
de tipos, compila con la base del repositorio (`/<repositorio>/`) y publica.

Configuración, una sola vez: en el repositorio, **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

GitHub Pages es **público**: cualquiera con la dirección puede entrar (las páginas llevan
`noindex` para que no aparezcan en buscadores, pero eso no es protección).

## Créditos

Samples de guitarra: FluidR3_GM, CC BY 3.0 — ver `public/samples/CREDITOS.md`.
