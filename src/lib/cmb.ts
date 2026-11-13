// Formato de cifrado del Chord Melody Builder (archivos .cmb.json, versión 4).
// https://www.noeljohnston.com/chord-melody-builder.html
//
// Un cifrado es una lista de compases; cada compás tiene una o varias celdas
// (acordes). Cada celda guarda la raíz, la calidad (type), la nota de la
// melodía como grado (interval) y la forma en el mástil:
//   vf.v       grado por cuerda, de 6ª a 1ª (null = apagada); vf.p = posición
//   editFrets  trastes puestos a mano, de 6ª a 1ª (null = apagada)
// Los campos que esta web no usa se conservan tal cual al editar y exportar.
import { catalogoFormas, gradoSuperior, gradosDeTrastes, trastesDeGrados, type Forma, type GradosCuerdas } from './formas.ts';
import { parseGrado, parseNota, pitchClass } from './teoria.ts';
import type { Traste } from './voicings.ts';

export const TIPOS = ['Major', 'Minor', 'Dominant', 'Half-Diminished', 'Diminished'] as const;
export type Tipo = (typeof TIPOS)[number];

export const NOMBRE_TIPO: Record<Tipo, string> = {
  Major: 'Mayor',
  Minor: 'Menor',
  Dominant: 'Dominante',
  'Half-Diminished': 'Semidisminuido',
  Diminished: 'Disminuido',
};

export interface CeldaCmb {
  id: number;
  root: string;
  type: string;
  interval?: string | null;
  comboIndex?: number;
  placeholder?: boolean;
  vf?: { v: (string | null)[]; p: number };
  editFrets?: (number | null)[];
  [campo: string]: unknown;
}

export interface CompasCmb {
  id: number;
  cells: CeldaCmb[];
  timeSig: { label: string; top: number; bottom: number } | null;
  section: string | null;
  repeatStart: boolean;
  repeatEnd: boolean;
  ending: number | string | null;
  lineBreakBefore: boolean;
  [campo: string]: unknown;
}

/** Datos propios de esta web que viajan dentro del archivo (el Builder los ignora). */
export interface ExtraPractica {
  tonalidad?: string | null;
  compas?: string | null;
  estructura?: string | null;
  instrumental?: boolean;
  letra?: string;
  notas?: string | null;
  enlaces?: { grabacion?: string; partitura?: string };
}

export interface Cmb {
  version: number;
  bars: CompasCmb[];
  title: string;
  composer: string;
  style?: string;
  tempoBpm?: number;
  timeSigLabel?: string;
  barsPerLine?: number;
  lineBreaksExplicit?: boolean;
  showDegrees?: boolean;
  halfDimSymbol?: string;
  spellingPreference?: string;
  nextId?: number;
  practica?: ExtraPractica;
  [campo: string]: unknown;
}

// --- Notación ---------------------------------------------------------------

