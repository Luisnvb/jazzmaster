---
# Plantilla de canción. Los archivos que empiezan por _ no se cargan en la web.
# Copia este archivo con otro nombre (será la URL: mi-cancion.md → /repertorio/mi-cancion).
titulo: Título
autor: Autor o compositor
instrumental: false        # true → no se muestra la letra
tonalidad: F               # notación anglosajona: C, Bb, F#m…
tempo: 120                 # BPM
compas: 4/4
estructura: AABA, 32 compases
estilo: Swing
# El cifrado va aparte, en mi-cancion.cmb.json (formato del Chord Melody Builder,
# https://www.noeljohnston.com/chord-melody-builder.html). Se puede crear y editar
# desde la propia ficha (botón Editar) y exportarlo con ese nombre.
enlaces:
  grabacion: https://…
  partitura: https://…
notas: |
  Notas personales de práctica.
# Ayudas para improvisar (opcional; se ve debajo del cifrado). Las escalas son ids de
# src/data/escalas.yaml en la tónica del acorde ("dorico") o desde otra nota
# ("A pentatonica-menor"). En los textos se puede usar **negrita**.
improvisacion:
  enfoque: Idea general del tema para improvisar.
  tramos:
    - compases: c. 1–4
      acorde: Fm7
      escalas: [dorico, pentatonica-menor]
      guia: "**Ab** (b3) · **Eb** (b7)"
      consejo: >-
        Qué tener en cuenta en este tramo.
  estrategias:
    - titulo: Nombre de la estrategia
      texto: Explicación.
  ejercicios:
    - Ejercicio concreto para practicar.
  estudio: [notas-guia]     # páginas de Estudio relacionadas
---

Aquí va la letra (déjalo vacío en las instrumentales).
