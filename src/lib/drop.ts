// Voicings por grupos de cuerdas: tríadas (cerradas o abiertas) y cuatriadas en
// drop 2 y drop 3. Drop 2 / drop 3: la posición cerrada con la segunda / tercera voz
// empezando por arriba bajada una octava. Tríada abierta: la cerrada con la voz
// central bajada una octava (el "drop 2" de una tríada). Aquí se calculan sus
// inversiones en un grupo de cuerdas y su encadenamiento a lo largo de una
// progresión. Funciones puras, sin DOM.
import { simboloEn, type AcordeGrado } from './progresiones.ts';
import { AFINACION, ligarRepetidos, type Evento } from './secuencias.ts';
import { notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

/** Grupos de cuerdas (índice 0 = 6ª) y el tipo de voicing que se toca en cada uno. */
export const GRUPOS_CUERDAS = [
  { id: '654', nombre: 'Cuerdas 6-5-4', cuerdas: [0, 1, 2], tipo: 'triada' },
  { id: '543', nombre: 'Cuerdas 5-4-3', cuerdas: [1, 2, 3], tipo: 'triada' },
  { id: '432', nombre: 'Cuerdas 4-3-2', cuerdas: [2, 3, 4], tipo: 'triada' },
  { id: '321', nombre: 'Cuerdas 3-2-1', cuerdas: [3, 4, 5], tipo: 'triada' },
  { id: '643', nombre: 'Cuerdas 6-4-3 (abierta)', cuerdas: [0, 2, 3], tipo: 'triada-abierta' },
  { id: '532', nombre: 'Cuerdas 5-3-2 (abierta)', cuerdas: [1, 3, 4], tipo: 'triada-abierta' },
  { id: '421', nombre: 'Cuerdas 4-2-1 (abierta)', cuerdas: [2, 4, 5], tipo: 'triada-abierta' },
  { id: '4321', nombre: 'Cuerdas 4-3-2-1', cuerdas: [2, 3, 4, 5], tipo: 'drop2' },
  { id: '5432', nombre: 'Cuerdas 5-4-3-2', cuerdas: [1, 2, 3, 4], tipo: 'drop2' },
  { id: '6543', nombre: 'Cuerdas 6-5-4-3', cuerdas: [0, 1, 2, 3], tipo: 'drop2' },
  { id: '6432', nombre: 'Cuerdas 6-4-3-2', cuerdas: [0, 2, 3, 4], tipo: 'drop3' },
  { id: '5321', nombre: 'Cuerdas 5-3-2-1', cuerdas: [1, 3, 4, 5], tipo: 'drop3' },
] as const;
export type IdGrupo = (typeof GRUPOS_CUERDAS)[number]['id'];
export type TipoDrop = (typeof GRUPOS_CUERDAS)[number]['tipo'];
export const gruposDe = (...tipos: TipoDrop[]) => GRUPOS_CUERDAS.filter((g) => tipos.includes(g.tipo));

export interface Drop {
  simbolo: string;
  romano: string;
  /** Inversión según la nota del bajo: Fundamental, 1ª, 2ª o 3ª. */
  inversion: string;
  /** Grado de la voz aguda (la "melodía"). */
  arriba: string;
  trastes: Traste[];
  grados: string[];
}

const mod = (n: number, m = 12) => ((n % m) + m) % m;
const num = (g: string) => g.replace(/^[b#]+/, '');

/**
 * Las cuatro notas del voicing: si el acorde tiene cuatro, esas; si es una tríada,
 * con la raíz doblada; si tiene más, sin la 5 (o sin la raíz, en el alterado).
 */
export function cuatroNotas(formula: readonly string[]): string[] {
  if (formula.length === 4) return [...formula];
  if (formula.length === 3) return [...formula, '1'];
  const sin5 = formula.filter((g) => num(g) !== '5');
  return (sin5.length === 4 ? sin5 : formula.filter((g) => g !== '1')).slice(0, 4);
}

/**
 * Las tres notas de una tríada: raíz, 3 (o 4 en los sus) y 5 (o b5, #5). Sin 5
 * (como en el 7alt), la b7.
 */
export function tresNotas(formula: readonly string[]): string[] {
  const busca = (...nums: string[]) => nums.map((n) => formula.find((g) => num(g) === n)).find(Boolean);
  return ['1', busca('3', '4') ?? formula[1], busca('5') ?? busca('7') ?? formula[2]];
}

const NOMBRE_INVERSION: Record<string, string> = { '1': 'Fundamental', '3': '1ª inversión', '4': '1ª inversión', '5': '2ª inversión', '7': '3ª inversión', '6': '3ª inversión' };

/** Orden de las voces (de grave a agudo) a partir de la posición cerrada, según el tipo. */
function disponer(cerrada: string[], tipo: TipoDrop): string[] {
  switch (tipo) {
    case 'drop2': // la segunda voz desde arriba (índice 2) pasa al bajo
      return [cerrada[2], cerrada[0], cerrada[1], cerrada[3]];
    case 'drop3': // la tercera voz desde arriba (índice 1)
      return [cerrada[1], cerrada[0], cerrada[2], cerrada[3]];
    case 'triada-abierta': // la voz central de la tríada
      return [cerrada[1], cerrada[0], cerrada[2]];
    default:
      return cerrada;
  }
}

/** Las inversiones de un acorde en un grupo de cuerdas (tríada, drop 2 o drop 3 según el grupo), en todo el mástil. */
export function inversionesDrop(tonica: string, a: AcordeGrado, grupo: IdGrupo, trasteMax = 15): Drop[] {
  const { cuerdas, tipo } = GRUPOS_CUERDAS.find((g) => g.id === grupo)!;
  const raiz = pitchClass(notaDeGrado(tonica, a.grado));
  const triada = tipo === 'triada' || tipo === 'triada-abierta';
  // Grados en orden de la posición cerrada fundamental (de grave a agudo).
  const grados = (triada ? tresNotas(a.formula) : cuatroNotas(a.formula)).sort((x, y) => mod(semitonosGrado(x)) - mod(semitonosGrado(y)));
  const voces = grados.length;
  const res: Drop[] = [];
  for (let inv = 0; inv < voces; inv++) {
    const cerrada = [...grados.slice(inv), ...grados.slice(0, inv)];
    const orden = disponer(cerrada, tipo);
    for (let base = 1; base <= trasteMax; base++) {
      if (mod(AFINACION[cuerdas[0]] + base) !== mod(raiz + semitonosGrado(orden[0]))) continue;
      let altura = AFINACION[cuerdas[0]] + base;
      const trastesVoces = [base];
      for (let i = 1; i < voces; i++) {
        const pc = mod(raiz + semitonosGrado(orden[i]));
        altura += mod(pc - altura) || 12;
        trastesVoces.push(altura - AFINACION[cuerdas[i]]);
      }
      if (trastesVoces.some((t) => t < 1 || t > trasteMax + 3)) continue;
      // Apertura máxima: 4 trastes (5 en las tríadas abiertas, que separan mucho las voces).
      if (Math.max(...trastesVoces) - Math.min(...trastesVoces) > (tipo === 'triada-abierta' ? 5 : 4)) continue;
      const trastes: Traste[] = ['x', 'x', 'x', 'x', 'x', 'x'];
      const gradosCuerda = ['', '', '', '', '', ''];
      cuerdas.forEach((c, i) => {
        trastes[c] = trastesVoces[i];
        gradosCuerda[c] = orden[i];
      });
      res.push({
        simbolo: simboloEn(tonica, { ...a, bajo: undefined }),
        romano: a.texto,
        inversion: NOMBRE_INVERSION[num(orden[0])] ?? `Bajo en ${orden[0]}`,
        arriba: orden[voces - 1],
        trastes,
        grados: gradosCuerda,
      });
    }
  }
  return res;
}

const pisados = (d: Drop) => d.trastes.filter((t): t is number => t !== 'x');
const centro = (d: Drop) => pisados(d).reduce((x, y) => x + y, 0) / pisados(d).length;
const alturas = (d: Drop) => d.trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t]));

