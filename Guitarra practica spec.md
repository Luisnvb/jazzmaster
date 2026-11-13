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

- **Portada:** solo da acceso a las secciones. Sin resumen ni panel de "hoy".
- **Repertorio**
- **Acordes**
- **Escalas**
- **Patrones**
- **Teoría** (sección múltiple): **Intervalos** y **Progresiones**. Para añadir más páginas, se suman a sus `partes` en `src/lib/secciones.ts`.

Navegación persistente entre secciones en una cabecera fija arriba.

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
- Enlaces cruzados, más adelante: desde un acorde del cifrado al voicing correspondiente y a las escalas de su grupo.

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
- Diseño inspirado en The Verge en versión clara: fondo blanco, titulares condensados (Anton) de tamaño contenido, texto en Space Grotesk, etiquetas en JetBrains Mono y acento violeta. Fuentes alojadas en el sitio (fontsource) para funcionar sin conexión.

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

## 10 ter. Tareas pendientes (segunda iteración)

- [x] **Estilo claro:** fondo blanco, títulos más pequeños y secciones algo más compactas.
- [x] **Cifrado centrado** cuando el tema no tiene letra (una columna de hasta 80rem; enlaces y notas debajo).
- [x] **Sonido del cifrado:** selector de instrumento, con algún pad que suene de forma continua cuando el acorde se repite. Guitarra jazz (samples), piano eléctrico, órgano y pad sintetizados con Web Audio (`lib/audio.ts`); con órgano y pad los acordes se mantienen y las notas repetidas se ligan (`ligarRepetidos`). La elección se recuerda en el navegador.
- [ ] **Repertorio:** metrónomo opcional y selector de tempo.

## 11. Fuera de alcance
- Visualizador de escalas en el mástil.
- Estado de aprendizaje o seguimiento del repertorio.
- Resumen o panel de práctica en la portada.
- Reproducción de grabaciones de las canciones.