import type { Traste } from './voicings.ts';
import { CUERDAS } from './voicings.ts';

// Diagrama de acorde vertical: cuerdas de 6ª (izquierda) a 1ª (derecha),
// trastes de arriba abajo. Cada nota lleva rotulado su grado.
// Genera SVG como texto para poder usarlo al compilar y en el navegador.
// Los colores salen de clases (.diagrama …) definidas en global.css.

const SEP_CUERDA = 30;
const ALTO_TRASTE = 38;
const MARGEN_IZQ = 34;
const MARGEN_SUP = 34;
const MARGEN_DER = 16;
const MARGEN_INF = 12;
const RADIO = 13;

export interface DatosDiagrama {
  trastes: readonly Traste[];
  grados: readonly string[];
  /** Mínimo de trastes dibujados. */
  trastesVisibles?: number;
}

/** Primer traste dibujado: 1 (con cejuela) si el acorde cabe en los 4 primeros. */
export function trasteInicial(trastes: readonly Traste[], visibles = 4): number {
  const pisados = trastes.filter((t): t is number => t !== 'x' && t > 0);
  if (pisados.length === 0) return 1;
  const max = Math.max(...pisados);
  return max <= visibles ? 1 : Math.min(...pisados);
}

export function diagramaSVG({ trastes, grados, trastesVisibles = 4 }: DatosDiagrama): string {
  const inicio = trasteInicial(trastes, trastesVisibles);
  const pisados = trastes.filter((t): t is number => t !== 'x' && t > 0);
  const filas = Math.max(trastesVisibles, pisados.length ? Math.max(...pisados) - inicio + 1 : 0);

  const ancho = MARGEN_IZQ + SEP_CUERDA * 5 + MARGEN_DER;
  const alto = MARGEN_SUP + ALTO_TRASTE * filas + MARGEN_INF;
  const x = (cuerda: number) => MARGEN_IZQ + SEP_CUERDA * cuerda;
  const y = (fila: number) => MARGEN_SUP + ALTO_TRASTE * fila;
  const fin = x(5);

  const partes: string[] = [];

  // Trastes (líneas horizontales) y cejuela si empieza en el 1.
  for (let f = 0; f <= filas; f++) {
    partes.push(`<line class="traste" x1="${x(0)}" y1="${y(f)}" x2="${fin}" y2="${y(f)}"/>`);
  }
  if (inicio === 1) {
    partes.push(`<rect class="cejuela" x="${x(0) - 1}" y="${y(0) - 5}" width="${fin - x(0) + 2}" height="6"/>`);
  } else {
    partes.push(
      `<text class="num-traste" x="${x(0) - 12}" y="${y(0) + ALTO_TRASTE / 2}" text-anchor="end" dominant-baseline="central">${inicio}</text>`,
    );
  }
  // Cuerdas (líneas verticales).
  for (let c = 0; c < 6; c++) {
    partes.push(`<line class="cuerda" x1="${x(c)}" y1="${y(0)}" x2="${x(c)}" y2="${y(filas)}"/>`);
  }

  // Notas, cuerdas al aire y apagadas.
  const descripcion: string[] = [];
  trastes.forEach((t, c) => {
    const grado = grados[c] ?? '';
    const cx = x(c);
    if (t === 'x') {
      partes.push(`<text class="apagada" x="${cx}" y="${MARGEN_SUP - 14}" text-anchor="middle" dominant-baseline="central">×</text>`);
      descripcion.push(`${CUERDAS[c]} apagada`);
      return;
    }
    const raiz = grado === '1' ? ' raiz' : '';
    const tamano = grado.length > 2 ? ' largo' : '';
    if (t === 0) {
      partes.push(
        `<g class="nota al-aire${raiz}"><circle cx="${cx}" cy="${MARGEN_SUP - 16}" r="${RADIO - 2}"/>` +
          `<text class="grado${tamano}" x="${cx}" y="${MARGEN_SUP - 16}" text-anchor="middle" dominant-baseline="central">${grado}</text></g>`,
      );
      descripcion.push(`${CUERDAS[c]} al aire, ${grado}`);
      return;
    }
    const cy = y(t - inicio + 0.5);
    partes.push(
      `<g class="nota${raiz}"><circle cx="${cx}" cy="${cy}" r="${RADIO}"/>` +
        `<text class="grado${tamano}" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central">${grado}</text></g>`,
    );
    descripcion.push(`${CUERDAS[c]} traste ${t}, ${grado}`);
  });

  const etiqueta = descripcion.join('; ');
  return (
    `<svg class="diagrama" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${etiqueta}" xmlns="http://www.w3.org/2000/svg">` +
    partes.join('') +
    `</svg>`
  );
}