/** Raíz del archivo → notación de la web: "C♯" → "C#", "B♭" → "Bb". */
export const raizWeb = (root: string) => root.trim().replace(/♯/g, '#').replace(/♭/g, 'b');
/** Raíz de la web → notación del archivo: "Bb" → "B♭". */
export const raizCmb = (nota: string) => nota.replace(/#/g, '♯').replace(/b/g, '♭');

/** Grado del archivo → notación de la web: "°7" → "bb7", "♭3" → "b3". */
export const gradoWeb = (g: string) => g.trim().replace(/^°7$/, 'bb7').replace(/♭/g, 'b').replace(/♯/g, '#');
/** Grado de la web → notación del archivo: "bb7" → "°7". */
export const gradoCmb = (g: string) => (g === 'bb7' ? '°7' : g);

/** Las doce raíces según la preferencia de ortografía del cifrado. */
export function raices(preferencia = 'flat'): string[] {
  return preferencia === 'sharp'
    ? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    : ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
}

// --- Validación ---------------------------------------------------------------

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Comprueba que un objeto tiene forma de cifrado .cmb.json y rellena los campos
 * que falten con valores por defecto. Lanza un error en español si no vale.
 */
export function validarCmb(datos: unknown): Cmb {
  if (!esObjeto(datos) || !Array.isArray(datos.bars)) throw new Error('No es un cifrado .cmb.json (falta la lista "bars").');
  let siguiente = 1;
  const usarId = (id: unknown) => {
    const n = typeof id === 'number' && Number.isFinite(id) ? id : siguiente;
    siguiente = Math.max(siguiente, n + 1);
    return n;
  };
  const bars = datos.bars.map((b, i): CompasCmb => {
    if (!esObjeto(b) || !Array.isArray(b.cells)) throw new Error(`El compás ${i + 1} no tiene celdas.`);
    const cells = b.cells.map((c, j): CeldaCmb => {
      if (!esObjeto(c) || typeof c.root !== 'string' || typeof c.type !== 'string') {
        throw new Error(`Compás ${i + 1}, acorde ${j + 1}: falta la raíz o el tipo.`);
      }
      try {
        parseNota(raizWeb(c.root));
      } catch {
        throw new Error(`Compás ${i + 1}, acorde ${j + 1}: raíz no válida "${c.root}".`);
      }
      const vf = esObjeto(c.vf) && Array.isArray(c.vf.v) && c.vf.v.length === 6 ? c.vf : undefined;
      for (const g of (vf?.v ?? []) as unknown[]) {
        if (g === null) continue;
        try {
          parseGrado(gradoWeb(String(g)));
        } catch {
          throw new Error(`Compás ${i + 1}, acorde ${j + 1}: grado no válido "${g}".`);
        }
      }
      return { ...c, id: usarId(c.id), root: c.root, type: c.type } as CeldaCmb;
    });
    return {
      ...b,
      id: usarId(b.id),
      cells,
      timeSig: esObjeto(b.timeSig) ? (b.timeSig as CompasCmb['timeSig']) : null,
      section: typeof b.section === 'string' && b.section ? b.section : null,
      repeatStart: Boolean(b.repeatStart),
      repeatEnd: Boolean(b.repeatEnd),
      ending: (b.ending as CompasCmb['ending']) ?? null,
      lineBreakBefore: Boolean(b.lineBreakBefore),
    };
  });
  return {
    ...datos,
    version: typeof datos.version === 'number' ? datos.version : 4,
    bars,
    title: typeof datos.title === 'string' ? datos.title : '',
    composer: typeof datos.composer === 'string' ? datos.composer : '',
    nextId: Math.max(siguiente, typeof datos.nextId === 'number' ? datos.nextId : 0),
  };
}

// --- Celdas -------------------------------------------------------------------

/** Ortografía preferida de los grados de cada calidad (para nombrar trastes puestos a mano). */
const PREFERIDOS: Record<string, string[]> = {
  Major: ['1', '2', '3', '#4', '5', '6', '7'],
  Minor: ['1', '2', 'b3', '4', '5', 'b6', '6', 'b7', '7'],
  Dominant: ['1', 'b2', '2', '#2', '3', '#4', '5', 'b6', '6', 'b7'],
  'Half-Diminished': ['1', 'b2', '2', 'b3', '4', 'b5', 'b6', 'b7'],
  Diminished: ['1', '2', 'b3', '4', 'b5', 'b6', 'bb7', '7'],
};

export const preferidosDeTipo = (tipo: string) => PREFERIDOS[tipo] ?? [];

export interface FormaCelda {
  trastes: Traste[];
  grados: string[];
}

/**
 * Forma de una celda en el mástil: trastes y grado de cada cuerda ('' = apagada).
 * Usa los trastes puestos a mano si los hay; si no, los grados de vf; si no,
 * la forma número `comboIndex` del catálogo (o la primera con esa nota arriba).
 */
export function formaDeCelda(celda: CeldaCmb, personales: Forma[] = []): FormaCelda | null {
  const raiz = raizWeb(celda.root);
  if (celda.placeholder) return null;
  if (Array.isArray(celda.editFrets) && celda.editFrets.length === 6 && celda.editFrets.some((t) => t !== null)) {
    const trastes = celda.editFrets.map((t) => (t === null ? 'x' : t)) as Traste[];
    return { trastes, grados: gradosDeTrastes(raiz, trastes, preferidosDeTipo(celda.type)) };
  }
  let grados: GradosCuerdas | undefined = celda.vf?.v.map((g) => (g ? gradoWeb(g) : null));
  let posicion = celda.vf?.p ?? 0;
  if (!grados) {
    const catalogo = catalogoFormas(celda.type, personales);
    const arriba = celda.interval ? gradoWeb(celda.interval) : null;
    const conNota = arriba ? catalogo.filter((f) => gradoSuperior(f.grados) === arriba) : [];
    const lista = conNota.length ? conNota : catalogo;
    grados = lista[Math.min(celda.comboIndex ?? 0, lista.length - 1)]?.grados;
    posicion = 0;
  }
  if (!grados) return null;
  const trastes = trastesDeGrados(raiz, grados, posicion);
  if (!trastes) return null;
  return { trastes, grados: grados.map((g) => g ?? '') };
}

/** Clases de altura (respecto a la raíz) presentes en una forma. */
function semitonosPresentes(grados: readonly string[]): Set<number> {
  const set = new Set<number>();
  for (const g of grados) {
    if (!g) continue;
    const { numero, alteracion } = parseGrado(g);
    const base = [0, 2, 4, 5, 7, 9, 11][(numero - 1) % 7];
    set.add((((base + alteracion) % 12) + 12) % 12);
  }
  return set;
}

/**
 * Cifrado de una celda: raíz + calidad, con las tensiones que suenan en su forma
 * (Dm7 con la 4 → Dm11; A7 con la b9 → A7b9; Cm con la 6 y sin 7 → Cm6).
 */
export function simboloCelda(celda: CeldaCmb, grados: readonly string[] = [], semidisminuido = 'o'): string {
  const raiz = raizWeb(celda.root);
  if (celda.placeholder) return '–';
  const s = semitonosPresentes(grados);
  const tiene = (n: number) => s.has(n);
  const conForma = grados.some(Boolean);
  let calidad: string;
  switch (celda.type) {
    case 'Major': {
      const nueve = tiene(2);
      if (tiene(11)) calidad = nueve ? 'maj9' : 'maj7';
      else if (tiene(9)) calidad = nueve ? '6/9' : '6';
      else calidad = conForma ? (nueve ? 'add9' : '') : 'maj7';
      if (tiene(6)) calidad += '#11';
      break;
    }
    case 'Minor': {
      const nueve = tiene(2);
      const once = tiene(5);
      if (tiene(11) && !tiene(10)) calidad = 'm(maj7)';
      else if (tiene(10) || !conForma) calidad = once ? 'm11' : nueve ? 'm9' : 'm7';
      else if (tiene(9)) calidad = nueve ? 'm6/9' : 'm6';
      else calidad = nueve ? 'm(add9)' : 'm';
      break;
    }
    case 'Dominant': {
      const sus = tiene(5) && !tiene(4);
      let base = tiene(9) ? '13' : tiene(2) ? '9' : '7';
      if (sus) base += 'sus4';
      const alteraciones = [
        [1, 'b9'],
        [3, '#9'],
        [6, '#11'],
        [8, 'b13'],
      ]
        .filter(([n]) => tiene(n as number) && !(n === 3 && !tiene(4)))
        .map(([, t]) => t);
      calidad = base + alteraciones.join('');
      break;
    }
    case 'Half-Diminished':
      calidad = semidisminuido === 'o' ? 'ø7' : 'm7(b5)';
      if (tiene(5)) calidad = semidisminuido === 'o' ? 'ø11' : 'm11(b5)';
      break;
    case 'Diminished':
      calidad = '°7';
      break;
    default:
      calidad = ` ${celda.type}`;
  }
  return raiz + calidad;
}

/** Grupo de acordes (grupos.yaml) de una celda, para enlazar con Acordes y Escalas. */
export function grupoDeCelda(celda: CeldaCmb, grados: readonly string[] = []): string | null {
  const s = semitonosPresentes(grados);
  switch (celda.type) {
    case 'Major':
      return 'maj7';
    case 'Minor':
      return s.has(11) && !s.has(10) ? 'mmaj7' : 'm7';
    case 'Dominant':
      return [1, 3, 8].some((n) => s.has(n) && !(n === 3 && !s.has(4))) ? 'alt7' : 'dom7';
    case 'Half-Diminished':
      return 'm7b5';
    case 'Diminished':
      return 'dim7';
    default:
      return null;
  }
}

/** Calidad del Builder que corresponde a un grupo de acordes de la web. */
export const TIPO_DE_GRUPO: Record<string, Tipo> = {
  maj7: 'Major',
  m7: 'Minor',
  mmaj7: 'Minor',
  dom7: 'Dominant',
  alt7: 'Dominant',
  m7b5: 'Half-Diminished',
  dim7: 'Diminished',
};

// --- Edición ------------------------------------------------------------------

/** Reserva un id nuevo para un compás o una celda. */
export function nuevoId(cmb: Cmb): number {
  const id = cmb.nextId ?? 1;
  cmb.nextId = id + 1;
  return id;
}

/** Celda con una forma de grados dada (la nota superior sale de la forma). */
export function celdaConForma(cmb: Cmb, root: string, type: string, grados: GradosCuerdas, comboIndex = 0): CeldaCmb {
  const arriba = gradoSuperior(grados);
  return {
    id: nuevoId(cmb),
    root,
    type,
    interval: arriba ? gradoCmb(arriba) : null,
    comboIndex,
    importedQuality: null,
    showBass: false,
    importedBass: null,
    placeholder: false,
    vf: { v: grados.map((g) => (g ? gradoCmb(g) : null)), p: 0 },
  };
}

export function compasVacio(cmb: Cmb, celdas: CeldaCmb[]): CompasCmb {
  return {
    id: nuevoId(cmb),
    cells: celdas,
    durationOverride: null,
    timeSig: null,
    section: null,
    repeatStart: false,
    repeatEnd: false,
    ending: null,
    lineBreakBefore: false,
  };
}

/** Compás de un tiempo: "4/4" → { label, top, bottom }. */
export function compasDeTexto(texto: string): CompasCmb['timeSig'] {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(texto.trim());
  return m ? { label: texto.trim(), top: Number(m[1]), bottom: Number(m[2]) } : null;
}

/** Cifrado nuevo con cuatro compases de Cmaj7. */
export function cmbNuevo(titulo = '', autor = ''): Cmb {
  const cmb: Cmb = {
    version: 4,
    bars: [],
    timeSigLabel: '4/4',
    defaultChordsPerBar: 2,
    spellingPreference: 'flat',
    halfDimSymbol: 'o',
    title: titulo,
    composer: autor,
    tempoMarking: '',
    style: '',
    barsPerLine: 4,
    lineBreaksExplicit: false,
    showAllNotes: false,
    tempoBpm: 120,
    showDegrees: true,
    nextId: 1,
  };
  const forma = catalogoFormas('Major')[0].grados;
  for (let i = 0; i < 4; i++) cmb.bars.push(compasVacio(cmb, [celdaConForma(cmb, 'C', 'Major', forma)]));
  cmb.bars[0].timeSig = compasDeTexto('4/4');
  return cmb;
}

/** Copia profunda (los cifrados son JSON puro). */
export const clonar = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Compases agrupados en líneas, según los saltos explícitos o los compases por línea. */
export function lineas(cmb: Cmb): CompasCmb[][] {
  const porLinea = Math.max(1, cmb.barsPerLine ?? 4);
  const res: CompasCmb[][] = [];
  cmb.bars.forEach((b, i) => {
    const nueva = cmb.lineBreaksExplicit ? i === 0 || b.lineBreakBefore : i % porLinea === 0;
    if (nueva || res.length === 0) res.push([]);
    res[res.length - 1].push(b);
  });
  return res;
}

/** Compás (tiempos) vigente en cada compás del cifrado. */
export function tiemposPorCompas(cmb: Cmb): number[] {
  let actual = compasDeTexto(cmb.timeSigLabel ?? '4/4')?.top ?? 4;
  return cmb.bars.map((b) => {
    if (b.timeSig?.top) actual = b.timeSig.top;
    return actual;
  });
}

/** ¿Misma clase de altura? (para casar raíces escritas con ♯ o ♭). */
export const mismaNota = (a: string, b: string) => {
  try {
    return pitchClass(parseNota(raizWeb(a))) === pitchClass(parseNota(raizWeb(b)));
  } catch {
    return false;
  }
};
