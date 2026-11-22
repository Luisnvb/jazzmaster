// Lectura a primera vista: una nota en el pentagrama (clave de sol, escrita una
// octava por encima de como suena, como se escribe para guitarra) y dónde está en
// el mástil. Generador de notas por zona y alteraciones, corrección y dibujo del
// pentagrama en SVG. Funciones puras, sin DOM.
import { enZona, TRASTES, type Zona } from './arpegios.ts';
import { AFINACION } from './secuencias.ts';

const mod = (n: number, m = 12) => ((n % m) + m) % m;
const LETRAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
type Letra = (typeof LETRAS)[number];
const PC_LETRA: Record<Letra, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export type Alteraciones = 'naturales' | 'sostenidos' | 'bemoles' | 'todas';

export const ALTERACIONES: Record<Alteraciones, string> = {
  naturales: 'Solo naturales',
  sostenidos: 'Con sostenidos',
  bemoles: 'Con bemoles',
  todas: 'Sostenidos y bemoles',
};

export interface NotaLeida {
  letra: Letra;
  alteracion: '' | '#' | 'b';
  /** Octava escrita (en el pentagrama). */
  octava: number;
  /** Altura que suena (una octava por debajo de la escrita). */
  midi: number;
}

/** Nombre escrito con octava, p. ej. «F#4». */
export const nombreEscrito = (n: NotaLeida) => `${n.letra}${n.alteracion}${n.octava}`;
/** Nombre de lo que suena, p. ej. «F#3». */
export const nombreSonoro = (n: NotaLeida) => `${n.letra}${n.alteracion}${n.octava - 1}`;

/** Escalón del pentagrama: 0 = 1ª línea (E4), 1 = 1er espacio (F4)… 8 = 5ª línea (F5). */
export const escalon = (n: NotaLeida) => n.octava * 7 + LETRAS.indexOf(n.letra) - (4 * 7 + 2);

/** Escribe una altura que suena con la grafía pedida (natural si lo es). */
export function escribir(midi: number, grafia: '#' | 'b'): NotaLeida {
  const pc = mod(midi);
  let letra = LETRAS.find((l) => PC_LETRA[l] === pc);
  let alteracion: NotaLeida['alteracion'] = '';
  if (!letra) {
    alteracion = grafia;
    letra = LETRAS.find((l) => PC_LETRA[l] === mod(pc + (grafia === '#' ? -1 : 1)))!;
  }
  const natural = midi + 12 - (alteracion === '#' ? 1 : alteracion === 'b' ? -1 : 0);
  return { letra, alteracion, octava: Math.floor(natural / 12) - 1, midi };
}

/** Todas las posiciones de una altura en el mástil (trastes 0–15), de grave a agudo en cuerda. */
export function posiciones(midi: number): { cuerda: number; traste: number }[] {
  const res: { cuerda: number; traste: number }[] = [];
  for (let c = 0; c < 6; c++) {
    const t = midi - AFINACION[c];
    if (t >= 0 && t <= TRASTES) res.push({ cuerda: c, traste: t });
  }
  return res;
}

/** Alturas que se pueden tocar dentro de la zona. */
export function alturasEnZona(zona: Zona): number[] {
  const set = new Set<number>();
  for (let c = 0; c < 6; c++) {
    for (let t = 0; t <= TRASTES; t++) {
      const midi = AFINACION[c] + t;
      if (enZona({ cuerda: c, traste: t, midi, grado: '', nota: '' }, zona)) set.add(midi);
    }
  }
  return [...set].sort((a, b) => a - b);
}

const esNatural = (midi: number) => LETRAS.some((l) => PC_LETRA[l] === mod(midi));

/**
 * Nota nueva para leer: una altura al azar de la zona (sin repetir la anterior),
 * con las alteraciones pedidas; las notas alteradas se escriben con # o b según
 * la opción (con «todas», a suertes).
 */
export function nuevaNota(zona: Zona, alteraciones: Alteraciones, anterior?: NotaLeida | null, azar = Math.random): NotaLeida {
  let alturas = alturasEnZona(zona);
  if (alteraciones === 'naturales') alturas = alturas.filter(esNatural);
  const sinRepetir = alturas.filter((m) => m !== anterior?.midi);
  const lista = sinRepetir.length ? sinRepetir : alturas;
  const midi = lista[Math.floor(azar() * lista.length)];
  const grafia = alteraciones === 'bemoles' ? 'b' : alteraciones === 'todas' && azar() < 0.5 ? 'b' : '#';
  return escribir(midi, grafia);
}

export type Correccion = 'acierto' | 'octava' | 'fallo';

/** Si la posición pulsada es la nota: la misma altura, la misma nota en otra octava o otra. */
export function corregir(n: NotaLeida, cuerda: number, traste: number): Correccion {
  const m = AFINACION[cuerda] + traste;
  return m === n.midi ? 'acierto' : mod(m) === mod(n.midi) ? 'octava' : 'fallo';
}

// --- Pentagrama ---------------------------------------------------------------------------

const ANCHO = 220;
const ALTO = 184;
const SEP = 12;
/** y de la 1ª línea (E4). */
const Y_BASE = 120;
const X_NOTA = 140;

const yEscalon = (e: number) => Y_BASE - (e * SEP) / 2;

/** Pentagrama en clave de sol con la nota (redonda), sus líneas adicionales y su alteración. */
export function pentagramaSVG(n: NotaLeida | null, idioma: 'es' | 'en' = 'es'): string {
  const partes: string[] = [];
  for (let k = 0; k <= 8; k += 2) partes.push(`<line class="linea" x1="8" y1="${yEscalon(k)}" x2="${ANCHO - 8}" y2="${yEscalon(k)}"/>`);
  partes.push(`<text class="clave" x="14" y="${yEscalon(2)}" dominant-baseline="alphabetic">𝄞</text>`);
  if (n) {
    const e = escalon(n);
    const y = yEscalon(e);
    for (let k = -2; k >= e; k -= 2) partes.push(`<line class="linea adicional" x1="${X_NOTA - 17}" y1="${yEscalon(k)}" x2="${X_NOTA + 17}" y2="${yEscalon(k)}"/>`);
    for (let k = 10; k <= e; k += 2) partes.push(`<line class="linea adicional" x1="${X_NOTA - 17}" y1="${yEscalon(k)}" x2="${X_NOTA + 17}" y2="${yEscalon(k)}"/>`);
    partes.push(
      `<ellipse class="cabeza" cx="${X_NOTA}" cy="${y}" rx="9.5" ry="6.4"/>` +
        `<ellipse class="hueco" cx="${X_NOTA}" cy="${y}" rx="5.2" ry="3.4" transform="rotate(-35 ${X_NOTA} ${y})"/>`,
    );
    if (n.alteracion) partes.push(`<text class="alteracion" x="${X_NOTA - 24}" y="${y}" text-anchor="middle" dominant-baseline="central">${n.alteracion === '#' ? '♯' : '♭'}</text>`);
  }
  const titulo =
    idioma === 'en' ? (n ? `Staff with the note ${nombreEscrito(n)}` : 'Empty staff') : n ? `Pentagrama con la nota ${nombreEscrito(n)}` : 'Pentagrama vacío';
  return `<svg class="pentagrama" viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="${titulo}" xmlns="http://www.w3.org/2000/svg">${partes.join('')}</svg>`;
}
