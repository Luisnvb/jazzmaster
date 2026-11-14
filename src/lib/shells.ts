// Shell voicings: raíz + 3 + 7 (tres notas) con la raíz en la 6ª o la 5ª cuerda,
// y la elección de formas a lo largo de una progresión para que la mano se mueva
// lo mínimo. Funciones puras, sin DOM.
import { gradosGuia } from './notas-guia.ts';
import { simboloEn, type AcordeGrado } from './progresiones.ts';
import { AFINACION, ligarRepetidos, type Evento } from './secuencias.ts';
import { notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

/**
 * Grupos de cuerdas de los shells (índice 0 = 6ª). Las cuatro formas clásicas son
 * 1-7-3 en 6-4-3, 1-3-7 en 6-5-4, 1-3-7 en 5-4-3 y 1-7-3 en 5-3-2; en cada grupo se
 * prueban los dos órdenes de las voces de arriba, y así caben también tríadas e inversiones.
 */
const CUERDAS_SHELL = [
  [0, 2, 3],
  [0, 1, 2],
  [1, 2, 3],
  [1, 3, 4],
] as const;

export interface Shell {
  simbolo: string;
  romano: string;
  /** Cuerda del bajo y orden de las voces: "Bajo en 6ª · 1-b7-3". */
  forma: string;
  trastes: Traste[];
  grados: string[];
}

const mod = (n: number, m = 12) => ((n % m) + m) % m;
const TRASTE_MIN = 1;
const TRASTE_MAX = 15;

/** Tensión que se añade encima según el tipo de acorde (null si no tiene una clara). */
const TENSION: Record<string, string | null> = {
  maj7: '9',
  m7: '9',
  mmaj7: '9',
  dom7: '13',
  sus: '9',
  alt7: 'b9',
  aug: '9',
  m7b5: '11',
  dim7: null,
};

/** Notas de un acorde para el shell: bajo y las dos de encima (3 y 7, o lo que haga sus veces). */
function notasShell(a: AcordeGrado): { bajo: string; guia: [string, string] } {
  const [tercera, otras] = gradosGuia(a.formula);
  const septima = otras.length > 1 ? (otras.find((g) => g.replace(/^[b#]+/, '') === '5') ?? otras[0]) : otras[0];
  const bajo = a.bajo ?? '1';
  // Con inversión, la nota del bajo deja su sitio arriba a la raíz.
  const guia = [tercera, septima].map((g) => (g === bajo ? '1' : g)) as [string, string];
  return { bajo, guia };
}

/** Todas las colocaciones posibles de los shells de un acorde. */
function candidatos(tonica: string, a: AcordeGrado): Shell[] {
  const raiz = pitchClass(notaDeGrado(tonica, a.grado));
  const { bajo, guia } = notasShell(a);
  const pc = (g: string) => mod(raiz + semitonosGrado(g));
  const res: Shell[] = [];
  for (const cuerdas of CUERDAS_SHELL) for (const grados of [[bajo, guia[0], guia[1]], [bajo, guia[1], guia[0]]]) {
    const f = { cuerdas, id: `Bajo en ${6 - cuerdas[0]}ª · ${grados.join('-')}` };
    for (let base = TRASTE_MIN; base <= TRASTE_MAX; base++) {
      if (mod(AFINACION[f.cuerdas[0]] + base) !== pc(bajo)) continue;
      // Cada voz en el traste más cercano al del bajo (dentro de una apertura de 4 trastes).
      const trastesVoces = f.cuerdas.map((c, i) => {
        if (i === 0) return base;
        const t0 = mod(pc(grados[i]) - AFINACION[c]);
        const opciones = [t0, t0 + 12, t0 - 12].filter((t) => t >= TRASTE_MIN && t <= TRASTE_MAX + 2);
        return opciones.sort((x, y) => Math.abs(x - base - 0.5) - Math.abs(y - base - 0.5))[0];
      });
      if (trastesVoces.some((t) => t === undefined)) continue;
      // Apertura de hasta 4 trastes (la de 4 solo cuando no hay otra: tríadas disminuidas, inversiones).
      if (Math.max(...trastesVoces) - Math.min(...trastesVoces) > 4) continue;
      const alturas = f.cuerdas.map((c, i) => AFINACION[c] + trastesVoces[i]);
      if (!alturas.every((m, i) => i === 0 || m > alturas[i - 1])) continue;
      const trastes: Traste[] = ['x', 'x', 'x', 'x', 'x', 'x'];
      const gradosCuerda = ['', '', '', '', '', ''];
      f.cuerdas.forEach((c, i) => {
        trastes[c] = trastesVoces[i];
        gradosCuerda[c] = grados[i];
      });
      res.push({ simbolo: simboloEn(tonica, a), romano: a.texto, forma: f.id, trastes, grados: gradosCuerda });
    }
  }
  return res;
}

const pisados = (s: Shell) => s.trastes.filter((t): t is number => t !== 'x');
const centro = (s: Shell) => pisados(s).reduce((x, y) => x + y, 0) / pisados(s).length;
const alturasDe = (s: Shell) => s.trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t]));
/** Penalización por estirar la mano (apertura de 4 trastes). */
const estiramiento = (s: Shell) => (Math.max(...pisados(s)) - Math.min(...pisados(s)) > 3 ? 6 : 0);

/** Coste de pasar de un shell a otro: desplazamiento de la mano y movimiento de las voces superiores. */
function coste(a: Shell, b: Shell): number {
  const va = alturasDe(a).slice(1);
  const vb = alturasDe(b).slice(1);
  const voces = Math.abs(va[0] - vb[0]) + Math.abs(va[1] - vb[1]);
  return Math.abs(centro(a) - centro(b)) * 1.5 + voces * 0.5 + estiramiento(b);
}

/**
 * Shells de una progresión: entre todas las colocaciones posibles, la secuencia
 * que menos mueve la mano y las voces (programación dinámica), empezando en la
 * zona del mástil alrededor del traste `alrededor`.
 */
export function shellsProgresion(tonica: string, compases: readonly AcordeGrado[][], alrededor = 5): Shell[] {
  const acordes = compases.flat();
  // Zona del mástil: el primer acorde empieza en una forma que cabe entre `alrededor` ± 3
  // trastes (si la hay); los demás la siguen con el mínimo movimiento.
  const dentro = (s: Shell) => pisados(s).every((t) => t >= alrededor - 3 && t <= alrededor + 3);
  const opciones = acordes.map((a, i) => {
    const todas = candidatos(tonica, a);
    const enZona = i === 0 ? todas.filter(dentro) : [];
    return enZona.length ? enZona : todas;
  });
  if (opciones.some((o) => o.length === 0)) throw new Error('Algún acorde no tiene shell posible.');
  // Cada acorde paga un poco por alejarse del centro de la zona.
  const zona = (s: Shell) => Math.abs(centro(s) - alrededor) * 0.3;
  let costes = opciones[0].map((s) => zona(s) + estiramiento(s));
  const previo: number[][] = [opciones[0].map(() => -1)];
  for (let i = 1; i < opciones.length; i++) {
    const nuevos: number[] = [];
    const desde: number[] = [];
    for (const s of opciones[i]) {
      let mejor = Infinity;
      let k = -1;
      opciones[i - 1].forEach((p, j) => {
        const c = costes[j] + coste(p, s) + zona(s);
        if (c < mejor) [mejor, k] = [c, j];
      });
      nuevos.push(mejor);
      desde.push(k);
    }
    costes = nuevos;
    previo.push(desde);
  }
  let k = costes.indexOf(Math.min(...costes));
  const res: Shell[] = [];
  for (let i = opciones.length - 1; i >= 0; i--) {
    res.unshift(opciones[i][k]);
    k = previo[i][k];
  }
  return res;
}

/**
 * Añade una tensión (9, 13…) en la cuerda siguiente a la voz más aguda, si cae
 * cerca de la forma. Devuelve el shell sin cambios si no hay una tensión clara o no cabe.
 */
export function conTension(s: Shell, a: AcordeGrado, tonica: string): Shell {
  const g = TENSION[a.grupo];
  if (!g) return s;
  const raiz = pitchClass(notaDeGrado(tonica, a.grado));
  const ultima = s.trastes.reduce<number>((u, t, c) => (t === 'x' ? u : c), -1);
  const p = pisados(s);
  const [min, max] = [Math.min(...p), Math.max(...p)];
  for (let c = ultima + 1; c < 6; c++) {
    const t0 = mod(raiz + semitonosGrado(g) - AFINACION[c]);
    const t = [t0, t0 + 12].find((x) => x >= Math.max(1, max - 3) && x <= min + 3);
    if (t === undefined) continue;
    const trastes = [...s.trastes];
    const grados = [...s.grados];
    trastes[c] = t;
    grados[c] = g;
    return { ...s, trastes, grados };
  }
  return s;
}

/** Audio: cada shell suena lo que dura su acorde (rasgueo muy corto, como un golpe de mano). */
export function eventosShells(
  compases: readonly AcordeGrado[][],
  shells: readonly Shell[],
  bpm: number,
  pulsos = 4,
  sostenido = false,
): { eventos: Evento[]; tramos: { inicio: number; fin: number }[]; duracion: number } {
  const pulso = 60 / bpm;
  const eventos: Evento[] = [];
  const tramos: { inicio: number; fin: number }[] = [];
  let t = 0;
  let k = 0;
  for (const acordes of compases) {
    const dur = (pulsos * pulso) / acordes.length;
    for (let j = 0; j < acordes.length; j++, k++) {
      alturasDe(shells[k]).forEach((midi, i) =>
        eventos.push({ midi, inicio: t + (sostenido ? 0 : i * 0.02), duracion: sostenido ? dur : dur * 0.9 - i * 0.02 }),
      );
      tramos.push({ inicio: t, fin: t + dur });
      t += dur;
    }
  }
  return { eventos: sostenido ? ligarRepetidos(eventos) : eventos, tramos, duracion: t };
}
