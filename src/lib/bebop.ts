// Lenguaje bebop: líneas de corcheas sobre una progresión con las notas del acorde
// en los tiempos fuertes. Escalas bebop, frase tipo «de la 3 a la 9», encierros
// encadenados y una mezcla de los tres. Funciones puras, sin DOM.
import { PATRONES as PATRONES_APROX, notasAproximacion, type Objetivo } from './aproximaciones.ts';
import { simboloEn, type AcordeGrado } from './progresiones.ts';
import { ligarRepetidos, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado, type Nota } from './teoria.ts';

export interface EscalaBebop {
  id: string;
  nombre: string;
  /** Ocho grados en orden ascendente. Los de posición par (1.º, 3.º, 5.º, 7.º) son las notas del acorde. */
  formula: string[];
  /** La nota de paso que se añade a la escala de siete notas (null en la disminuida, que ya tiene ocho). */
  paso: string | null;
  /** Acorde cuyas notas caen en los tiempos (C6 en la mayor, Cm7 en la menor…). */
  sobre: string;
}

export const ESCALAS_BEBOP: EscalaBebop[] = [
  { id: 'dominante', nombre: 'Dominante bebop', formula: ['1', '2', '3', '4', '5', '6', 'b7', '7'], paso: '7', sobre: '7' },
  { id: 'mayor', nombre: 'Mayor bebop', formula: ['1', '2', '3', '4', '5', '#5', '6', '7'], paso: '#5', sobre: '6' },
  { id: 'menor', nombre: 'Menor bebop', formula: ['1', '2', 'b3', '4', '5', '6', 'b7', '7'], paso: '7', sobre: 'm7' },
  { id: 'menor-melodica', nombre: 'Menor melódica bebop', formula: ['1', '2', 'b3', '4', '5', '#5', '6', '7'], paso: '#5', sobre: 'm6' },
  { id: 'semidisminuida', nombre: 'Locria bebop', formula: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7', '7'], paso: '7', sobre: 'm7b5' },
  { id: 'disminuida', nombre: 'Disminuida', formula: ['1', '2', 'b3', '4', 'b5', '#5', '6', '7'], paso: null, sobre: '°7' },
];

/** Escala bebop de cada tipo de acorde (grupo de grupos.yaml). Sus, alterado y aumentado usan la dominante. */
const ESCALA_DE_GRUPO: Record<string, string> = {
  maj7: 'mayor',
  m7: 'menor',
  mmaj7: 'menor-melodica',
  dom7: 'dominante',
  sus: 'dominante',
  alt7: 'dominante',
  aug: 'dominante',
  m7b5: 'semidisminuida',
  dim7: 'disminuida',
};

export const escalaBebopDe = (a: AcordeGrado): EscalaBebop =>
  ESCALAS_BEBOP.find((e) => e.id === (ESCALA_DE_GRUPO[a.grupo] ?? 'mayor'))!;

/** Grados que caen en los tiempos: los de posición par de la escala. */
export const gradosFuertes = (e: EscalaBebop) => e.formula.filter((_, i) => i % 2 === 0);

export type Recurso = 'escala' | 'arpegio' | 'encierros' | 'mezcla';

export const RECURSOS: { id: Recurso; nombre: string; descripcion: string }[] = [
  {
    id: 'escala',
    nombre: 'Escala bebop',
    descripcion:
      'Desde una nota del acorde, la escala bebop por grados en corcheas. Gracias a la nota de paso, cada tiempo cae en una nota del acorde.',
  },
  {
    id: 'arpegio',
    nombre: 'De la 3 a la 9',
    descripcion:
      'La frase tipo: arpegio subiendo desde la 3 hasta la 9 (b9 en el dominante que resuelve) y bajada por la escala bebop desde la raíz.',
  },
  {
    id: 'encierros',
    nombre: 'Encierros encadenados',
    descripcion:
      'Una nota del acorde en los tiempos 1 y 3, y entre medias un paso de la escala y un encierro (escala arriba, medio tono abajo) hacia la siguiente.',
  },
  {
    id: 'mezcla',
    nombre: 'Mezcla',
    descripcion: 'Arpegio y escala bebop alternando de un acorde a otro, con un encierro que lleva a la primera nota de cada acorde.',
  },
];

export type TipoNota = 'acorde' | 'tension' | 'escala' | 'cromatica';

export interface NotaLinea {
  midi: number;
  nota: string;
  /** Grado sobre el acorde (null en las cromáticas). */
  grado: string | null;
  tipo: TipoNota;
}

export interface BloqueLinea {
  acorde: AcordeGrado;
  simbolo: string;
  escala: EscalaBebop;
  /** Corchea en la que empieza el acorde, desde el principio de la progresión. */
  inicio: number;
  notas: NotaLinea[];
  /** Raíz del acorde en el bajo (MIDI). */
  bajo: number;
}

/** Registro de la línea: E3–D6, cómodo en la guitarra. */
const MIN = 52;
const MAX = 86;

/** Generador pseudoaleatorio con semilla (mulberry32): la misma semilla da la misma línea. */
export function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface NotaEscala {
  midi: number;
  grado: string;
  fuerte: boolean;
}

/** Contexto de un acorde: raíz, escala bebop y todas sus notas en el registro. */
interface Contexto {
  acorde: AcordeGrado;
  raiz: Nota;
  escala: EscalaBebop;
  lista: NotaEscala[];
}

function contexto(tonica: string, acorde: AcordeGrado): Contexto {
  const raiz = notaDeGrado(tonica, acorde.grado);
  const pc = pitchClass(raiz);
  const escala = escalaBebopDe(acorde);
  const lista: NotaEscala[] = [];
  for (let base = 24; base <= 108; base += 12) {
    escala.formula.forEach((g, i) => {
      const midi = base + pc + semitonosGrado(g);
      if (midi >= MIN - 12 && midi <= MAX + 12) lista.push({ midi, grado: g, fuerte: i % 2 === 0 });
    });
  }
  lista.sort((a, b) => a.midi - b.midi);
  return { acorde, raiz, escala, lista };
}

/** Grados que son notas del acorde (sus notas y los grados fuertes de la escala, p. ej. la 6 del mayor). */
function esDelAcorde(ctx: Contexto, grado: string): boolean {
  const pc = (g: string) => semitonosGrado(g) % 12;
  return [...ctx.acorde.formula.filter((g) => !/^(b|#)?(9|11|13)$/.test(g)), ...gradosFuertes(ctx.escala)].some((g) => pc(g) === pc(grado));
}

const TENSIONES = /^(b|#)?(9|11|13)$/;

function notaDe(ctx: Contexto, midi: number, grado: string): NotaLinea {
  const tipo: TipoNota = TENSIONES.test(grado) ? 'tension' : esDelAcorde(ctx, grado) ? 'acorde' : 'escala';
  return { midi, nota: formatNota(notaDeGrado(ctx.raiz, grado)), grado, tipo };
}

/** Elige la nota más cercana a `objetivo`; a veces (si está casi igual de cerca) la segunda, para variar. */
function elegir<T extends { midi: number }>(opciones: T[], objetivo: number, azar: () => number, evitar?: number): T {
  const orden = opciones
    .filter((o) => o.midi !== evitar)
    .sort((a, b) => Math.abs(a.midi - objetivo) - Math.abs(b.midi - objetivo));
  const [a, b] = orden;
  if (b && Math.abs(b.midi - objetivo) - Math.abs(a.midi - objetivo) <= 2 && azar() < 0.35) return b;
  return a;
}

/**
 * Recorre la escala por grados desde la posición `i`, `n` notas, cambiando de
 * dirección al llegar a los extremos del registro. Como cada paso alterna notas
 * del acorde y de paso, las del acorde siguen cayendo en las posiciones pares.
 */
function recorrer(ctx: Contexto, i: number, n: number, dir: 1 | -1): { notas: NotaLinea[]; dir: 1 | -1 } {
  const notas: NotaLinea[] = [];
  let d = dir;
  for (let k = 0; k < n; k++) {
    const x = ctx.lista[i];
    notas.push(notaDe(ctx, x.midi, x.grado));
    const sig = ctx.lista[i + d];
    if (!sig || sig.midi < MIN || sig.midi > MAX) d = -d as 1 | -1;
    i += d;
  }
  return { notas, dir: d };
}

/** Escala bebop: empieza en la nota del acorde más cercana a la anterior y sigue por grados. */
function bloqueEscala(ctx: Contexto, n: number, previa: number | null, dir: 1 | -1, azar: () => number) {
  const fuertes = ctx.lista.filter((x) => x.fuerte && x.midi >= 57 && x.midi <= 81);
  const inicio = elegir(fuertes, previa === null ? 67 : previa + dir, azar);
  const d: 1 | -1 = inicio.midi >= 76 ? -1 : inicio.midi <= 60 ? 1 : dir;
  return recorrer(ctx, ctx.lista.indexOf(inicio), n, d);
}

/** Grado de cada función del acorde (3, 5, 7) en su fórmula, con los de la escala bebop si faltan (tríadas). */
function gradoDe(ctx: Contexto, patron: RegExp, posicion: number): string {
  return ctx.acorde.formula.find((g) => patron.test(g)) ?? gradosFuertes(ctx.escala)[posicion];
}

/**
 * De la 3 a la 9: arpegio 3–5–7–9 subiendo y, desde la raíz de arriba, la escala
 * bebop bajando. En un dominante que resuelve una cuarta arriba (o alterado), b9.
 */
function bloqueArpegio(ctx: Contexto, n: number, previa: number | null, siguiente: Contexto | null) {
  const g3 = gradoDe(ctx, /^(b?3|4|2)$/, 1);
  // En el alterado (sin 5 en la fórmula) vale la b13.
  const g5 = gradoDe(ctx, /^(b|#)?5$|^b13$/, 2);
  const g7 = gradoDe(ctx, /^(b{0,2}7|6)$/, 3);
  const resuelve = siguiente && (pitchClass(siguiente.raiz) - pitchClass(ctx.raiz) + 12) % 12 === 5;
  const g9 = (ctx.acorde.grupo === 'dom7' && resuelve) || ctx.acorde.grupo === 'alt7' ? 'b9' : ctx.escala.formula[1] === 'b2' ? 'b9' : '9';
  const pcRaiz = pitchClass(ctx.raiz);
  const st = (g: string) => (pcRaiz + semitonosGrado(g)) % 12;
  // La 3 entre A3 y A#4, lo más cerca posible de la nota anterior.
  const opciones = [45, 57, 69].map((o) => o + ((st(g3) - (o % 12) + 12) % 12)).filter((m) => m >= 57 && m <= 70);
  const m3 = opciones.sort((a, b) => Math.abs(a - (previa ?? 64)) - Math.abs(b - (previa ?? 64)))[0];
  const sube = (desde: number, g: string) => desde + (((st(g) - (desde % 12) + 12) % 12) || 12);
  const m5 = sube(m3, g5);
  const m7 = sube(m5, g7);
  const m9 = sube(m7, g9);
  const arpegio = [notaDe(ctx, m3, g3), notaDe(ctx, m5, g5), notaDe(ctx, m7, g7), notaDe(ctx, m9, g9)].slice(0, n);
  if (n <= 4) return { notas: arpegio, dir: -1 as const };
  // La nota de la escala justo debajo de la 9 es la raíz (posición par): la bajada mantiene el orden.
  const i = ctx.lista.findLastIndex((x) => x.midi < m9);
  const resto = recorrer(ctx, i, n - 4, -1);
  return { notas: [...arpegio, ...resto.notas], dir: resto.dir };
}

const objetivo = (ctx: Contexto, tonica: string, nota: NotaLinea): Objetivo => ({
  acorde: ctx.acorde,
  simbolo: simboloEn(tonica, ctx.acorde),
  raiz: ctx.raiz,
  midi: nota.midi,
  grado: nota.grado ?? '1',
  nota: nota.nota,
  bajo: 0,
});

const patronAprox = (id: string) => PATRONES_APROX.find((p) => p.id === id)!;

/** Encierro (escala arriba, cromática abajo) o, si solo cabe una nota, cromática desde abajo. */
function encierroHacia(ctx: Contexto, tonica: string, destino: NotaLinea, huecos: number): NotaLinea[] {
  if (huecos <= 0) return [];
  const patron = patronAprox(huecos >= 2 ? 'encierro' : 'cromatica-abajo');
  return notasAproximacion(objetivo(ctx, tonica, destino), patron)
    .slice(0, -1)
    .map((n) => ({ midi: n.midi, nota: n.nota, grado: null, tipo: n.tipo === 'cromatica' ? 'cromatica' : 'escala' }));
}

/**
 * Línea bebop sobre una progresión: un bloque por acorde con sus corcheas.
 * `pulsos` es lo que dura cada compás; los acordes de un compás se lo reparten.
 */
export function lineaBebop(
  tonica: string,
  compases: readonly AcordeGrado[][],
  pulsos: number,
  recurso: Recurso,
  semilla = 1,
): BloqueLinea[] {
  const azar = aleatorio(semilla);
  const acordes: { ctx: Contexto; corcheas: number; inicio: number }[] = [];
  let inicio = 0;
  for (const compas of compases) {
    const total = pulsos * 2;
    compas.forEach((a, j) => {
      // Las corcheas del compás repartidas entre sus acordes, siempre en número par (tiempos enteros).
      const desde = Math.round((total * j) / compas.length / 2) * 2;
      const hasta = Math.round((total * (j + 1)) / compas.length / 2) * 2;
      acordes.push({ ctx: contexto(tonica, a), corcheas: hasta - desde, inicio: inicio + desde });
    });
    inicio += total;
  }
  const total = inicio;
  const bloques: BloqueLinea[] = acordes.map(({ ctx, inicio }) => {
    const pc = (pitchClass(ctx.raiz) + semitonosGrado(ctx.acorde.bajo ?? '1')) % 12;
    return { acorde: ctx.acorde, simbolo: simboloEn(tonica, ctx.acorde), escala: ctx.escala, inicio, notas: [], bajo: 43 + ((pc - 7 + 12) % 12) };
  });

  if (recurso === 'encierros') {
    // Objetivos: el principio de cada acorde y los tiempos 1 y 3 (corcheas múltiplo de 4).
    const objetivos: { b: number; pos: number; nota: NotaLinea }[] = [];
    let previa: number | null = null;
    let dir: 1 | -1 = -1;
    acordes.forEach(({ ctx, corcheas, inicio }, b) => {
      for (let pos = 0; pos < corcheas; pos++) {
        if (pos !== 0 && (inicio + pos) % 4 !== 0) continue;
        const fuertes = ctx.lista.filter((x) => x.fuerte && x.midi >= 57 && x.midi <= 81);
        const x = elegir(fuertes, previa === null ? 67 : previa + dir * 3, azar, previa ?? undefined);
        if (x.midi >= 77) dir = -1;
        else if (x.midi <= 61) dir = 1;
        previa = x.midi;
        objetivos.push({ b, pos, nota: notaDe(ctx, x.midi, x.grado) });
      }
    });
    objetivos.forEach((o, j) => {
      const sig = objetivos[(j + 1) % objetivos.length];
      const absO = acordes[o.b].inicio + o.pos;
      const absS = j + 1 < objetivos.length ? acordes[sig.b].inicio + sig.pos : total + acordes[sig.b].inicio + sig.pos;
      const huecos = absS - absO - 1;
      const ctx = acordes[o.b].ctx;
      const enc = encierroHacia(acordes[sig.b].ctx, tonica, sig.nota, Math.min(2, huecos));
      // Antes del encierro, pasos de la escala desde el objetivo hacia donde empieza el encierro.
      const relleno: NotaLinea[] = [];
      let i = ctx.lista.findIndex((x) => x.midi === o.nota.midi);
      const meta = enc[0]?.midi ?? sig.nota.midi;
      let d: 1 | -1 = meta >= o.nota.midi ? 1 : -1;
      for (let k = 0; k < huecos - enc.length; k++) {
        let s = ctx.lista[i + d];
        if (!s || s.midi === meta || (d === 1 ? s.midi > meta : s.midi < meta)) {
          d = -d as 1 | -1;
          s = ctx.lista[i + d];
        }
        i += d;
        relleno.push(notaDe(ctx, s.midi, s.grado));
      }
      bloques[o.b].notas.push(o.nota, ...relleno, ...enc);
    });
    return bloques;
  }

  // Escala, arpegio o mezcla: bloque a bloque, cada uno empieza cerca de donde acabó el anterior.
  let previa: number | null = null;
  let dir: 1 | -1 = -1;
  acordes.forEach(({ ctx, corcheas }, b) => {
    const siguiente = acordes[b + 1]?.ctx ?? acordes[0].ctx;
    // Si el acorde se repite (Imaj7 | Imaj7), la frase tipo no se repite: sigue la escala bebop.
    const repetido = b > 0 && acordes[b - 1].ctx.acorde.texto === ctx.acorde.texto;
    const tipo = recurso === 'mezcla' ? (b % 2 === 0 ? 'arpegio' : 'escala') : recurso === 'arpegio' && repetido ? 'escala' : recurso;
    const r = tipo === 'arpegio' ? bloqueArpegio(ctx, corcheas, previa, siguiente) : bloqueEscala(ctx, corcheas, previa, dir, azar);
    bloques[b].notas = r.notas;
    dir = r.dir;
    previa = r.notas[r.notas.length - 1].midi;
  });
  if (recurso === 'mezcla') {
    // Las dos últimas corcheas de cada acorde, un encierro hacia la primera nota del siguiente.
    bloques.forEach((bl, b) => {
      if (bl.notas.length < 6) return;
      const sig = bloques[(b + 1) % bloques.length];
      const enc = encierroHacia(acordes[(b + 1) % bloques.length].ctx, tonica, sig.notas[0], 2);
      bl.notas.splice(bl.notas.length - 2, 2, ...enc);
    });
  }
  return bloques;
}

/** Notas de una escala bebop desde una raíz, con la nota de paso y las del acorde marcadas. */
export function notasEscalaBebop(raiz: string, e: EscalaBebop): { nota: string; grado: string; fuerte: boolean; paso: boolean }[] {
  return e.formula.map((g, i) => ({ nota: formatNota(notaDeGrado(raiz, g)), grado: g, fuerte: i % 2 === 0, paso: g === e.paso }));
}

export interface OpcionesBebop {
  /** Proporción de la corchea larga (0.5 = corcheas iguales; 0.62 ≈ swing medio). */
  swing?: number;
  /** Bajo y notas guía (3 y 7) de fondo en cada acorde. */
  acorde?: boolean;
  /** Acordes de fondo mantenidos y ligados (pad, órgano). */
  sostenido?: boolean;
}

/**
 * Audio: la línea en corcheas (con swing si se pide) y, opcionalmente, el acorde
 * de fondo. Devuelve también cuándo suena cada nota (bloque y posición) para marcarla.
 */
export function secuenciaBebop(
  bloques: readonly BloqueLinea[],
  tonica: string,
  bpm: number,
  op: OpcionesBebop = {},
): { eventos: Evento[]; notas: { bloque: number; pos: number; inicio: number; fin: number }[]; duracion: number } {
  const pulso = 60 / bpm;
  const swing = op.swing ?? 0.5;
  const momento = (corchea: number) => Math.floor(corchea / 2) * pulso + (corchea % 2 ? swing * pulso : 0);
  const eventos: Evento[] = [];
  const notas: { bloque: number; pos: number; inicio: number; fin: number }[] = [];
  let final = 0;
  bloques.forEach((bl, b) => {
    bl.notas.forEach((n, k) => {
      const c = bl.inicio + k;
      const inicio = momento(c);
      const fin = momento(c + 1);
      eventos.push({ midi: n.midi, inicio, duracion: (fin - inicio) * 0.92 });
      notas.push({ bloque: b, pos: k, inicio, fin });
    });
    const desde = momento(bl.inicio);
    const hasta = momento(bl.inicio + bl.notas.length);
    final = Math.max(final, hasta);
    if (op.acorde) {
      const raiz = pitchClass(notaDeGrado(tonica, bl.acorde.grado));
      const guia = [bl.acorde.formula.find((g) => /^(b?3|4)$/.test(g)), bl.acorde.formula.find((g) => /^(b{0,2}7|6)$/.test(g))].filter(Boolean) as string[];
      const graves = guia.map((g) => 48 + ((raiz + semitonosGrado(g) - 48 + 120) % 12));
      for (const midi of [bl.bajo, ...graves]) {
        eventos.push({ midi, inicio: desde, duracion: (hasta - desde) * (op.sostenido ? 1 : 0.9) });
      }
    }
  });
  return { eventos: op.sostenido ? ligarRepetidos(eventos) : eventos, notas, duracion: final };
}
