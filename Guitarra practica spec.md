# Web personal de práctica de guitarra — Especificación

Documento de partida para desarrollar el proyecto en Claude Code. Recoge el planteamiento acordado y el contenido inicial.

---

## 1. Objetivo

Una web personal que reúna en un solo sitio el material de práctica. Se consulta durante la práctica, principalmente en un monitor de escritorio de 27".

**Principios**
- Pensada para escritorio (27"): aprovecha el ancho con rejillas de varias columnas; sigue siendo usable en pantallas pequeñas.
- Contenido separado del código: canciones, escalas, acordes e intervalos se guardan en archivos de datos fáciles de editar a mano. Añadir una canción o un voicing no exige tocar la lógica de la web.
- Web estática, sin servidor ni base de datos, y que funcione sin conexión una vez cargada.
- Uso personal y privado.

## 2. Convenciones globales

- **Idioma de la interfaz:** español.
- **Notación de notas y acordes:** anglosajona (C, D, E, F#, Bb… / Cmaj7, Dm7, G7, Bm7b5, C°7).
- **Instrumento:** guitarra eléctrica, afinación estándar (E A D G B E).
- **Sonido:** timbre de guitarra eléctrica de jazz en todos los ejemplos de audio.
- **Grados:** se escriben como en las fórmulas (1, b2, 2, #2, b3, 3, 4, #4, b5, 5, #5, b6, 6, b7, 7).

## 3. Estructura de la web

Reorganizada el 2026-11-15 (ver §10 sexies): seis secciones ordenadas por su peso en la rutina de práctica, cada una con su portada (`/secciones/<id>/`) y sus páginas. Las direcciones de las páginas no cambian: la sección solo decide dónde salen en el menú (`src/lib/secciones.ts`).

- **Portada:** panel de práctica: páginas favoritas, últimas abiertas y cada sección con sus páginas.
- **Rutina:** Rutina de práctica, Mástil por capas, Ritmo.
- **Repertorio:** Repertorio, Aprender un standard, Formas de los standards, Transcripción.
- **Acordes:** Voicings (`/acordes/`), Tríadas, Shell voicings, Drop 2, Drop 3, Cuartas, Ciclos de Goodrick, Comping, Chord melody.
- **Improvisación:** Diccionario de escalas (`/escalas/`), Escalas en el mástil, Arpegios, Modos, Patrones, Notas guía, Aproximaciones, Lenguaje bebop, Pentatónicas, Pares de tríadas, Disminuida y tonos enteros, Motivos, Fuera y dentro.
- **Armonía:** Progresiones, Armonía funcional, Blues, Rearmonización, Tensiones, Acordes slash, Cambios de Coltrane.
- **Oído y técnica:** Intervalos (con su entrenador), Oído armónico, Lectura a primera vista, Digitación y posiciones, Técnica de púa.

Navegación persistente en una cabecera fija arriba: un menú desplegable por sección, con las páginas favoritas primero. Cada página lleva una ☆ junto al título para marcarla como favorita (guardado en el navegador).

---

## 4. Sección Intervalos

### 4.1 Funcionalidad
- Una ficha por intervalo con nombre, número de semitonos, sensación o carácter y canciones de referencia ascendentes y descendentes.
- Botones de audio: **ascendente**, **descendente** y **armónico** (las dos notas a la vez).
- Selector de nota de partida para el audio (por defecto C).
- La forma del intervalo en el mástil es opcional y de baja prioridad.
- **Entrenador de oído:** suena un intervalo al azar (ascendente, descendente o armónico, configurable) y el usuario elige la respuesta. Se puede limitar a un subconjunto de intervalos. Muestra acierto o fallo y la canción de referencia como pista.
- No se reproducen las canciones, solo el intervalo. Las canciones son un recordatorio textual.

### 4.2 Contenido inicial

| Intervalo | Semitonos | Sensación / carácter | Ascendente | Descendente |
|---|---|---|---|---|
| 2ª menor | 1 | Cerrado, inquietante, tensión | Pantera Rosa · Tiburón · Ring theme | Para Elisa · Jurassic Park · Game of Thrones |
| 2ª mayor | 2 | Abierto, melancólico, paso suave | Cumpleaños Feliz · Do–Re (escala) | Yesterday · Frère Jacques |
| 3ª menor | 3 | Triste, íntima | Smoke on the Water · Greensleeves | Hey Jude · Losing My Religion |
| 3ª mayor | 4 | Alegre, luminosa | When the Saints Go Marching In | Bad Moon Rising · Cucurrucucú Paloma |
| 4ª justa | 5 | Solemne, llamada | We Wish You a Merry Christmas · Here Comes the Bride · La Marsellesa | Under Pressure (bajo) · Amazing Grace |
| 5ª disminuida (tritono) | 6 | Inestable, incómoda | The Simpsons · Maria (West Side Story) | Black Sabbath (riff inicial) |
| 5ª justa | 7 | Estable, épica | Twinkle Twinkle · Star Wars · Also sprach Zarathustra | Flintstones (inicio) |
| 5ª aumentada | 8 | Extraña, flotante | The Entertainer (3ª–4ª nota) · Baker Street | Blue in Green (Miles Davis – caída melódica) |
| 6ª mayor | 9 | Nostálgica, cálida | My Way · Es un muchacho excelente · Chopin Noct. nº2 | Nobody Knows the Trouble I've Seen |
| 7ª menor | 10 | Dramática, expansiva | The Winner Takes It All · Interstellar | Watermelon Man (head descendente) |
| 7ª mayor | 11 | Muy tensa, aspiracional | Don't Know Why · Take On Me (estribillo) | I Love You (Cole Porter) |
| 8ª justa | 12 | Resolución total | Somewhere Over the Rainbow | Do–Do (misma nota) |

### 4.3 Revisión (resuelto en fase 1, ver `src/data/intervalos.yaml`)
- **5ª aumentada / 6ª menor:** se muestra como "6ª menor (5ª aumentada)", grado b6.
- **8ª descendente:** se ha quitado "Do–Do" (era un unísono). Falta una referencia de octava descendente.
- **Frère Jacques** y **Amazing Grace** pasan a referencias **ascendentes** (2ª mayor y 4ª justa).
- Siguen marcadas para comprobar (campo `revisar`): "Ring theme", "Blue in Green" y "Watermelon Man".

---

## 5. Sección Escalas (diccionario)

### 5.1 Funcionalidad
- Escalas agrupadas por **tipo de acorde**: Maj7, m7, mMaj7, 7, 7 alterado, m7b5, °7.
- Cada escala muestra: nombre, fórmula en grados y las notas resultantes en la tónica elegida.
- **Selector de tónica** (C por defecto). Las notas se recalculan con la ortografía correcta (Bb y no A#, según la escala).
- Botones de audio:
  - **Escala** ascendente y descendente.
  - **Arpegio** del acorde de su grupo (p. ej. 1-3-5-7 en Maj7, 1-b3-5-b7 en m7). Opcionalmente, arpegios por terceras sobre cada grado de la escala.
- Control de tempo para la reproducción.
- **Sin visualizador de mástil.**
- Buscador por nombre.

### 5.2 Contenido inicial

**Maj7** — arpegio 1-3-5-7
- Jónico: 1 – 2 – 3 – 4 – 5 – 6 – 7
- Lidio: 1 – 2 – 3 – #4 – 5 – 6 – 7
- Lidio #2: 1 – #2 – 3 – #4 – 5 – 6 – 7
- Lidio aumentado: 1 – 2 – 3 – #4 – #5 – 6 – 7
- Pentatónica mayor: 1 – 2 – 3 – 5 – 6

**m7** — arpegio 1-b3-5-b7
- Dórico: 1 – 2 – b3 – 4 – 5 – 6 – b7
- Eólico: 1 – 2 – b3 – 4 – 5 – b6 – b7
- Pentatónica menor: 1 – b3 – 4 – 5 – b7
- Blues menor: 1 – b3 – 4 – b5 – 5 – b7
- Frigio: 1 – b2 – b3 – 4 – 5 – b6 – b7

**mMaj7** — arpegio 1-b3-5-7
- Menor melódica: 1 – 2 – b3 – 4 – 5 – 6 – 7
- Menor armónica: 1 – 2 – b3 – 4 – 5 – b6 – 7

**7 (dominante)** — arpegio 1-3-5-b7
- Mixolidio: 1 – 2 – 3 – 4 – 5 – 6 – b7
- Lidio dominante: 1 – 2 – 3 – #4 – 5 – 6 – b7
- Mixolidio b6: 1 – 2 – 3 – 4 – 5 – b6 – b7

**7 alterado** — arpegio 1-3-b7 (más tensiones)
- Superlocrio (alterada): 1 – b2 – #2 – 3 – b5 – #5 – b7
- Disminuida (T–S): 1 – 2 – b3 – 4 – b5 – #5 – 6 – 7  ⚠️ ver 5.3
- Tonos enteros: 1 – 2 – 3 – #4 – #5 – b7

**m7b5** — arpegio 1-b3-b5-b7
- Locrio: 1 – b2 – b3 – 4 – b5 – b6 – b7
- Locrio #2: 1 – 2 – b3 – 4 – b5 – b6 – b7

**°7** — arpegio 1-b3-b5-bb7
- Disminuida (S–T): 1 – b2 – #2 – 3 – #4 – 5 – 6 – b7  ⚠️ ver 5.3

### 5.3 Revisión (resuelto en fase 1)
- **Escalas disminuidas intercambiadas de grupo:** la **S–T** (1 b2 #2 3 #4 5 6 b7) está en **7 alterado** y la **T–S** (1 2 b3 4 b5 #5 6 7) en **°7**. Las listas de 5.2 conservan el reparto original; los datos (`src/data/escalas.yaml`) ya tienen el correcto.
- En °7 el séptimo grado del acorde se escribe **bb7** y la nota se calcula con doble bemol (C°7 → Bbb).

---

## 6. Sección Acordes (selección personal de voicings)

### 6.1 Funcionalidad
- Agrupados por los mismos tipos que las escalas: **Maj7, m7, mMaj7, 7, 7 alterado, m7b5, °7** (más los que hagan falta, p. ej. 6, m6, 7sus4, 9, 13).
- Cada voicing se muestra como **diagrama de acorde** (vertical, 6 cuerdas):
  - Traste inicial.
  - Cuerdas tocadas, al aire o apagadas (x).
  - **Cada nota rotulada con su grado** (1, 3, 5, b7, 9…) en vez de con el número de dedo.
- Datos de cada voicing: nombre o tipo, cuerda donde está el bajo (6ª, 5ª o 4ª), grados de grave a agudo y notas personales opcionales.
- Selector de tónica para transportar el voicing (mismo dibujo, otro traste) y botón de audio (rasgueo o arpegiado).


### 6.2 Modelo de datos (orientativo, por voicing)
- id, tipo (grupo), nombre visible
- trastes por cuerda, de 6ª a 1ª, relativos a la tónica de referencia (x = apagada)
- grado por cuerda (vacío si está apagada)
- dedos por cuerda (opcional)
- notas (texto libre)

---

## 7. Sección Repertorio

### 7.1 Funcionalidad
- Lista de canciones con buscador.
- Ficha por canción:
  - Título, autor o compositor
  - Tonalidad, tempo (BPM), compás
  - Estructura (p. ej. AABA, 32 compases, blues de 12…)
  - Cifrado de acordes por secciones, en notación anglosajona
  - **Letra** (en las instrumentales, el campo queda vacío y no se muestra)
  - Enlaces: grabación de referencia y partitura o tablatura
  - Notas personales de práctica
- **Sin estado de aprendizaje.**
- Enlaces cruzados: al pulsar un acorde del cifrado se abre un menú para escucharlo e ir a los voicings de su grupo (en Acordes) y a sus escalas (en Escalas), ya en la tónica del acorde y filtrados por ese grupo.

### 7.2 Contenido inicial

| Canción | Autor  | Letra |
|---|---|---|
| Temptation | Tom Waits | Sí |
| Turnaround | Ornette Coleman | Instrumental |
| Cantaloupe Island | Herbie Hancock | Instrumental |
| I'll See You in My Dreams | Isham Jones | Sí |
| Stella By Starlight | Victor Young | Sí |
| Are You Going With Me? | Pat Metheny | Instrumental |
| How Insensitive | Antônio Carlos Jobim | Sí |
| Black Hole Sun | Soundgarden | Sí |
| Exit Music (For a Film) | Radiohead | Sí |
| Days of Wine and Roses | Henry Mancini | Sí |
| E.S.P. | Wayne Shorter | Instrumental |
| Footprints | Wayne Shorter | Instrumental |


### 7.3 Formato del contenido
Se propone **un archivo Markdown por canción**: los metadatos y el cifrado van en la cabecera (frontmatter) y la letra en el cuerpo. Es lo más cómodo para editar a mano.

---

## 8. Audio

- Reproducción en el navegador (Web Audio).
- Timbre de **guitarra eléctrica de jazz** mediante samples. Por ejemplo, el instrumento General MIDI "Electric Guitar (jazz)" de un soundfont libre, cargado con una librería ligera de reproducción de samples. Verificar la licencia del soundfont elegido.
- Rango de notas realista para la guitarra en afinación estándar (E2–E6 aprox.). Los ejemplos se transponen de octava para no salirse de ese rango.
- Samples cacheados para que funcione sin conexión.
- Controles comunes: tempo y nota de partida o tónica.

## 9. Técnica (propuesta)

- Sitio estático. Propuesta: **Astro** con colecciones de contenido (Markdown/YAML) y pequeños scripts en el cliente para el audio y el entrenador. También vale Vite y TypeScript sin framework si se prefiere aún más simple.
- Contenido en una carpeta de datos, separada de los componentes:
  - intervalos (YAML/JSON)
  - escalas (YAML/JSON)
  - acordes (YAML/JSON)
  - repertorio (un .md por canción)
- Un módulo de teoría compartido que, a partir de una tónica y una fórmula de grados, calcule las notas con la ortografía correcta. Lo usan escalas, arpegios, acordes e intervalos.
- PWA con service worker para funcionar sin conexión.
- Despliegue gratuito (GitHub Pages, Netlify o Cloudflare Pages), con acceso privado si se quiere.
- Diseño inspirado en The Verge en versión clara: fondo blanco, titulares condensados (Anton) de tamaño contenido, texto en Space Grotesk, etiquetas en JetBrains Mono y un único esquema de color fijo (acento verde azulado #3f7a85; variables comentadas en `src/styles/global.css`). Fuentes alojadas en el sitio (fontsource) para funcionar sin conexión.

## 10. Fases

1. **Base y contenido:** estructura del proyecto, modelos de datos y carga del contenido de este documento.
2. **Consulta:** las cuatro secciones navegables, el diagrama de acordes con grados y la ficha de canción con cifrado y letra.
3. **Audio:** intervalos (ascendente, descendente y armónico), escalas y arpegios con selector de tónica y tempo, y audio de los voicings.
4. **Extras:** entrenador de oído de intervalos, enlaces cruzados entre repertorio, acordes y escalas, y modo sin conexión.

## 10 bis. Tareas pendientes (iteración 2026-11-13)

Se hacen en este orden. Marcar `[x]` al terminar.

- [x] **Letras:** incorporar al repertorio las letras de `lyrics.txt` (raíz del proyecto).
- [x] **Wayne Shorter:** añadir al repertorio *Infant Eyes* y *Footprints* (Footprints ya tenía ficha: se completan compás, tonalidad y estructura; se crea *Infant Eyes*).
- [x] **Cifrados:** incorporar los `.cmb.json` de la raíz para completar el repertorio (hasta ahora solo había el de *How Insensitive*). Movidos a `src/content/repertorio/<id>.cmb.json`; el compás de la ficha, si falta en el .md, se toma del cifrado.
- [x] **Escritorio en vez de móvil:** se rectifica el principio "pensada primero para móvil" (§1). El uso principal será un monitor de escritorio de 27". Optimizar para ese formato y rehacer los estilos inspirándose en [The Verge](https://www.theverge.com/).
- [x] **Navegación arriba:** mover los enlaces de secciones a la parte superior (sustituye a la barra inferior de §3).
- [x] **Acordes:** quitar la ayuda "Los grados se rellenan solos al elegir un traste; puedes cambiar la ortografía (p. ej. #9 en vez de b3)."
- [x] **Escalas/Acordes:** completar la frase "Dominante alterado (más tensiones b9, …". Se cortaba porque en YAML " #" abre un comentario; ahora va entre comillas.
- [x] **Repertorio:** botón para detener la reproducción.
- [x] **Todas las secciones:** botón para eliminar un registro. La web es estática: en Escalas, Intervalos y canciones del repositorio, «Eliminar» oculta el registro en este navegador (`lib/eliminados.ts`, se deshace con «Restaurar eliminados»); en Acordes y canciones creadas en el navegador se borra de verdad. Para quitarlo del repositorio, bórralo del archivo de datos.
- [x] **Repertorio:** marcar el acorde que suena durante la reproducción, sin desplazamiento automático.
- [x] **Acordes:** añadir grupos Sus y Aug. Grupos `sus` (7sus4: 1 4 5 b7) y `aug` (+: 1 3 #5) en `grupos.yaml`, con escalas (Mixolidio; Tonos enteros, Lidio aumentado) y un voicing de ejemplo cada uno. En los cifrados, un dominante con 4 y sin 3 enlaza a Sus y un mayor con #5 sin 5 a Aug (se escribe C+).
- [x] **Progresiones (sección nueva):** progresiones básicas del jazz y un editor. Datos en `src/data/progresiones.yaml` (grados romanos, p. ej. `IIm7 V7 | Imaj7`), lógica en `lib/progresiones.ts`. La página transporta a la tónica elegida, toca con marca del acorde que suena y permite crear, editar, duplicar, eliminar y exportar a YAML (cambios guardados en el navegador, como en Acordes).
- [x] **Patrones (sección nueva):** patrones básicos para practicar escalas y arpegios. Datos en `src/data/patrones.yaml` (una «célula» de posiciones que se repite desde cada nota, con aproximaciones cromáticas `0-`/`0+`), lógica en `lib/patrones.ts`. Se elige escala y arpegio; suena en corcheas, sube y baja, con marca del grupo que suena.
- [x] **Orden de secciones:** invertir el orden (Repertorio, Acordes, Escalas, …) y agrupar Intervalos y Progresiones en una sección múltiple ampliable. Orden: Repertorio, Acordes, Escalas, Patrones y Teoría (desplegable en la cabecera, página propia en `/teoria/` y barra con sus partes). Las direcciones de Intervalos y Progresiones no cambian.
- [x] **Secciones al mismo nivel (2026-11-14):** Intervalos y Progresiones salen de Teoría (que desaparece) y quedan como secciones propias: Repertorio, Acordes, Escalas, Patrones, Intervalos y Progresiones. En pantallas estrechas la navegación es un desplegable.
- [x] **Favoritos:** estrella en voicings y canciones (guardada en el navegador); los favoritos salen primero. **Cuerda de la tónica:** en Acordes, cada tipo tiene un selector para ver solo los voicings con la tónica más grave en una cuerda. **Timbres sostenidos:** órgano jazz, armonio, cuerdas, coro, flauta y pad cálido.

## 10 ter. Tareas pendientes (segunda iteración)

- [x] **Estilo claro:** fondo blanco, títulos más pequeños y secciones algo más compactas.
- [x] **Cifrado centrado** cuando el tema no tiene letra (una columna de hasta 80rem; enlaces y notas debajo).
- [x] **Sonido del cifrado:** selector de instrumento, con algún pad que suene de forma continua cuando el acorde se repite. Guitarra jazz (samples), piano eléctrico, órgano y pad sintetizados con Web Audio (`lib/audio.ts`); con órgano y pad los acordes se mantienen y las notas repetidas se ligan (`ligarRepetidos`). La elección se recuerda en el navegador.
- [x] ~~**Color de acento por sesión**~~ sustituido (2026-11-14) por un **esquema de color único**: fondo blanco, superficies #f6f6f4, bordes #dcdcd8 y acento #3f7a85. Todos los colores están en las variables de `:root` de `src/styles/global.css`, cada una con un comentario `COLOR:` que dice dónde se usa.
- [x] **Indicador del acorde que suena atenuado** (fondo translúcido del acento y borde) para que el acorde y su diagrama se lean bien; igual en Progresiones y Patrones.
- [x] **Bucle en Repertorio y Patrones:** botón «⟲ Bucle»; al acabar, la siguiente vuelta se programa a tiempo y sin cortar lo que suena (`tocar` con `duracion` y `encadenar` en `lib/audio.ts`). Detener lo corta.
- [x] **Progresiones: «∞ Continuo»** en cada progresión: se repite sin parar hasta pulsar Detener.
- [x] **Patrones: «∞ Continuo»** en cada patrón: se repite sin parar hasta pulsar Detener, aunque el bucle general esté apagado.
- [x] **Tempo en la barra de tónica** en Escalas, Acordes, Patrones y Progresiones; en Patrones y Progresiones también el metrónomo y el bucle, de modo que todos los controles de audio quedan en la barra fija.
- [x] **Escalas: «∞ Continuo»** en cada escala: sube y baja sin parar (sin repetir los extremos) hasta pulsar Detener (`secuenciaEscalaContinua`).
- [x] **Acordes: «∞ Continuo»** en cada voicing: suena hasta pulsar Detener. Con órgano y pad, una sola nota sostenida; con guitarra y piano, un rasgueo por compás en bucle al tempo elegido (`secuenciaVoicingContinua`).
- [x] **Patrones:** el selector de sonido pasa a la barra de tónica.
- [x] **Acordes:** selector de sonido en la barra de tónica (rasgueo y arpegiado de cada voicing).
- [x] **Escalas:** selector de sonido en la barra de tónica, junto al de arpegio (escalas, arpegios y arpegios por grado).
- [x] **Intervalos:** selector de sonido en la barra de tónica (lo comparte el entrenador de oído, en Ajustes).
- [x] **Selector de arpegio en la barra de tónica:** en Escalas y Acordes filtra por tipo de acorde («Todos» por defecto; un enlace a #grupo-… lo abre en ese grupo); en Patrones, los selectores de escala y arpegio pasan a esa barra. En Intervalos y Progresiones no se pone porque no hay un tipo de acorde que elegir.
- [x] **Progresiones:** selector de sonido, metrónomo y bucle, como en Patrones (con órgano y pad, los acordes repetidos se ligan).
- [x] **Patrones:** selector de sonido y metrónomo (un clic por pulso, acentuado cada cuatro), recordados en el navegador.
- [x] **Acordes del repertorio:** los voicings de los cifrados se añaden a `acordes.yaml` (24, sin repetir dibujos; en las notas, las canciones donde salen). Para canciones nuevas: `npm run voicings-repertorio` (solo añade los que faltan).
- [x] **Acordes:** cambiar de posición los voicings dentro de su grupo (◀ ▶ en modo edición). El orden se guarda en el navegador y sale en «Exportar YAML».
- [x] **Repertorio:** metrónomo opcional y selector de tempo. Tempo de 40 a 320 BPM (por defecto el de la ficha, con «↺ Original» para volver; no modifica la canción). El metrónomo marca cada pulso, con la primera parte del compás acentuada, y se recuerda en el navegador.

## 10 quater. Comprobaciones en el móvil (hechas, 2026-11-15)

Revisión a 390 px de ancho (marco en Chrome, no en un teléfono real). Ya revisadas y arregladas: portada, Repertorio (lista y las 14 fichas, con y sin diagramas, reproducción y panel de edición), Acordes, Patrones, Intervalos y su entrenador, Progresiones, y en Estudio: Escalas, Arpegios, Pares de tríadas, Disminuida y tonos enteros y Oído armónico. Quedan:

- [x] **Escalas (diccionario, `/escalas/`):** revisada (2026-11-15), también con tónica F# y las escalas de 8 notas; sin cambios.
- [x] **Estudio, páginas sin revisar:** revisadas las catorce (2026-11-15), con los casos extremos (Ritmo en semicorcheas y 4 compases; Armonía y Rearmonización con el Bird blues). Ninguna desborda la página; Blues y Tensiones ya tenían tablas deslizables. Arreglado: en Tríadas, Shell voicings, Drop 2 y Drop 3 los trastes y las notas de las tablas se partían en varias líneas; ahora los trastes van como código (`` `x x 10 9 8 x` ``) y las tablas que los llevan no parten celdas (`.texto-estudio table:has(td code)`, se deslizan en horizontal).
- [x] **Repertorio · canción nueva e importar:** probadas en el móvil (2026-11-15): canción nueva, formulario, «Crear cifrado», panel de edición e importación de un .cmb.json; sin cambios.
- [x] **Diálogos sin probar:** probados en el móvil (2026-11-15): «+ Nuevo voicing» y «+ Nueva progresión» caben enteros, con los botones al alcance; exportar e importar el YAML de Acordes funciona (son descarga y selector de archivos nativos, sin diálogo propio).
- [x] **Escritorio tras los cambios globales:** revisado a 2560 px (marco escalado, 2026-11-15): diagramas, cabecera y botones de audio bien. Arreglado: en las fichas con letra, la sección de improvisación se alinea con el cifrado en lugar de centrarse.
- [x] **Teléfono real:** probado en un móvil de verdad (2026-11-15), todo bien.
- [x] **Decisiones abiertas** (2026-11-15): el panel de edición de Repertorio mide como mucho el 65 % de la pantalla en el móvil y en pantallas de menos de 50rem de alto (80 % en el resto); la raíz ocupa un ancho fijo pequeño y la calidad el resto, así que «Semidisminuido» se lee entero.

## 10 quinquies. Nuevos temas de Estudio (pendientes, 2026-11-15)

Se hacen en este orden. Cada página: texto en `src/data/estudio/<id>.md`, página en `src/pages/estudio/`, lógica en `src/lib/` con sus tests y entrada en las `partes` de Estudio (`lib/secciones.ts`), en el grupo indicado (los dos últimos grupos son nuevos). Marcar `[x]` al terminar.

**Improvisación**

- [x] **Lenguaje bebop:** texto en `src/data/estudio/bebop.md` y generador de líneas (`lib/bebop.ts`) sobre cualquier progresión de la web: escalas bebop (dominante, mayor, menor, menor melódica, locria y disminuida, según el acorde), con cuatro recursos: escala bebop, frase tipo «de la 3 a la 9» (b9 en el dominante que resuelve), encierros encadenados y una mezcla de los tres. Las notas del acorde caen en los tiempos (en todos con la escala y la frase tipo; en el 1 y el 3 con los encierros), lo comprueban los tests. Corcheas con swing opcional, acorde de fondo, la nota que suena marcada y «↻ Otra línea».
- [x] **Motivos y desarrollo:** texto en `src/data/estudio/motivos.md` y editor (`lib/motivos.ts`): un motivo de 2 a 4 notas (grado de la escala, alteración, duración, silencio antes y comienzo en el compás), en cinco escalas y cualquier tónica, con cuatro motivos de partida. Diez transformaciones (repetición, secuencia, transposición real, inversión, retrogradación, desplazamiento, aumentación, disminución, fragmentación y ampliación), cada una en una tarjeta con el original y la transformación seguidos, un rollo de piano (`rolloSVG`) y audio; «Todas seguidas» las toca una tras otra marcando la tarjeta y la nota. Swing y acorde de la tónica de fondo opcionales.
- [x] **Pentatónicas en jazz:** texto en `src/data/estudio/pentatonicas.md` (con tabla en C y su uso en el ii–V–I) y ejemplo (`lib/pentatonicas.ts`): seis tipos de acorde (maj7, m7, 7, 7sus4, 7alt, m7b5) con dos o tres pentatónicas cada uno; de cada una, sus notas, la relativa, sus grados sobre el acorde (notas del acorde y tensiones) y cómo suena. La elegida, en el mapa del mástil con zonas (todo, posición, una o dos cuerdas) y audio en escala, grupos de 3 o de 4 o saltos de cuarta, con acorde de fondo. La raíz de la pentatónica se escribe como se piensa (E y no Fb sobre Bb7alt).
- [x] **Fuera y dentro (outside):** texto en `src/data/estudio/outside.md` y ejemplo (`lib/outside.ts`): una frase de cuatro compases sobre un vamp (m7, 7 o maj7) hecha con una célula (pentatónica, arpegio o escala), tocada toda dentro y con salida en el compás 2, para comparar. Cuatro técnicas: medio tono arriba, medio tono abajo, tritono y escalera cromática. Las notas fuera de la escala, marcadas; encima de cada compás, la tonalidad en la que se piensa, con la grafía de menos alteraciones (C#m7 y no Dbm7 sobre Cm7). Audio de cada versión, de las dos seguidas y en bucle, con el acorde de fondo dentro todo el rato.

**Armonía y acordes**

- [x] **Cuartas (quartal voicings):** texto en `src/data/estudio/cuartas.md` y ejemplo (`lib/cuartas.ts`), en el grupo Acordes: sobre un vamp dórico (m7), mixolidio sus (7sus4) o lidio (maj7#11), los voicings por cuartas de la escala (3 o 4 notas, o la estructura So What: tres cuartas justas y una 3ª mayor) en el grupo de cuerdas elegido, en escalera por el mástil, con diagramas rotulados con el grado sobre el acorde y el tipo de cada intervalo; opción de solo cuartas justas. Audio con la raíz como pedal: la escalera o «Vecinos» (el elegido y el de encima, como el «amén» de So What); al pulsar un voicing, suena.
- [x] **Acordes slash y estructuras superiores:** texto en `src/data/estudio/slash.md` y combinador (`lib/slash.ts`), en el grupo Armonía: una tríada (raíz como intervalo sobre el bajo; mayor, menor, disminuida, aumentada o sus4) sobre el bajo solo o sobre un acorde base (7, maj7 o m7, con raíz, 3 y 7). Un nombrador de acordes (`nombrarAcorde`) da el cifrado que suena (D/C → C6/9(#11) sin 3ª; Ab sobre C7 → C7(#9,b13)) o avisa de que es una inversión; los grados sobre el bajo distinguen los que pone la tríada. Audio de la base sola, con la tríada y arpegiado, y una lista de combinaciones útiles para cada base que se cargan y suenan al pulsarlas.
- [x] **Coltrane changes:** texto en `src/data/estudio/coltrane.md` y ejemplo (`lib/coltrane.ts`), en el grupo Armonía. Tres progresiones nuevas en `progresiones.yaml` (ciclo de terceras mayores, ii–V–I con cambios de Coltrane y Giant Steps), que también salen en Progresiones, Notas guía, Shells, Bebop y el resto. En cada acorde, su centro tonal (Imaj7, V7 o IIm7 de qué tonalidad) y cuánto salta el centro, las notas guía con su movimiento y un shell voicing; el ciclo de quintas con el triángulo de los tres centros y el que suena marcado. Audio de shells y de notas guía (con bajo opcional). Raíces con grafía de tonalidad (Bb7, no A#7) y notas del acorde sin grafías raras. El analizador de Armonía funcional reconoce ahora el IIImaj7 (centro a una 3ª mayor).

**Mano izquierda y técnica** (grupo nuevo)

- [x] **Chord melody:** texto en `src/data/estudio/chord-melody.md` y buscador (`lib/chordmelody.ts`), primera página del grupo nuevo «Mano izquierda y técnica». Eliges el acorde (raíz y una de nueve calidades) y la nota de melodía (las del acorde y sus tensiones, o cualquier otra), y busca todas las formas con esa nota en la voz más aguda (1ª, 2ª o 3ª cuerda): debajo, la 3 y la 7 siempre, notas distintas, apertura de 4 trastes como mucho y una cuerda saltada como máximo; opción de tensiones debajo y de solo 3 notas. Dice si la melodía es nota del acorde, tensión o choca; cada forma suena al pulsarla (acorde y luego la melodía sola) y «Todas seguidas» las recorre. De paso, los títulos de la portada de Estudio se parten con guion si no caben («Rearmoniza-ción»).
- [x] **Comping:** texto en `src/data/estudio/comping.md` y generador de acompañamiento (`lib/comping.ts`) sobre las progresiones de 4/4: siete células de un compás (negras, charlestón, charlestón invertido, 2 y 4, redonda, anticipación y síncopa), fijas o variadas por compases (frases de cuatro, con anticipación al final; «↻ Otra variación»), voicings drop 2 (con `dropProgresion`) o shells, y registro grave, medio, agudo o alternando cada cuatro compases. Las anticipaciones tocan el acorde siguiente (también a mitad de compás); todo acorde suena al menos una vez y ningún golpe pisa el cambio. Audio con swing, bajo a dos y charles en 2 y 4; se marcan el compás y el golpe que suenan.
- [x] **Digitación y posiciones:** texto en `src/data/estudio/digitacion.md` y comparador (`lib/digitacion.ts`): una escala (mayor, menor melódica o armónica) digitada dos veces, A y B, en mástiles del mismo largo. Cada una en posición fija (las 12 posiciones: índice en el traste 1–12, un dedo por traste, y las notas entre cuerdas con el meñique o el índice estirados, en la cuerda con menos notas) o con tres notas por cuerda (siete formas, una por grado en la 6ª, con dedos 1-2-4 o 1-3-4). Rótulos de dedo o grado; estiramientos y cambios de posición marcados y contados, con trastes, notas por cuerda y rango. Audio de cada una (sube y baja) y de las dos seguidas. `mastilSVG` admite ahora rótulo, atenuado y clase por nota, una zona de trastes y más de 15 trastes.
- [x] **Técnica de púa:** texto en `src/data/estudio/pua.md` y ejercicios (`lib/pua.ts`) en la tónica elegida: cromático 1-2-3-4, pentatónica menor de dos por cuerda, escala mayor en posición, escala mayor de tres por cuerda y arpegio menor barrido (con ligados). Tablatura con dos filas de golpes encima, alternada y economy/sweep (en color los que cambian), y el recuento de cambios de cuerda por dentro, por fuera y barridos de cada técnica. Notas por pulso (2, 3, 4 o 6), metrónomo y cuenta de cuatro; una vuelta, bucle o subida progresiva (sube N BPM cada tantas vueltas hasta un tope), con el tempo y la vuelta que suenan y la nota marcada.

**Oído y lectura** (grupo nuevo)

- [x] **Transcripción:** texto en `src/data/estudio/transcripcion.md` (página solo de texto), primera del grupo nuevo «Oído y lectura»: qué transcribir, herramientas (bajar la velocidad, bucles, octava, ecualizar, afinar al disco), el método paso a paso (escuchar, cantar, frase a frase, intervalos, ritmo aparte, tocar con el disco, digitación del original), las pistas que da la armonía, cómo sacar acompañamientos (bajo, forma, voz de arriba, cualidad, voicing, ritmo), qué hacer después, errores frecuentes y plan de práctica, con enlaces a las páginas de Estudio relacionadas.
- [x] **Lectura a primera vista:** texto en `src/data/estudio/lectura.md` y ejercicio (`lib/lectura.ts`): una nota en clave de sol (redonda, con líneas adicionales y ♯ o ♭; escrita una octava por encima de como suena) y se pulsa en el mástil dónde se toca. Vale cualquier cuerda en su octava (si es la misma nota en otra octava, lo dice); los fallos quedan marcados y, al acertar o con «No lo sé», salen todos sus sitios con el nombre. Zona: trastes 0–12, una posición o una cuerda; solo naturales, con sostenidos, con bemoles o con los dos. Suena al pulsar y con «Escuchar»; aciertos, racha y tiempo medio, y paso automático a la siguiente al acertar.

**Repertorio y forma** (grupo nuevo)

- [x] **Formas de los standards:** texto en `src/data/estudio/formas.md` y mapa de formas (`lib/estructuras.ts`), primera página del grupo nuevo «Repertorio y forma»: AABA, ABAC, blues, rhythm changes y otras formas. Cada ejemplo con sus secciones (letra, compases y papel) en una franja proporcional y el cifrado de cuatro en cuatro. Del Repertorio: Days of Wine and Roses (ABAC), Turnaround y Footprints (blues), Cantaloupe Island (16), E.S.P. (AA′) y Stella by Starlight (forma libre), con los acordes sacados del cifrado y pasados a grados (`compasesDeCifrado`), así que se transportan; al elegirlos se pasa a su tonalidad original. Sin tema AABA ni rhythm changes en el Repertorio: un modelo AABA y los rhythm changes de `progresiones.yaml`. Audio de la forma con metrónomo opcional, coros seguidos contados, «Ocultar acordes» y la sección y el compás que suenan («Coro 2 · A2 · compás 3 de 8»).
- [x] **Aprender un standard:** texto en `src/data/estudio/aprender-standard.md` (página solo de texto, en «Repertorio y forma»): escuchar antes de empezar y los cinco pasos en orden (melodía, forma, notas guía, shells e improvisación), cada uno con su «lo sabes cuando…», con Days of Wine and Roses de ejemplo y enlaces a las páginas de Estudio de cada paso. Un plan de varios días, errores frecuentes y una lista de comprobación.

## 10 sexies. Práctica diaria (2026-11-15)

Ideas para que la web sirva de rutina diaria y no solo de consulta. Marcar `[x]` al terminar.

**Hecho**

- [x] **Estudio · Mástil por capas:** texto en `src/data/estudio/capas.md` y ejemplo (`lib/capas.ts`), en el grupo Rutina; inspirado en *Guitar Burpees* de Noel Johnston. Un acorde (raíz y diez cualidades) en una de las cinco formas CAGED (zona de 6 trastes) o en todo el mástil, y siete capas sobre el mismo dibujo: raíz, tríadas cerradas, arpegio, tríadas abiertas, pentatónica, escala (con alternativas por cualidad) y el acorde de la forma (`acordeCaged`: la forma mayor con la 3, la 5 y la 7 de la cualidad). Las capas anteriores quedan atenuadas; las tríadas, unidas por una línea y filtrables por grupo de cuerdas; flechas del teclado, sorteo, grado o nota y audio de cada capa.
- [x] **Tríadas abiertas en 6-5-3, 5-4-2 y 4-3-1** (la cuerda saltada entre las dos voces de arriba), en Tríadas y en Mástil por capas.
- [x] **Acompañamiento mientras practicas:** componente `Acompanamiento.astro` y `lib/acompanamiento.ts`, en Mástil por capas, Escalas y Arpegios (Estudio). El acorde de la página en bucle de dos compases, en cuatro estilos (pedal, acorde, swing con bajo a dos y charlestón, bossa), con sonido propio y clic en 2 y 4 opcional. Mientras suena sigue al acorde, al estilo, al sonido y al tempo que se elijan (cambia en la vuelta siguiente; `conectarAcompanamiento` en `lib/cliente.ts`).
- [x] **Nueva estructura (2026-11-15):** las partes de Estudio y las secciones de consulta (Repertorio, Intervalos, Escalas, Acordes, Patrones, Progresiones) se reparten en seis secciones por su peso en la rutina: Rutina, Repertorio, Acordes, Improvisación, Armonía y Oído y técnica (§3). Se mantienen todas las direcciones; `/estudio/` lleva a la portada. Cada sección tiene portada (`/secciones/<id>/`). **Páginas favoritas:** ☆ junto al título de cada página; las favoritas salen las primeras en el menú y la portada de su sección (`lib/paginas-favoritas.ts`). **Portada como panel de práctica:** favoritas, últimas páginas abiertas y cada sección con sus páginas. El menú de cada sección es una lista simple (el panel de grupos de Estudio desaparece) y ya no hay barra de partes bajo la cabecera.
- [x] **Enlaces entre secciones:** `lib/enlaces.ts`. El menú de cada acorde del Repertorio lleva también a Mástil por capas y a Arpegios con ese acorde (el 7alt, con la escala alterada); Mástil por capas enlaza a Arpegio, Tríadas, Voicings y Escalas del acorde elegido. Mástil por capas lee `?tonica=&cualidad=&forma=&escala=` y Arpegios `?tonica=&cualidad=`.

**Pendiente** (por orden de prioridad)

- [ ] **«Hoy toca»:** en el panel de la portada, un bloque que monte la sesión del día a partir de la fecha: raíz, cualidad y forma para Mástil por capas, un ejercicio de oído y una canción del Repertorio. Las raíces rotan por el ciclo de cuartas (todas las tonalidades en 12 días, y todas las formas en 60), sin tener que decidir nada al sentarse.
- [ ] **Temporizador por bloques:** la «sesión tipo» de la Rutina (5 min de calentamiento, 15 de un ejercicio, 20 de una canción…) con cuenta atrás, aviso sonoro al cambiar de bloque y enlace a la página de cada bloque.
- [ ] **Diario de práctica:** botón «hecho» en cada ejercicio que anota fecha, tempo alcanzado y una nota opcional; historial, racha de días y evolución del tempo por ejercicio. Guardado en el navegador y exportable, como Acordes y Repertorio.
- [ ] **Modo examen en Mástil por capas:** el mástil sin notas y una pregunta («todas las b3 de la zona», «la tríada en 4-3-2»); se pulsa en el mástil y corrige al momento (como en Lectura a primera vista).
- [ ] **Repaso espaciado:** al acabar una combinación (p. ej. Bb7, forma de G) se marca fácil, regular o difícil, y el sorteo trae antes las difíciles y las que llevan más tiempo sin tocarse.
- [ ] **Grabarse y escucharse:** grabar con el micrófono (MediaRecorder) y reproducir al momento, en Transcripción y al improvisar sobre el acompañamiento. Sin servidor: la grabación se queda en el navegador o se descarga.
- [ ] **Progreso entre dispositivos:** exportar e importar de una vez todo lo guardado en el navegador (voicings, canciones, diario, favoritos, opciones), o sincronizarlo, para no perderlo al cambiar de ordenador o de móvil.
- [ ] **Más acompañamiento:** llevarlo a Modos, Pentatónicas en jazz y Pares de tríadas; vamps de dos acordes (ii–V, I–IV) y un estilo de walking bass.

## 11. Fuera de alcance
- Reproducción de grabaciones de las canciones.
- [x] **Progresiones clásicas e inversiones (2026-11-14):** cadencias, Pachelbel, andaluza, Folía, Romanesca, Monte y Fonte; tríadas ° y sus4; inversiones con barra y la nota del acorde en el bajo (I/3, I/5, V7/7), que se ven como C/E y suenan con esa nota en el bajo.
- [x] **Sección Estudio (2026-11-14):** sección múltiple para teoría, ideas y prácticas concretas. Primera parte: *Rutina de práctica* (texto en `src/data/estudio/rutina.md`), con dos bloques (A: una nota y una cualidad; B: repertorio en una posición), principios de Mick Goodrick (unitar, limitar el material, ciclos de conducción de voces) y un sorteo de nota, cualidad, posición, grupo de cuerdas, ciclo y canción.
- [x] **Estudio · Ciclos de Goodrick:** texto en `src/data/estudio/ciclos.md` y ejemplo interactivo (`lib/ciclos.ts`): tónica, ciclo 2–7, tríadas o cuatriadas, cerrada o drop 2; los acordes diatónicos con conducción de voces mínima, las notas comunes resaltadas y audio en bucle.
- [x] **Estudio · Notas guía:** texto en `src/data/estudio/notas-guia.md` y ejemplo interactivo (`lib/notas-guia.ts`) con cualquier progresión de la web: las líneas de 3 y 7 con el menor movimiento, empezando con la 7 o la 3 arriba, con o sin bajo, y audio en bucle.
- [x] **Estudio · Aproximaciones cromáticas:** texto en `src/data/estudio/aproximaciones.md` y ejemplo (`lib/aproximaciones.ts`) con diez patrones (cromática desde abajo/arriba, de la escala, dobles, encierros, triple); objetivos en las notas de un acorde o en la línea guía de una progresión; las aproximaciones en las últimas corcheas y el objetivo en el tiempo 1, con acorde de fondo opcional.
- [x] **Estudio · Shell voicings:** texto en `src/data/estudio/shells.md` y ejemplo (`lib/shells.ts`) con cualquier progresión: raíz + 3 + 7 con la raíz en 6ª o 5ª, elegidos para mover la mano lo mínimo (programación dinámica), con diagramas, tensión opcional (9, 13…), zona de inicio y audio. El cifrado 6/9 vuelve a leerse como cifrado y no como inversión.
- [x] **Estudio · Drop 2:** texto en `src/data/estudio/drop2.md` y ejemplo (`lib/drop2.ts`): las cuatro inversiones de un acorde en un grupo de cuerdas (4-3-2-1, 5-4-3-2, 6-5-4-3) o una progresión encadenada con la inversión más cercana, con diagramas y audio.
- [x] **Estudio · Drop 3:** texto en `src/data/estudio/drop3.md`; el ejemplo es común con Drop 2 (`components/EjemploDrop.astro`, `lib/drop.ts`): grupos 6-4-3-2 y 5-3-2-1, opción de usar los dos alternando y de llevar siempre la raíz en el bajo.
- [x] **Estudio · Tríadas:** texto en `src/data/estudio/triadas.md` y el ejemplo común (`EjemploDrop`, `lib/drop.ts`) con tríadas cerradas (6-5-4, 5-4-3, 4-3-2, 3-2-1) y abiertas (6-4-3, 5-3-2, 4-2-1): mayor, menor, disminuida, aumentada y sus4, en inversiones o en progresión; tabla de estructuras superiores.
- [x] **Estudio · Arpegios:** texto en `src/data/estudio/arpegios.md` y mapa del mástil en horizontal (`lib/arpegios.ts`, `mastilSVG`) con todas las notas del acorde y su grado; zonas: todo, posición de 5 trastes, una cuerda o dos cuerdas; audio del recorrido empezando por la 1, 3, 5 o 7, con la nota que suena marcada; tabla de arpegios sobre otros acordes.
- [x] **Estudio · Escalas:** texto en `src/data/estudio/escalas.md` y el mapa del mástil de Arpegios con las escalas de `escalas.yaml`: notas del acorde rellenas y el resto en blanco; zonas (todo, posición, una o dos cuerdas); recorridos por grados, en terceras y en grupos de 3 y 4; nota pedal opcional.
- [x] **Estudio · Pares de tríadas:** texto en `src/data/estudio/pares-triadas.md` y el mapa del mástil de Arpegios con diez pares (`lib/pares-triadas.ts`: lidio, jónico, dórico, eólico, mixolidio, lidio dominante, alterado, semitono-tono, tonos enteros, locrio #2), con la tríada A rellena y la B en blanco y grados sobre el acorde; zonas, línea alternada de tres en tres (sube, baja o A sube y B baja) o escala de seis notas, nota pedal y audio.
- [x] **Estudio · Disminuida y tonos enteros:** texto en `src/data/estudio/simetricas.md` y el mapa del mástil (`lib/simetricas.ts`) con la disminuida semitono-tono y tono-semitono y la de tonos enteros: la posición, el recuadro discontinuo donde se repite el mismo dibujo (3 trastes la disminuida, 2 la de tonos enteros; `mastilSVG` admite `ecos`), botones ◀ ▶ que mueven la posición ese trecho, los acordes que comparten la escala y un recorrido «Posición y su eco».
- [x] **Estudio · Oído armónico:** texto en `src/data/estudio/oido-armonico.md` y entrenador (`lib/oido-armonico.ts`) con tres juegos y marcador propio: cualidad de un acorde (tríadas y cuatriadas, en bloque y arpegiado), cadena desde el I con los grados de cada acorde (diatónicos y de fuera, de 3 a 6 acordes) y progresiones del catálogo. Tónica fija o al azar, sonido y tempo; los ajustes se recuerdan en el navegador.
- [x] **Repertorio:** panel de edición del acorde más grande (hasta el 80 % de la altura, diagrama y cifrado mayores; compacto en el móvil).
- [x] **Estudio · Modos:** texto en `src/data/estudio/modos.md` y ejemplo (`lib/modos.ts`) con los siete modos de la escala mayor, la menor melódica y la menor armónica, en vista paralela (misma tónica, de luminoso a oscuro) o relativa (mismas notas); nota característica resaltada, acorde típico y audio de cada modo sobre la tónica como pedal, o los siete seguidos.
- [x] **Estudio · Ritmo:** texto en `src/data/estudio/ritmo.md` y rejilla rítmica (`lib/ritmo.ts`): corcheas, tresillos o semicorcheas, de 1 a 4 compases, celdas que se activan con un clic; patrones (Freddie Green, charlestón, anticipaciones, claves de son y bossa, 3 sobre 4, shuffle, funk…), swing regulable, metrónomo en todos los pulsos, en 2 y 4 o solo en el 1, y golpes con un acorde de 13 sobre la tónica elegida.
- [x] **Estudio · Armonía funcional:** texto en `src/data/estudio/armonia.md`, tabla de funciones (T, SD, D) en mayor y menor, y analizador de progresiones (`lib/armonia.ts`) que reconoce dominantes secundarios, sustituto tritonal, intercambio modal y disminuidos de paso, con el modo detectado o elegido y audio. La barra de partes de Estudio pasa a una segunda fila cuando no cabe.
- [x] **Estudio · Rearmonización:** texto en `src/data/estudio/rearmonizacion.md` y laboratorio (`lib/rearmonizacion.ts`) con siete técnicas combinables (sustitución diatónica, intercambio modal, cadena de dominantes, dominantes o ii–V secundarios, sustitución tritonal, disminuidos de paso) sobre cualquier progresión; original y rearmonizada una encima de otra, con los cambios marcados y audio de las dos.
- [x] **Estudio por grupos:** las partes de Estudio se agrupan en Rutina, Armonía, Improvisación y Acordes (`grupo` en `lib/secciones.ts`): portada de Estudio con un bloque por grupo, menú desplegable en columnas, barra de partes con los grupos y abierto el de la página actual, y grupos en el selector del móvil.
- [x] **Estudio · Blues:** texto en `src/data/estudio/blues.md` y tabla compás a compás con las variantes básico, de jazz, Bird blues y menor (en `progresiones.yaml`, `lib/blues.ts`), una al lado de otra: función y papel de cada acorde con el analizador de Armonía funcional, cambios respecto al básico marcados, audio de cada una y enlace al analizador (`#progresion=<id>`). El analizador reconoce ahora ii–V secundarios, sustitutos tritonales secundarios y ii–V cromáticos.
- [x] **Estudio · Tensiones y avoid notes:** texto en `src/data/estudio/tensiones.md` y ejemplo (`lib/tensiones.ts`): las 12 notas sobre doce acordes (con su escala) con su papel (nota del acorde, tensión, alterada, a evitar, fuera), por qué, audio de cada nota sobre el acorde, de las 12, de las tensiones y de las avoid notes con su resolución; tabla de todos los acordes.
- [x] **Repertorio desde `repertorio/*.txt`:** cifrados (`.cmb.json`, con los trastes de cada acorde) para Black Hole Sun, Exit Music, Temptation y Are You Going With Me?, y ficha nueva de Pyramid Song; tonalidad, compás, estructura y notas en las fichas. El cifrado escribe ahora las tríadas sin 3 (E5, Bsus4, Bsus2) y, con `showBass`, el bajo (D/A, E9/G#).
