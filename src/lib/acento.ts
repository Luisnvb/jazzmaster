// Paleta del color de acento. En cada sesión (pestaña) se elige uno al azar,
// distinto del de la sesión anterior; lo aplica el script de Base.astro.
// Todos tienen contraste suficiente con el blanco, en texto y como fondo de botón.
export const PALETA_ACENTO = [
  '#5200ff', // violeta
  '#d4146b', // magenta
  '#0062e6', // azul
  '#00865a', // verde
  '#c2410c', // naranja
  '#0e7c86', // turquesa
] as const;
