// Arpegios y escalas en el mástil: dónde está cada nota, con su grado, en todo
// el mástil o en una zona (posición, una cuerda, dos cuerdas), sus recorridos para
// el audio (por grados, en terceras, en grupos…) y el dibujo del mástil en
// horizontal. Funciones puras, sin DOM.
import { simboloEn, type AcordeGrado } from './progresiones.ts';
import { AFINACION, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

export const TRASTES = 15;
/** Traste inicial de la última posición entera (5 trastes, hasta el 15). */
export const ULTIMA_POSICION = TRASTES - 4;
/** Un traste inicial guardado, dentro de 1 … ULTIMA_POSICION. */
export const posicionValida = (desde: number) => Math.min(Math.max(Math.round(desde) || 1, 1), ULTIMA_POSICION);
const mod = (n: number, m = 12) => ((n % m) + m) % m;

export interface NotaMastil {
  /** Índice de cuerda: 0 = 6ª … 5 = 1ª. */
  cuerda: number;
  traste: number;
  midi: number;
  grado: string;
  nota: string;
  /** En una escala: si la nota es también del acorde (se dibuja destacada). */
  delAcorde?: boolean;
}

/**
 * Todas las notas de una fórmula sobre una raíz en el mástil (trastes 0–15).
 * Con `acorde`, las que también están en él se marcan como del acorde.
 */
export function notasFormula(raiz: string, formula: readonly string[], acorde?: readonly string[]): NotaMastil[] {
  const pcRaiz = pitchClass(notaDeGrado(raiz, '1'));
  const porPc = new Map(formula.map((g) => [mod(pcRaiz + semitonosGrado(g)), g]));
  const delAcorde = acorde ? new Set(acorde.map((g) => mod(pcRaiz + semitonosGrado(g)))) : null;
  const res: NotaMastil[] = [];
  for (let c = 0; c < 6; c++) {
    for (let t = 0; t <= TRASTES; t++) {
      const midi = AFINACION[c] + t;
      const g = porPc.get(mod(midi));
      if (!g) continue;
      res.push({
        cuerda: c,
        traste: t,
        midi,
        grado: g,
        nota: formatNota(notaDeGrado(raiz, g)),
        ...(delAcorde ? { delAcorde: delAcorde.has(mod(midi)) } : {}),
      });
    }
  }
  return res;
}

/** Todas las notas del acorde en el mástil (trastes 0–15). */
export function notasArpegio(tonica: string, a: AcordeGrado): NotaMastil[] {
  return notasFormula(formatNota(notaDeGrado(tonica, a.grado)), a.formula);
}

/** Zona del mástil en la que se practica. */
export type Zona =
  | { tipo: 'todo' }
  | { tipo: 'posicion'; desde: number }
  | { tipo: 'cuerda'; cuerda: number }
  | { tipo: 'dos-cuerdas'; cuerda: number };

/** Si una nota cae en la zona. Una posición son 5 trastes (desde … desde + 4; en el 1, también las cuerdas al aire). */
export function enZona(n: NotaMastil, z: Zona): boolean {
  switch (z.tipo) {
    case 'todo':
      return true;
    case 'posicion':
      return n.traste >= (z.desde === 1 ? 0 : z.desde) && n.traste <= z.desde + 4;
    case 'cuerda':
      return n.cuerda === z.cuerda;
    case 'dos-cuerdas':
      return n.cuerda === z.cuerda || n.cuerda === z.cuerda + 1;
  }
}

/**
 * Recorrido para tocar: las notas de la zona sin alturas repetidas, de grave a
 * agudo, empezando por la nota más grave del grado `desde` (sube hasta arriba,
 * baja hasta la más grave y vuelve a la de partida).
 */
export function recorrido(notas: readonly NotaMastil[], z: Zona, desde = '1'): NotaMastil[] {
  const unicas = new Map<number, NotaMastil>();
  for (const n of notas.filter((x) => enZona(x, z))) if (!unicas.has(n.midi)) unicas.set(n.midi, n);
  const orden = [...unicas.values()].sort((a, b) => a.midi - b.midi);
  if (orden.length === 0) return [];
  // `desde` es el número del grado: '3' vale para 3 y b3, '7' para 7, b7 y bb7…
  const k = Math.max(0, orden.findIndex((n) => n.grado.replace(/^[b#]+/, '') === desde));
  return [...orden.slice(k), ...orden.slice(0, -1).reverse(), ...orden.slice(1, k + 1)];
}

/** Las notas de la zona sin alturas repetidas, de grave a agudo. */
export function ordenadas(notas: readonly NotaMastil[], z: Zona): NotaMastil[] {
  const unicas = new Map<number, NotaMastil>();
  for (const n of notas.filter((x) => enZona(x, z))) if (!unicas.has(n.midi)) unicas.set(n.midi, n);
  return [...unicas.values()].sort((a, b) => a.midi - b.midi);
}

/**
 * Secuencia sobre las notas de la zona: la célula se repite desde cada nota
 * subiendo y después, al revés, bajando. Célula [0, 2] = terceras (1-3, 2-4…),
 * [0, 1, 2] = grupos de 3, [0, 1, 2, 3] = grupos de 4.
 */
export function secuenciaZona(notas: readonly NotaMastil[], z: Zona, celula: readonly number[]): NotaMastil[] {
  const orden = ordenadas(notas, z);
  const alcance = Math.max(...celula);
  if (orden.length <= alcance) return orden;
  const sube: NotaMastil[] = [];
  for (let i = 0; i + alcance < orden.length; i++) for (const c of celula) sube.push(orden[i + c]);
  const alReves = [...orden].reverse();
  const baja: NotaMastil[] = [];
  for (let i = 1; i + alcance < alReves.length; i++) for (const c of celula) baja.push(alReves[i + c]);
  return [...sube, ...baja, orden[0]];
}

/**
 * Audio del recorrido en corcheas (o en negras si `negras`), con la última nota
 * más larga. Con `pedal`, la nota MIDI dada suena todo el rato por debajo.
 */
export function eventosArpegio(
  notas: readonly NotaMastil[],
  bpm: number,
  negras = false,
  pedal?: number,
): { eventos: Evento[]; duracion: number } {
  const paso = (negras ? 60 : 30) / bpm;
  const eventos: Evento[] = notas.map((n, i) => ({ midi: n.midi, inicio: i * paso, duracion: i === notas.length - 1 ? paso * 3 : paso * 0.95 }));
  const duracion = notas.length * paso + paso * 2;
  if (pedal !== undefined) eventos.push({ midi: pedal, inicio: 0, duracion });
  return { eventos, duracion };
}

// --- Dibujo del mástil (horizontal: 1ª cuerda arriba, como en una tablatura) --------------

const ANCHO_TRASTE = 46;
const SEP_CUERDA = 26;
const MARGEN_IZQ = 34;
const MARGEN_SUP = 16;
const MARGEN_INF = 26;
const RADIO = 11;
const MARCAS = [3, 5, 7, 9, 15];

/**
 * SVG del mástil con las notas dadas (rotuladas con su grado). Las notas fuera
 * de `zona` se dibujan atenuadas; `sonando` resalta una (por su altura y cuerda).
 * Con una zona de posición, `ecos` son otras posiciones (traste inicial) que se
 * dibujan solo con el contorno: dónde se repite el mismo dibujo en una escala simétrica.
 */
export function mastilSVG(notas: readonly NotaMastil[], zona: Zona = { tipo: 'todo' }, ecos: readonly number[] = []): string {
  const ancho = MARGEN_IZQ + ANCHO_TRASTE * (TRASTES + 0.5);
  const alto = MARGEN_SUP + SEP_CUERDA * 5 + MARGEN_INF;
  const yCuerda = (c: number) => MARGEN_SUP + SEP_CUERDA * (5 - c);
  const xTraste = (t: number) => MARGEN_IZQ + ANCHO_TRASTE * t; // línea del traste t
  const xNota = (t: number) => (t === 0 ? MARGEN_IZQ - 16 : xTraste(t) - ANCHO_TRASTE / 2);
  const partes: string[] = [];
  const ecosValidos = ecos.filter((d) => d >= 1 && d + 4 <= TRASTES);

  // Zona resaltada.
  if (zona.tipo === 'posicion') {
    const x0 = zona.desde === 1 ? MARGEN_IZQ - 30 : xTraste(zona.desde - 1);
    partes.push(`<rect class="zona" x="${x0}" y="${MARGEN_SUP - 12}" width="${xTraste(zona.desde + 4) - x0}" height="${SEP_CUERDA * 5 + 24}" rx="6"/>`);
    for (const d of ecosValidos) {
      const xe = d === 1 ? MARGEN_IZQ - 30 : xTraste(d - 1);
      partes.push(`<rect class="eco" x="${xe}" y="${MARGEN_SUP - 14}" width="${xTraste(d + 4) - xe}" height="${SEP_CUERDA * 5 + 28}" rx="6"/>`);
    }
  } else if (zona.tipo === 'cuerda' || zona.tipo === 'dos-cuerdas') {
    const arriba = zona.tipo === 'cuerda' ? zona.cuerda : zona.cuerda + 1;
    const y0 = yCuerda(arriba) - 12;
    const y1 = yCuerda(zona.cuerda) + 12;
    partes.push(`<rect class="zona" x="${MARGEN_IZQ - 30}" y="${y0}" width="${xTraste(TRASTES) - MARGEN_IZQ + 30}" height="${y1 - y0}" rx="6"/>`);
  }
  // Marcas de traste, trastes, cejuela y cuerdas.
  for (const m of MARCAS) partes.push(`<circle class="marca" cx="${xTraste(m) - ANCHO_TRASTE / 2}" cy="${alto - 10}" r="3.5"/>`);
  partes.push(
    `<circle class="marca" cx="${xTraste(12) - ANCHO_TRASTE / 2 - 6}" cy="${alto - 10}" r="3.5"/><circle class="marca" cx="${xTraste(12) - ANCHO_TRASTE / 2 + 6}" cy="${alto - 10}" r="3.5"/>`,
  );
  for (let t = 1; t <= TRASTES; t++) {
    partes.push(`<line class="traste" x1="${xTraste(t)}" y1="${yCuerda(5)}" x2="${xTraste(t)}" y2="${yCuerda(0)}"/>`);
  }
  partes.push(`<rect class="cejuela" x="${MARGEN_IZQ - 3}" y="${yCuerda(5) - 1}" width="5" height="${SEP_CUERDA * 5 + 2}"/>`);
  for (let c = 0; c < 6; c++) partes.push(`<line class="cuerda" x1="${MARGEN_IZQ}" y1="${yCuerda(c)}" x2="${xTraste(TRASTES)}" y2="${yCuerda(c)}"/>`);
  // Notas.
  for (const n of notas) {
    const enEco = zona.tipo === 'posicion' && ecosValidos.some((d) => enZona(n, { tipo: 'posicion', desde: d }));
    const fuera = enZona(n, zona) ? '' : enEco ? ' en-eco' : ' fuera';
    const raiz = n.grado === '1' ? ' raiz' : '';
    const deEscala = n.delAcorde === false ? ' de-escala' : '';
    const x = xNota(n.traste);
    const y = yCuerda(n.cuerda);
    partes.push(
      `<g class="nota${raiz}${deEscala}${fuera}" data-midi="${n.midi}" data-cuerda="${n.cuerda}"><circle cx="${x}" cy="${y}" r="${RADIO}"/>` +
        `<text class="grado${n.grado.length > 2 ? ' largo' : ''}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${n.grado}</text></g>`,
    );
  }
  return `<svg class="mastil" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Mástil con las notas del arpegio" xmlns="http://www.w3.org/2000/svg">${partes.join('')}</svg>`;
}

/** Cifrado del acorde (para títulos). */
export const simboloArpegio = (tonica: string, a: AcordeGrado) => simboloEn(tonica, a);
