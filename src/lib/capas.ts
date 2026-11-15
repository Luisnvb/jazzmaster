// Mástil por capas: un acorde en una zona del mástil (una de las cinco formas
// CAGED) y, sobre el mismo dibujo, capa a capa: la raíz, las tríadas cerradas, el
// arpegio, las tríadas abiertas, la pentatónica, la escala y el acorde. Cada capa
// se apoya en la anterior. Inspirado en Guitar Burpees, de Noel Johnston.
// Funciones puras, sin DOM.
import type { NotaMastil } from './arpegios.ts';
import { enPosicion } from './digitacion.ts';
import { inversionesDrop, tresNotas, type IdGrupo } from './drop.ts';
import { parseAcordeGrado, simboloEn, type AcordeGrado } from './progresiones.ts';
import { AFINACION, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

const mod = (n: number, m = 12) => ((n % m) + m) % m;

// --- Cualidades ------------------------------------------------------------------------

export interface EscalaCapa {
  id: string;
  nombre: string;
  formula: string[];
}

export interface CualidadCapas {
  id: string;
  nombre: string;
  /** Acorde en grados (sobre I), como en Progresiones: 'Im7'. */
  romano: string;
  /** Pentatónica (grados sobre la raíz del acorde); sin ella, la capa no sale. */
  penta?: { nombre: string; formula: string[] };
  /** Escalas que encajan, la primera por defecto (se alternan en la capa de escala). */
  escalas: EscalaCapa[];
}

const JONICA: EscalaCapa = { id: 'jonica', nombre: 'Jónica', formula: ['1', '2', '3', '4', '5', '6', '7'] };
const LIDIA: EscalaCapa = { id: 'lidia', nombre: 'Lidia', formula: ['1', '2', '3', '#4', '5', '6', '7'] };
const MIXOLIDIA: EscalaCapa = { id: 'mixolidia', nombre: 'Mixolidia', formula: ['1', '2', '3', '4', '5', '6', 'b7'] };
const DORICA: EscalaCapa = { id: 'dorica', nombre: 'Dórica', formula: ['1', '2', 'b3', '4', '5', '6', 'b7'] };
const EOLICA: EscalaCapa = { id: 'eolica', nombre: 'Eólica', formula: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] };
const FRIGIA: EscalaCapa = { id: 'frigia', nombre: 'Frigia', formula: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'] };
const LOCRIA: EscalaCapa = { id: 'locria', nombre: 'Locria', formula: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'] };
const LOCRIA_2: EscalaCapa = { id: 'locria-2', nombre: 'Locria ♮2', formula: ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'] };
const LIDIA_B7: EscalaCapa = { id: 'lidia-b7', nombre: 'Lidia b7', formula: ['1', '2', '3', '#4', '5', '6', 'b7'] };
const ALTERADA: EscalaCapa = { id: 'alterada', nombre: 'Alterada', formula: ['1', 'b2', '#2', '3', '#4', 'b6', 'b7'] };
const DISMINUIDA: EscalaCapa = { id: 'disminuida', nombre: 'Disminuida (tono-semitono)', formula: ['1', '2', 'b3', '4', 'b5', 'b6', 'bb7', '7'] };
const TONOS: EscalaCapa = { id: 'tonos', nombre: 'Tonos enteros', formula: ['1', '2', '3', '#4', '#5', 'b7'] };
const LIDIA_AUM: EscalaCapa = { id: 'lidia-aum', nombre: 'Lidia aumentada', formula: ['1', '2', '3', '#4', '#5', '6', '7'] };

const PENTA_MAYOR = { nombre: 'Pentatónica mayor', formula: ['1', '2', '3', '5', '6'] };
const PENTA_MENOR = { nombre: 'Pentatónica menor', formula: ['1', 'b3', '4', '5', 'b7'] };

export const CUALIDADES_CAPAS: CualidadCapas[] = [
  { id: 'mayor', nombre: 'Mayor', romano: 'I', penta: PENTA_MAYOR, escalas: [JONICA, LIDIA, MIXOLIDIA] },
  { id: 'menor', nombre: 'Menor', romano: 'Im', penta: PENTA_MENOR, escalas: [DORICA, EOLICA, FRIGIA] },
  { id: 'dim', nombre: 'Disminuida', romano: 'I°', escalas: [LOCRIA, DISMINUIDA] },
  { id: 'aum', nombre: 'Aumentada', romano: 'I+', escalas: [TONOS, LIDIA_AUM] },
  { id: 'sus4', nombre: 'Sus4', romano: 'Isus4', penta: { nombre: 'Pentatónica sus', formula: ['1', '2', '4', '5', 'b7'] }, escalas: [MIXOLIDIA, DORICA] },
  { id: 'maj7', nombre: 'maj7', romano: 'Imaj7', penta: PENTA_MAYOR, escalas: [JONICA, LIDIA] },
  { id: '7', nombre: '7', romano: 'I7', penta: PENTA_MAYOR, escalas: [MIXOLIDIA, LIDIA_B7, ALTERADA] },
  { id: 'm7', nombre: 'm7', romano: 'Im7', penta: PENTA_MENOR, escalas: [DORICA, EOLICA, FRIGIA] },
  { id: 'm7b5', nombre: 'm7b5', romano: 'Im7b5', penta: { nombre: 'Pentatónica menor b5', formula: ['1', 'b3', '4', 'b5', 'b7'] }, escalas: [LOCRIA_2, LOCRIA] },
  { id: '6', nombre: '6', romano: 'I6', penta: PENTA_MAYOR, escalas: [JONICA, LIDIA] },
];

export const cualidadCapas = (id: string) => CUALIDADES_CAPAS.find((c) => c.id === id) ?? CUALIDADES_CAPAS[0];

// --- Formas CAGED -----------------------------------------------------------------------

export type LetraCaged = 'C' | 'A' | 'G' | 'E' | 'D';

interface FormaCaged {
  letra: LetraCaged;
  /** Acorde mayor al aire de la forma, de 6ª a 1ª (null = cuerda sin tocar). */
  trastes: (number | null)[];
  grados: string[];
}

export const FORMAS_CAGED: FormaCaged[] = [
  { letra: 'C', trastes: [null, 3, 2, 0, 1, 0], grados: ['', '1', '3', '5', '1', '3'] },
  { letra: 'A', trastes: [null, 0, 2, 2, 2, 0], grados: ['', '1', '5', '1', '3', '5'] },
  { letra: 'G', trastes: [3, 2, 0, 0, 0, 3], grados: ['1', '3', '5', '1', '3', '1'] },
  { letra: 'E', trastes: [0, 2, 2, 1, 0, 0], grados: ['1', '5', '1', '3', '5', '1'] },
  { letra: 'D', trastes: [null, null, 0, 2, 3, 2], grados: ['', '', '1', '5', '1', '3'] },
];

export interface ZonaCaged {
  letra: LetraCaged;
  /** Traste donde cae la «cejuela» de la forma (0 = la forma al aire). */
  cejilla: number;
  /** Posición de la mano (traste del índice, 1–12) para las escalas y arpegios. */
  posicion: number;
  /** Trastes de la zona: posicion − 1 … posicion + 4. */
  desde: number;
  hasta: number;
}

/** La zona de una forma CAGED para una raíz: la forma al aire desplazada hasta esa raíz (trastes 0–11). */
export function zonaCaged(raiz: string, letra: LetraCaged): ZonaCaged {
  const f = FORMAS_CAGED.find((x) => x.letra === letra)!;
  const cuerdaRaiz = f.grados.indexOf('1');
  const pcForma = mod(AFINACION[cuerdaRaiz] + f.trastes[cuerdaRaiz]!);
  const cejilla = mod(pitchClass(notaDeGrado(raiz, '1')) - pcForma);
  const posicion = Math.max(1, cejilla);
  return { letra, cejilla, posicion, desde: posicion - 1, hasta: posicion + 4 };
}

/** Las cinco zonas de una raíz, de la más grave a la más aguda en el mástil. */
export const zonasCaged = (raiz: string) => FORMAS_CAGED.map((f) => zonaCaged(raiz, f.letra)).sort((a, b) => a.cejilla - b.cejilla);

const semis = (g: string) => semitonosGrado(g);
/** Lo que hay que mover un traste para pasar del grado `de` al `a` (entre −6 y 5). */
const salto = (de: string, a: string) => mod(semis(a) - semis(de) + 6) - 6;

export interface AcordeCaged {
  /** De 6ª a 1ª; null = cuerda sin tocar. */
  trastes: (number | null)[];
  grados: string[];
}

/**
 * El acorde de la forma CAGED en una cualidad. Se parte de la forma mayor: la 3 y
 * la 5 se cambian por las de la cualidad (b3, 4, b5, #5); si sale de la zona, esa
 * cuerda no se toca. Si el acorde tiene una cuarta nota (7, maj7, 6), sustituye a
 * una nota doblada o a la 5 justa, la que pida menos movimiento dentro de la forma
 * (nunca al bajo).
 */
export function acordeCaged(raiz: string, a: AcordeGrado, letra: LetraCaged): AcordeCaged {
  const f = FORMAS_CAGED.find((x) => x.letra === letra)!;
  const { cejilla } = zonaCaged(raiz, letra);
  const tri = tresNotas(a.formula);
  const cambio: Record<string, string> = { '1': tri[0], '3': tri[1], '5': tri[2] };
  const trastes: (number | null)[] = [];
  const grados: string[] = [];
  f.trastes.forEach((t, c) => {
    if (t === null) {
      trastes.push(null);
      grados.push('');
      return;
    }
    const g = cambio[f.grados[c]];
    const nuevo = t + cejilla + salto(f.grados[c], g);
    const dentro = nuevo >= 0 && nuevo >= cejilla - 1 && nuevo <= cejilla + 4;
    trastes.push(dentro ? nuevo : null);
    grados.push(dentro ? g : '');
  });
  // Las notas que faltan (la cuarta nota, o una b5 que se salió de la forma) van a
  // una cuerda libre por encima del bajo o en lugar de una nota doblada (o de la 5
  // justa, que en las cuatriadas sobra), donde menos se mueva la mano.
  const cuatriada = a.formula.length > 3;
  const faltan = a.formula.filter((g) => !grados.includes(g) && !(cuatriada && g === '5'));
  const bajo = trastes.findIndex((t) => t !== null);
  const pcRaiz = pitchClass(notaDeGrado(raiz, '1'));
  for (const g of faltan) {
    let mejor: { c: number; traste: number; coste: number } | null = null;
    for (let c = bajo + 1; c < 6; c++) {
      const actual = grados[c];
      const libre = trastes[c] === null;
      const sobra = !libre && (grados.filter((x) => x === actual).length > 1 || (cuatriada && actual === '5'));
      if (!libre && !sobra) continue;
      // Dentro de la forma (cejilla … cejilla + 3) o, si no hay otra, un traste por detrás.
      const minimo = Math.max(0, cejilla - 1);
      const traste = minimo + mod(pcRaiz + semis(g) - AFINACION[c] - minimo);
      if (traste > cejilla + 3) continue;
      const coste =
        (libre ? 1.5 : Math.abs(traste - trastes[c]!) + (actual === '1' ? 0 : actual === '5' ? 0.5 : 1)) + (traste < cejilla ? 2.5 : 0);
      if (!mejor || coste < mejor.coste) mejor = { c, traste, coste };
    }
    if (mejor) {
      trastes[mejor.c] = mejor.traste;
      grados[mejor.c] = g;
    }
  }
  return { trastes, grados };
}

// --- Capas -------------------------------------------------------------------------------

export type IdCapa = 'raiz' | 'triadas' | 'arpegio' | 'abiertas' | 'pentatonica' | 'escala' | 'acorde';

export interface Capa {
  id: IdCapa;
  nombre: string;
  /** Qué se ve y cómo practicarlo. */
  pista: string;
  notas: NotaMastil[];
  /** Voicings (tríadas, el acorde): sus notas se unen en el dibujo y suenan juntas. */
  formas: NotaMastil[][];
}

const GRUPOS_CERRADAS: IdGrupo[] = ['654', '543', '432', '321'];
const GRUPOS_ABIERTAS: IdGrupo[] = ['643', '532', '421'];

function nota(raiz: string, cuerda: number, traste: number, grado: string, delAcorde?: boolean): NotaMastil {
  return {
    cuerda,
    traste,
    midi: AFINACION[cuerda] + traste,
    grado,
    nota: formatNota(notaDeGrado(raiz, grado)),
    ...(delAcorde === undefined ? {} : { delAcorde }),
  };
}

/** Las tríadas de unos grupos de cuerdas que caben enteras en la zona, de las cuerdas graves a las agudas. */
function triadasEnZona(raiz: string, a: AcordeGrado, grupos: IdGrupo[], z: ZonaCaged): NotaMastil[][] {
  return grupos.flatMap((g) =>
    inversionesDrop(raiz, a, g)
      .filter((d) => d.trastes.every((t) => t === 'x' || (t >= z.desde && t <= z.hasta)))
      .map((d) => d.trastes.flatMap((t, c) => (t === 'x' ? [] : [nota(raiz, c, t, d.grados[c])]))),
  );
}

/** Las notas de una fórmula en la zona, digitadas en posición (cada altura, una vez). */
function enLaZona(raiz: string, formula: readonly string[], z: ZonaCaged, acorde?: readonly string[]): NotaMastil[] {
  const pcs = acorde ? new Set(acorde.map((g) => mod(pitchClass(notaDeGrado(raiz, g))))) : null;
  return enPosicion(raiz, formula, z.posicion).notas.map((n) => nota(raiz, n.cuerda, n.traste, n.grado, pcs ? pcs.has(mod(n.midi)) : undefined));
}

/**
 * Las capas de un acorde (`raiz` + cualidad) en una zona CAGED, en el orden en que
 * se practican. `escala` elige entre las escalas de la cualidad.
 */
export function capas(raiz: string, cualidad: CualidadCapas, letra: LetraCaged, escala = 0): Capa[] {
  const a = parseAcordeGrado(cualidad.romano);
  const z = zonaCaged(raiz, letra);
  const simbolo = simboloEn(raiz, a);
  const tri = tresNotas(a.formula);
  const res: Capa[] = [];

  res.push({
    id: 'raiz',
    nombre: 'Raíz',
    pista: `Todas las ${formatNota(notaDeGrado(raiz, '1'))} de la zona: los puntos de anclaje. Tócalas de grave a agudo diciendo el nombre.`,
    notas: enLaZona(raiz, ['1'], z),
    formas: [],
  });
  const cerradas = triadasEnZona(raiz, a, GRUPOS_CERRADAS, z);
  res.push({
    id: 'triadas',
    nombre: 'Tríadas cerradas',
    pista: `${tri.join('-')} en tres cuerdas seguidas, sin mover la mano. Di qué grado queda arriba en cada una.`,
    notas: cerradas.flat(),
    formas: cerradas,
  });
  res.push({
    id: 'arpegio',
    nombre: 'Arpegio',
    pista: `${a.formula.join('-')} por toda la zona: sube y baja, y empieza también desde la 3 y la 5.`,
    notas: enLaZona(raiz, a.formula, z),
    formas: [],
  });
  const abiertas = triadasEnZona(raiz, a, GRUPOS_ABIERTAS, z);
  res.push({
    id: 'abiertas',
    nombre: 'Tríadas abiertas',
    pista: 'La voz central de la cerrada, una octava arriba: cuerdas 6-4-3, 5-3-2 y 4-2-1, con una saltada.',
    notas: abiertas.flat(),
    formas: abiertas,
  });
  if (cualidad.penta) {
    res.push({
      id: 'pentatonica',
      nombre: 'Pentatónica',
      pista: `${cualidad.penta.nombre} (${cualidad.penta.formula.join(' ')}), con la misma mano que el acorde. Las notas del acorde, rellenas.`,
      notas: enLaZona(raiz, cualidad.penta.formula, z, a.formula),
      formas: [],
    });
  }
  const e = cualidad.escalas[Math.min(Math.max(escala, 0), cualidad.escalas.length - 1)];
  res.push({
    id: 'escala',
    nombre: 'Escala',
    pista: `${e.nombre} (${e.formula.join(' ')}): la posición entera. Las notas del acorde, rellenas; el resto, huecas.`,
    notas: enLaZona(raiz, e.formula, z, a.formula),
    formas: [],
  });
  const ac = acordeCaged(raiz, a, letra);
  const notasAcorde = ac.trastes.flatMap((t, c) => (t === null ? [] : [nota(raiz, c, t, ac.grados[c])]));
  res.push({
    id: 'acorde',
    nombre: 'Acorde',
    pista: `${simbolo} con la forma de ${letra}: todo lo anterior gira alrededor de este acorde.`,
    notas: notasAcorde,
    formas: [notasAcorde],
  });
  return res;
}

// --- Audio -------------------------------------------------------------------------------

export interface PasoCapa {
  inicio: number;
  fin: number;
  /** Notas que suenan en este paso (para marcarlas). */
  notas: NotaMastil[];
}

/**
 * Cómo suena una capa: las notas sueltas suben y bajan en corcheas; los voicings,
 * uno tras otro (o solo el elegido), primero arpegiados y después juntos.
 */
export function eventosCapa(capa: Capa, bpm: number, voicing?: number): { eventos: Evento[]; pasos: PasoCapa[]; duracion: number } {
  const corchea = 30 / bpm;
  const eventos: Evento[] = [];
  const pasos: PasoCapa[] = [];
  let t = 0;
  if (capa.formas.length) {
    for (const [i, f] of capa.formas.entries()) {
      if (voicing !== undefined && i !== voicing) continue;
      const orden = [...f].sort((x, y) => x.midi - y.midi);
      orden.forEach((n) => {
        eventos.push({ midi: n.midi, inicio: t, duracion: corchea * 0.95 });
        pasos.push({ inicio: t, fin: t + corchea, notas: [n] });
        t += corchea;
      });
      orden.forEach((n, i) => eventos.push({ midi: n.midi, inicio: t + i * 0.02, duracion: corchea * 4 - i * 0.02 }));
      pasos.push({ inicio: t, fin: t + corchea * 4, notas: orden });
      t += corchea * 4;
    }
  } else {
    const unicas = [...new Map(capa.notas.map((n) => [n.midi, n])).values()].sort((x, y) => x.midi - y.midi);
    const recorrido = [...unicas, ...unicas.slice(0, -1).reverse()];
    recorrido.forEach((n, i) => {
      const dur = i === recorrido.length - 1 ? corchea * 3 : corchea;
      eventos.push({ midi: n.midi, inicio: t, duracion: dur * 0.95 });
      pasos.push({ inicio: t, fin: t + dur, notas: [n] });
      t += dur;
    });
  }
  return { eventos, pasos, duracion: t + corchea };
}

// --- Dibujo ------------------------------------------------------------------------------

const TRASTES = 15;
const ANCHO_TRASTE = 46;
const SEP_CUERDA = 26;
const MARGEN_IZQ = 34;
const MARGEN_SUP = 16;
const MARGEN_INF = 26;
const RADIO = 11;
const MARCAS = [3, 5, 7, 9, 15];

export type Rotulo = 'grado' | 'nota';

/**
 * SVG del mástil (1ª cuerda arriba) con la zona marcada y las capas hasta `actual`:
 * la actual en primer plano y, con `acumular`, las anteriores atenuadas detrás (si dos
 * capas tienen nota en el mismo sitio, se ve la más reciente). Las notas de los
 * voicings de la capa actual se unen con una línea.
 */
export function mastilCapasSVG(
  lista: readonly Capa[],
  actual: number,
  z: ZonaCaged,
  acumular = true,
  rotulo: Rotulo = 'grado',
  /** Índice del voicing de la capa actual que se destaca (el resto, atenuado); sin él, todos. */
  voicing?: number,
): string {
  const ancho = MARGEN_IZQ + ANCHO_TRASTE * (TRASTES + 0.5);
  const alto = MARGEN_SUP + SEP_CUERDA * 5 + MARGEN_INF;
  const yCuerda = (c: number) => MARGEN_SUP + SEP_CUERDA * (5 - c);
  const xTraste = (t: number) => MARGEN_IZQ + ANCHO_TRASTE * t;
  const xNota = (t: number) => (t === 0 ? MARGEN_IZQ - 16 : xTraste(t) - ANCHO_TRASTE / 2);
  const partes: string[] = [];

  const x0 = z.desde <= 0 ? MARGEN_IZQ - 30 : xTraste(z.desde - 1);
  partes.push(`<rect class="zona" x="${x0}" y="${MARGEN_SUP - 12}" width="${xTraste(z.hasta) - x0}" height="${SEP_CUERDA * 5 + 24}" rx="6"/>`);
  for (const m of MARCAS) partes.push(`<circle class="marca" cx="${xTraste(m) - ANCHO_TRASTE / 2}" cy="${alto - 10}" r="3.5"/>`);
  partes.push(
    `<circle class="marca" cx="${xTraste(12) - ANCHO_TRASTE / 2 - 6}" cy="${alto - 10}" r="3.5"/><circle class="marca" cx="${xTraste(12) - ANCHO_TRASTE / 2 + 6}" cy="${alto - 10}" r="3.5"/>`,
  );
  for (let t = 1; t <= TRASTES; t++) partes.push(`<line class="traste" x1="${xTraste(t)}" y1="${yCuerda(5)}" x2="${xTraste(t)}" y2="${yCuerda(0)}"/>`);
  partes.push(`<rect class="cejuela" x="${MARGEN_IZQ - 3}" y="${yCuerda(5) - 1}" width="5" height="${SEP_CUERDA * 5 + 2}"/>`);
  for (let c = 0; c < 6; c++) partes.push(`<line class="cuerda" x1="${MARGEN_IZQ}" y1="${yCuerda(c)}" x2="${xTraste(TRASTES)}" y2="${yCuerda(c)}"/>`);

  // Voicings de la capa actual: una línea por las notas, de la cuerda grave a la aguda.
  const capa = lista[actual];
  if (capa) {
    for (const [i, f] of capa.formas.entries()) {
      if (voicing !== undefined && i !== voicing) continue;
      const puntos = [...f].sort((a, b) => a.cuerda - b.cuerda).map((n) => `${xNota(n.traste)},${yCuerda(n.cuerda)}`);
      if (puntos.length > 1) partes.push(`<polyline class="forma" points="${puntos.join(' ')}"/>`);
    }
  }

  // Una nota por sitio: la de la capa más reciente.
  const sitios = new Map<string, { n: NotaMastil; k: number }>();
  lista.forEach((c, k) => {
    if (k > actual || (!acumular && k !== actual)) return;
    for (const n of c.notas) sitios.set(`${n.cuerda}:${n.traste}`, { n, k });
  });
  const elegido = voicing !== undefined ? capa?.formas[voicing] : undefined;
  const enElegido = (n: NotaMastil) => !elegido || elegido.some((x) => x.cuerda === n.cuerda && x.traste === n.traste);
  for (const { n, k } of [...sitios.values()].sort((a, b) => a.k - b.k)) {
    const atras = k < actual || !enElegido(n);
    const clases = ['nota', n.grado === '1' ? 'raiz' : '', n.delAcorde === false ? 'de-escala' : '', atras ? 'anterior' : 'actual'].filter(Boolean).join(' ');
    const texto = rotulo === 'nota' ? n.nota : n.grado;
    const x = xNota(n.traste);
    const y = yCuerda(n.cuerda);
    partes.push(
      `<g class="${clases}" data-midi="${n.midi}" data-cuerda="${n.cuerda}"><circle cx="${x}" cy="${y}" r="${RADIO}"/>` +
        `<text class="grado${texto.length > 2 ? ' largo' : ''}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${texto}</text></g>`,
    );
  }
  const etiqueta = capa ? `Mástil: ${capa.nombre}, trastes ${z.desde}–${z.hasta}` : 'Mástil';
  return `<svg class="mastil capas" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${etiqueta}" xmlns="http://www.w3.org/2000/svg">${partes.join('')}</svg>`;
}

/** Cuerdas de un voicing, de grave a aguda: «5-4-3». */
export const cuerdasVoicing = (f: readonly NotaMastil[]) =>
  [...f]
    .sort((a, b) => a.cuerda - b.cuerda)
    .map((n) => 6 - n.cuerda)
    .join('-');

/** Nombre del acorde (para el título). */
export const simboloCapas = (raiz: string, c: CualidadCapas) => simboloEn(raiz, parseAcordeGrado(c.romano));
