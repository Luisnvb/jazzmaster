// Técnica de púa: ejercicios en tablatura con el golpe de púa de cada nota en
// púa alternada y en economy (o sweep), los cambios de cuerda por dentro, por
// fuera o barridos, y el audio con metrónomo y subida progresiva de tempo.
// Funciones puras, sin DOM.
import { enPosicion, tresPorCuerda } from './digitacion.ts';
import { AFINACION, type Evento } from './secuencias.ts';
import { parseNota, pitchClass } from './teoria.ts';

const mod = (n: number, m = 12) => ((n % m) + m) % m;

export interface NotaTab {
  /** 0 = 6ª … 5 = 1ª. */
  cuerda: number;
  traste: number;
  midi: number;
  /** Ligado: hammer-on (h) o pull-off (p); no se toca con la púa. */
  ligado?: 'h' | 'p';
}

export type Golpe = 'abajo' | 'arriba' | 'ligado';
export type Tecnica = 'alternada' | 'economy';

export interface Ejercicio {
  id: string;
  nombre: string;
  descripcion: string;
  /** Notas por pulso con las que se propone. */
  subdivision: number;
  notas: (tonica: string) => NotaTab[];
}

const nt = (cuerda: number, traste: number, ligado?: 'h' | 'p'): NotaTab => ({
  cuerda,
  traste,
  midi: AFINACION[cuerda] + traste,
  ...(ligado ? { ligado } : {}),
});
/** Sube y baja: las notas y después las mismas al revés (la más aguda, dos veces). */
const subeYBaja = (notas: NotaTab[]) => [...notas, ...[...notas].reverse()];
/** Primer traste ≥ `min` de la cuerda en el que suena la tónica. */
export const trasteTonica = (tonica: string, cuerda: number, min: number) =>
  min + mod(pitchClass(parseNota(tonica)) - AFINACION[cuerda] - min);
const MAYOR = ['1', '2', '3', '4', '5', '6', '7'];

export const EJERCICIOS: Ejercicio[] = [
  {
    id: 'arana',
    nombre: 'Cromático 1-2-3-4',
    descripcion: 'Cuatro trastes seguidos en cada cuerda, un dedo por traste, desde la tónica en la 6ª. Número par de notas por cuerda: cada cuerda empieza hacia abajo.',
    subdivision: 4,
    notas: (t) => {
      const p = trasteTonica(t, 0, 1);
      return subeYBaja([0, 1, 2, 3, 4, 5].flatMap((c) => [0, 1, 2, 3].map((k) => nt(c, p + k))));
    },
  },
  {
    id: 'pentatonica',
    nombre: 'Pentatónica menor, dos por cuerda',
    descripcion: 'La primera caja de la pentatónica menor. Con dos notas por cuerda, la púa alternada cambia de cuerda siempre igual: por dentro al subir y por fuera al bajar.',
    subdivision: 4,
    notas: (t) => {
      const f = trasteTonica(t, 0, 3);
      const segunda = [3, 2, 2, 2, 3, 3];
      return subeYBaja(segunda.flatMap((s, c) => [nt(c, f), nt(c, f + s)]));
    },
  },
  {
    id: 'posicion',
    nombre: 'Escala mayor en posición',
    descripcion: 'La escala en una posición fija (véase Digitación): unas cuerdas tienen tres notas y otras dos, así que con púa alternada los cambios de cuerda van alternando por dentro y por fuera.',
    subdivision: 4,
    notas: (t) => subeYBaja(enPosicion(t, MAYOR, trasteTonica(t, 0, 2) - 1).notas.map((n) => nt(n.cuerda, n.traste))),
  },
  {
    id: 'tres',
    nombre: 'Escala mayor, tres por cuerda',
    descripcion: 'Tres notas en cada cuerda. Con economy, cada cuerda nueva se toca en la dirección en la que va la mano: al subir, cada cuerda empieza hacia abajo; al bajar, hacia arriba.',
    subdivision: 3,
    notas: (t) => subeYBaja(tresPorCuerda(t, MAYOR, 0).notas.map((n) => nt(n.cuerda, n.traste))),
  },
  {
    id: 'barrido',
    nombre: 'Arpegio menor barrido',
    descripcion: 'Una nota por cuerda desde la 5ª: un solo movimiento de púa hacia abajo al subir y hacia arriba al bajar, con ligados en los extremos. Es el sweep picking.',
    subdivision: 6,
    notas: (t) => {
      const f = trasteTonica(t, 1, 2);
      return [
        nt(1, f), nt(1, f + 3, 'h'), nt(2, f + 2), nt(3, f + 2), nt(4, f + 1), nt(5, f), nt(5, f + 5, 'h'),
        nt(5, f, 'p'), nt(4, f + 1), nt(3, f + 2), nt(2, f + 2), nt(1, f + 3),
      ];
    },
  },
];

const contrario = (g: Golpe): Golpe => (g === 'abajo' ? 'arriba' : 'abajo');

