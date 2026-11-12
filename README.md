# Práctica de guitarra

Web personal de práctica: intervalos (con entrenador de oído), escalas, acordes y repertorio.
Estática, pensada para el móvil y con modo sin conexión. La especificación está en `Guitarra practica spec.md`.

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
| Canciones | `src/content/repertorio/*.md` — copia `_plantilla.md` |

Si algo está mal escrito (un grado, una nota, un traste), `npm run build` falla y dice dónde.

## Publicar en GitHub Pages

Cada push a `main` ejecuta `.github/workflows/desplegar.yml`: pasa los tests y la comprobación
de tipos, compila con la base del repositorio (`/<repositorio>/`) y publica.

Configuración, una sola vez: en el repositorio, **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

GitHub Pages es **público**: cualquiera con la dirección puede entrar (las páginas llevan
`noindex` para que no aparezcan en buscadores, pero eso no es protección).

## Créditos

Samples de guitarra: FluidR3_GM, CC BY 3.0 — ver `public/samples/CREDITOS.md`.
