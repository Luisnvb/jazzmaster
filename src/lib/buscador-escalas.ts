// Buscador de escalas (Herramientas): qué escalas del diccionario (escalas.yaml)
// contienen unas notas, un acorde o varios acordes seguidos (Dm7 G7 → notas de los
// dos). Prueba cada escala en las 12 tónicas y ordena: primero las que empiezan en la
// raíz del (primer) acorde, en el orden del diccionario (el habitual para cada tipo de
// acorde); después las demás, las que añaden menos notas antes. Funciones puras, sin DOM.
import { leerNotas } from './buscador-acordes.ts';
import { leerCifrado } from './cifrado-acorde.ts';
import { formatNota, notasDeFormula, parseNota, pitchClass } from './teoria.ts';

export interface EscalaDatos {
  id: string;
  nombre: string;
  grupo: string;
  formula: string[];
}

export interface EntradaEscalas {
  /** Notas sin repetir sonidos, en el orden en que aparecen. */
  notas: string[];
  /** Raíz del primer acorde escrito (o null si solo hay notas). */
  raiz: string | null;
  /** Acordes reconocidos, tal como se escribieron. */
  acordes: string[];
  /** Trozos que no son ni nota ni acorde. */
  errores: string[];
}

/**
 * Lee lo escrito: notas sueltas (C E G, do mi sol) o acordes (Dm7 G7). Un trozo que
 * es a la vez nota y acorde (C, Bb) cuenta como acorde solo si no hay notas sueltas
 * de otro tipo: «C E G» son tres notas; «C F G7» son tres acordes.
 */
export function leerEntrada(texto: string): EntradaEscalas {
  const trozos = texto.split(/[\s,;|]+/).filter(Boolean);
  // ¿Hay algún acorde que no pueda ser una nota? Entonces todo lo que sea acorde es acorde.
  const hayAcordes = trozos.some((t) => leerNotas(t).notas.length === 0 && leerCifrado(t));
  const notas: string[] = [];
  const vistos = new Set<number>();
  const acordes: string[] = [];
  const errores: string[] = [];
  let raiz: string | null = null;
  const sumar = (n: string) => {
    const pc = pitchClass(parseNota(n));
    if (!vistos.has(pc)) {
      vistos.add(pc);
      notas.push(n);
    }
  };
  for (const t of trozos) {
    const acorde = hayAcordes ? leerCifrado(t) : null;
    if (acorde) {
      acordes.push(t);
      raiz ??= acorde.raiz;
      acorde.notas.forEach(sumar);
      continue;
    }
    const n = leerNotas(t).notas;
    if (n.length) n.forEach(sumar);
    else errores.push(t);
  }
  return { notas, raiz, acordes, errores };
}

export interface Coincidencia {
  escala: EscalaDatos;
  tonica: string;
  notas: string[];
  /** Notas de la escala que no estaban en la entrada. */
  extra: number;
  /** Si la tónica es la raíz del acorde (o la primera nota). */
  enLaRaiz: boolean;
}

const GRAFIA = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Tónica de cada sonido: como se escribió en la entrada, o la grafía habitual. */
const tonicaPara = (pc: number, escritas: readonly string[]) => escritas.find((n) => pitchClass(parseNota(n)) === pc) ?? GRAFIA[pc];

/**
 * Escalas que contienen todas las notas, de más a menos probable. Con `soloRaiz`, solo
 * las que empiezan en la raíz (o la primera nota). Con menos de dos notas, ninguna.
 */
export function buscarEscalas(entrada: Pick<EntradaEscalas, 'notas' | 'raiz'>, escalas: readonly EscalaDatos[], soloRaiz = false): Coincidencia[] {
  if (entrada.notas.length < 2) return [];
  const pcs = new Set(entrada.notas.map((n) => pitchClass(parseNota(n))));
  const raiz = entrada.raiz ?? entrada.notas[0];
  const pcRaiz = pitchClass(parseNota(raiz));
  const res: (Coincidencia & { orden: number })[] = [];
  escalas.forEach((escala, orden) => {
    for (let pc = 0; pc < 12; pc++) {
      if (soloRaiz && pc !== pcRaiz) continue;
      const tonica = pc === pcRaiz ? formatNota(parseNota(raiz)) : tonicaPara(pc, entrada.notas);
      let notas: string[];
      try {
        notas = notasDeFormula(tonica, escala.formula);
      } catch {
        continue;
      }
      const deEscala = new Set(notas.map((n) => pitchClass(parseNota(n))));
      if (![...pcs].every((x) => deEscala.has(x))) continue;
      res.push({ escala, tonica, notas, extra: deEscala.size - pcs.size, enLaRaiz: pc === pcRaiz, orden });
    }
  });
  return res
    .sort((a, b) => Number(b.enLaRaiz) - Number(a.enLaRaiz) || (a.enLaRaiz ? 0 : a.extra - b.extra) || a.orden - b.orden || a.tonica.localeCompare(b.tonica))
    .map(({ orden: _, ...c }) => c);
}

/**
 * Escalas con las mismas notas (modos de una misma escala madre): clave para agruparlas.
 * C jónico, D dórico y A eólico dan la misma.
 */
export const claveNotas = (c: Coincidencia) =>
  [...new Set(c.notas.map((n) => pitchClass(parseNota(n))))].sort((a, b) => a - b).join(',');