function unaVuelta(notas: readonly NotaTab[], tecnica: Tecnica, previo: { golpe: Golpe; cuerda: number } | null): Golpe[] {
  const res: Golpe[] = [];
  let ant = previo;
  for (const n of notas) {
    if (n.ligado) {
      res.push('ligado');
      continue;
    }
    let g: Golpe;
    if (!ant) g = 'abajo';
    else if (tecnica === 'alternada' || n.cuerda === ant.cuerda) g = contrario(ant.golpe);
    // Economy: al cambiar de cuerda, la púa sigue en la dirección del cambio.
    else g = n.cuerda > ant.cuerda ? 'abajo' : 'arriba';
    res.push(g);
    ant = { golpe: g, cuerda: n.cuerda };
  }
  return res;
}

/** Golpe de púa de cada nota en una vuelta, empezando hacia abajo. */
export function golpes(notas: readonly NotaTab[], tecnica: Tecnica): Golpe[] {
  return unaVuelta(notas, tecnica, null);
}

/** Golpes de púa (sin ligados) en una vuelta. */
export const numeroGolpes = (gs: readonly Golpe[]) => gs.filter((g) => g !== 'ligado').length;

export interface Cambios {
  dentro: number;
  fuera: number;
  barridos: number;
}

/**
 * Cambios de cuerda entre dos notas tocadas con púa seguidas (incluido el paso
 * de la última a la primera, como en bucle). Por dentro: la púa ataca las dos
 * cuerdas desde el hueco entre ellas (hacia arriba la de arriba, hacia abajo la
 * de abajo); por fuera: desde fuera, saltando una cuerda; barrido: las dos en
 * la misma dirección, de un solo movimiento.
 */
export function cambiosDeCuerda(notas: readonly NotaTab[], gs: readonly Golpe[]): Cambios {
  const tocadas = notas.flatMap((n, i) => (gs[i] === 'ligado' ? [] : [{ cuerda: n.cuerda, golpe: gs[i] }]));
  const res: Cambios = { dentro: 0, fuera: 0, barridos: 0 };
  tocadas.forEach((a, i) => {
    const b = tocadas[(i + 1) % tocadas.length];
    if (tocadas.length < 2 || a.cuerda === b.cuerda) return;
    const [arriba, abajo] = a.cuerda < b.cuerda ? [a, b] : [b, a];
    if (arriba.golpe === abajo.golpe) res.barridos++;
    else if (arriba.golpe === 'arriba') res.dentro++;
    else res.fuera++;
  });
  return res;
}

/** Huecos de una vuelta: las notas y los silencios hasta completar el último pulso. */
export const huecos = (n: number, subdivision: number) => Math.ceil(n / subdivision) * subdivision;

/**
 * Tempos de cada vuelta en una subida progresiva: `desde`, repetido `cada`
 * vueltas, sumando `paso` hasta no pasar de `hasta`. Con paso 0, `cada` vueltas a `desde`.
 */
export function planSubida(desde: number, paso: number, cada: number, hasta: number): number[] {
  const res: number[] = [];
  const veces = Math.max(1, Math.round(cada));
  if (paso <= 0 || hasta <= desde) return Array(veces).fill(desde);
  for (let t = desde; t <= hasta; t += paso) for (let k = 0; k < veces; k++) res.push(t);
  return res;
}

export interface Marca {
  inicio: number;
  /** Índice de la nota en la vuelta, o -1 en la cuenta y en los silencios. */
  nota: number;
  vuelta: number;
  tempo: number;
}

/**
 * Audio del ejercicio: una vuelta por tempo de `tempos`, una nota por hueco
 * (subdivisión del pulso), con clic de metrónomo en cada pulso (fuerte al
 * empezar la vuelta) y, si `cuenta`, cuatro clics antes. Devuelve también las
 * marcas de tiempo de cada hueco para seguir la tablatura.
 */
export function eventosPua(
  notas: readonly NotaTab[],
  subdivision: number,
  tempos: readonly number[],
  { metronomo = true, cuenta = true } = {},
): { eventos: Evento[]; duracion: number; marcas: Marca[] } {
  const eventos: Evento[] = [];
  const marcas: Marca[] = [];
  const total = huecos(notas.length, subdivision);
  let t = 0;
  if (cuenta && tempos.length) {
    const pulso = 60 / tempos[0];
    for (let k = 0; k < 4; k++) eventos.push({ midi: 0, inicio: k * pulso, duracion: 0.05, clic: k === 0 ? 'fuerte' : 'debil' });
    marcas.push({ inicio: 0, nota: -1, vuelta: -1, tempo: tempos[0] });
    t = 4 * pulso;
  }
  tempos.forEach((bpm, v) => {
    const hueco = 60 / bpm / subdivision;
    for (let i = 0; i < total; i++) {
      const inicio = t + i * hueco;
      if (metronomo && i % subdivision === 0) eventos.push({ midi: 0, inicio, duracion: 0.05, clic: i === 0 ? 'fuerte' : 'debil' });
      const n = notas[i];
      if (n) eventos.push({ midi: n.midi, inicio, duracion: hueco * 0.9 });
      marcas.push({ inicio, nota: n ? i : -1, vuelta: v, tempo: bpm });
    }
    t += total * hueco;
  });
  return { eventos, duracion: t, marcas };
}