/** Las inversiones (3 en tríadas, 4 en cuatriadas) en orden ascendente por el mástil, empezando por la más grave. */
export function escaleraInversiones(tonica: string, a: AcordeGrado, grupo: IdGrupo): Drop[] {
  const todas = inversionesDrop(tonica, a, grupo).sort((x, y) => centro(x) - centro(y));
  return todas.slice(0, new Set(todas.map((d) => d.inversion)).size);
}

/**
 * Una progresión en drop 2 o drop 3: la secuencia de inversiones que menos mueve
 * la mano y las voces (programación dinámica), en uno o varios grupos de cuerdas
 * (con varios, puede cambiar de grupo entre acordes). El primer acorde empieza
 * cerca del traste `alrededor`. Con `soloFundamental`, todos llevan la raíz en el
 * bajo (si un acorde no tiene esa forma, se aceptan sus inversiones).
 */
export function dropProgresion(
  tonica: string,
  compases: readonly AcordeGrado[][],
  grupos: IdGrupo | readonly IdGrupo[],
  alrededor = 5,
  soloFundamental = false,
): Drop[] {
  const acordes = compases.flat();
  const lista: readonly IdGrupo[] = typeof grupos === 'string' ? [grupos] : grupos;
  const opciones = acordes.map((a, i) => {
    const posibles = lista.flatMap((g) => inversionesDrop(tonica, a, g));
    const fundamentales = soloFundamental ? posibles.filter((d) => d.inversion === 'Fundamental') : [];
    const todas = fundamentales.length ? fundamentales : posibles;
    const enZona = i === 0 ? todas.filter((d) => pisados(d).every((t) => t >= alrededor - 3 && t <= alrededor + 3)) : [];
    return enZona.length ? enZona : todas;
  });
  if (opciones.some((o) => o.length === 0)) throw new Error('Algún acorde no cabe en estas cuerdas.');
  const coste = (p: Drop, s: Drop) => {
    // Mano y voces de arriba (el bajo puede saltar: en drop 3 hace de línea de bajo).
    const [ap, as] = [alturas(p).slice(1), alturas(s).slice(1)];
    return Math.abs(centro(p) - centro(s)) * 1.2 + ap.reduce((t, m, i) => t + Math.abs(m - as[i]), 0) * 0.3;
  };
  let costes = opciones[0].map((d) => Math.abs(centro(d) - alrededor) * 0.3);
  const previo: number[][] = [opciones[0].map(() => -1)];
  for (let i = 1; i < opciones.length; i++) {
    const nuevos: number[] = [];
    const desde: number[] = [];
    for (const s of opciones[i]) {
      let mejor = Infinity;
      let k = -1;
      opciones[i - 1].forEach((p, j) => {
        const c = costes[j] + coste(p, s) + Math.abs(centro(s) - alrededor) * 0.15;
        if (c < mejor) [mejor, k] = [c, j];
      });
      nuevos.push(mejor);
      desde.push(k);
    }
    costes = nuevos;
    previo.push(desde);
  }
  let k = costes.indexOf(Math.min(...costes));
  const res: Drop[] = [];
  for (let i = opciones.length - 1; i >= 0; i--) {
    res.unshift(opciones[i][k]);
    k = previo[i][k];
  }
  return res;
}

/** Audio: cada voicing dura lo indicado en pulsos (rasgueo muy corto). */
export function eventosDrop(voicings: readonly Drop[], pulsos: readonly number[], bpm: number, sostenido = false) {
  const pulso = 60 / bpm;
  const eventos: Evento[] = [];
  const tramos: { inicio: number; fin: number }[] = [];
  let t = 0;
  voicings.forEach((d, k) => {
    const dur = pulsos[k] * pulso;
    alturas(d).forEach((midi, i) =>
      eventos.push({ midi, inicio: t + (sostenido ? 0 : i * 0.02), duracion: sostenido ? dur : dur * 0.9 - i * 0.02 }),
    );
    tramos.push({ inicio: t, fin: t + dur });
    t += dur;
  });
  return { eventos: sostenido ? ligarRepetidos(eventos) : eventos, tramos, duracion: t };
}