/** La marca que corresponde a un instante (las marcas van en orden). */
export function marcaEn(marcas: readonly Marca[], segundos: number): Marca | null {
  let lo = 0;
  let hi = marcas.length - 1;
  if (hi < 0 || segundos < marcas[0].inicio) return null;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (marcas[m].inicio <= segundos) lo = m;
    else hi = m - 1;
  }
  return marcas[lo];
}

// --- Tablatura ------------------------------------------------------------------------------

const COL = 26;
const IZQ = 46;
const SEP = 16;
const FILA_GOLPES = 22;

function simbolo(g: Golpe, x: number, y: number, ligado?: string): string {
  if (g === 'ligado') return `<text class="lig" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${ligado ?? ''}</text>`;
  if (g === 'abajo') return `<path class="golpe" d="M${x - 5} ${y + 6}V${y - 5}H${x + 5}V${y + 6}"/>`;
  return `<path class="golpe" d="M${x - 5} ${y - 6}L${x} ${y + 6}L${x + 5} ${y - 6}"/>`;
}

/**
 * Tablatura en SVG (1ª cuerda arriba) con dos filas de golpes encima: púa
 * alternada y economy; en la de economy se marcan los golpes que cambian. Una
 * línea fina separa los pulsos; `porFila` huecos por renglón.
 */
export function tabSVG(notas: readonly NotaTab[], subdivision: number, porFila: number): string {
  const alt = golpes(notas, 'alternada');
  const eco = golpes(notas, 'economy');
  const total = huecos(notas.length, subdivision);
  const filas = Math.ceil(total / porFila);
  const altoFila = FILA_GOLPES * 2 + 8 + SEP * 5 + 26;
  const ancho = IZQ + COL * Math.min(porFila, total) + 8;
  const partes: string[] = [];
  for (let f = 0; f < filas; f++) {
    const y0 = f * altoFila;
    const yAlt = y0 + FILA_GOLPES / 2 + 2;
    const yEco = yAlt + FILA_GOLPES;
    const yTab = y0 + FILA_GOLPES * 2 + 12;
    const yCuerda = (c: number) => yTab + SEP * (5 - c);
    const n = Math.min(porFila, total - f * porFila);
    const x1 = IZQ + COL * n;
    partes.push(`<text class="rot" x="${IZQ - 8}" y="${yAlt}" text-anchor="end" dominant-baseline="central">Alt.</text>`);
    partes.push(`<text class="rot" x="${IZQ - 8}" y="${yEco}" text-anchor="end" dominant-baseline="central">Eco.</text>`);
    for (let c = 0; c < 6; c++) partes.push(`<line class="linea" x1="${IZQ - 4}" y1="${yCuerda(c)}" x2="${x1}" y2="${yCuerda(c)}"/>`);
    partes.push(`<text class="rot tab" x="${IZQ - 18}" y="${yCuerda(2.5)}" text-anchor="middle" dominant-baseline="central">TAB</text>`);
    for (let k = 0; k <= n; k += subdivision) {
      const x = IZQ + COL * k;
      partes.push(`<line class="${k === 0 || k === n ? 'barra' : 'pulso'}" x1="${x - 2}" y1="${yCuerda(5)}" x2="${x - 2}" y2="${yCuerda(0)}"/>`);
    }
    for (let k = 0; k < n; k++) {
      const i = f * porFila + k;
      const nota = notas[i];
      if (!nota) continue;
      const x = IZQ + COL * k + COL / 2 - 2;
      const distinto = alt[i] !== eco[i] ? ' distinto' : '';
      partes.push(
        `<g class="col" data-i="${i}"><rect class="fondo-col" x="${x - COL / 2 + 1}" y="${y0 + 1}" width="${COL - 2}" height="${altoFila - 18}" rx="4"/>` +
          `<g class="alt">${simbolo(alt[i], x, yAlt, nota.ligado)}</g><g class="eco${distinto}">${simbolo(eco[i], x, yEco, nota.ligado)}</g>` +
          `<rect class="tapa" x="${x - 9}" y="${yCuerda(nota.cuerda) - 7}" width="18" height="14"/>` +
          `<text class="traste" x="${x}" y="${yCuerda(nota.cuerda)}" text-anchor="middle" dominant-baseline="central">${nota.traste}</text></g>`,
      );
    }
  }
  return `<svg class="tab-pua" viewBox="0 0 ${ancho} ${filas * altoFila}" width="${Math.round(ancho * 1.5)}" height="${Math.round(filas * altoFila * 1.5)}" role="img" aria-label="Tablatura con los golpes de púa" xmlns="http://www.w3.org/2000/svg">${partes.join('')}</svg>`;
}
