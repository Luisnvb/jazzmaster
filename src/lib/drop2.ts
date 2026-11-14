// Voicings drop 2: el acorde en posición cerrada con la segunda voz empezando por
// arriba bajada una octava. En guitarra caben en cuatro cuerdas seguidas. Aquí se
// calculan sus inversiones en un grupo de cuerdas y su encadenamiento a lo largo de
// una progresión. Funciones puras, sin DOM.
import { simboloEn, type AcordeGrado } from './progresiones.ts';
import { AFINACION, ligarRepetidos, type Evento } from './secuencias.ts';
import { notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

/** Grupos de cuatro cuerdas seguidas (índice 0 = 6ª), de agudo a grave. */
export const GRUPOS_CUERDAS = [
  { id: '4321', nombre: 'Cuerdas 4-3-2-1', cuerdas: [2, 3, 4, 5] },
  { id: '5432', nombre: 'Cuerdas 5-4-3-2', cuerdas: [1, 2, 3, 4] },
  { id: '6543', nombre: 'Cuerdas 6-5-4-3', cuerdas: [0, 1, 2, 3] },
] as const;
export type IdGrupo = (typeof GRUPOS_CUERDAS)[number]['id'];

export interface Drop2 {
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

const NOMBRE_INVERSION: Record<string, string> = { '1': 'Fundamental', '3': '1ª inversión', '4': '1ª inversión', '5': '2ª inversión', '7': '3ª inversión', '6': '3ª inversión' };

/** Las cuatro inversiones drop 2 de un acorde en un grupo de cuerdas, en todas las posiciones del mástil. */
export function inversionesDrop2(tonica: string, a: AcordeGrado, grupo: IdGrupo, trasteMax = 15): Drop2[] {
  const cuerdas = GRUPOS_CUERDAS.find((g) => g.id === grupo)!.cuerdas;
  const raiz = pitchClass(notaDeGrado(tonica, a.grado));
  // Grados en orden de la posición cerrada fundamental (de grave a agudo).
  const grados = cuatroNotas(a.formula).sort((x, y) => mod(semitonosGrado(x)) - mod(semitonosGrado(y)));
  const res: Drop2[] = [];
  for (let inv = 0; inv < 4; inv++) {
    const cerrada = [...grados.slice(inv), ...grados.slice(0, inv)];
    // Drop 2: la segunda voz desde arriba (índice 2) pasa al bajo.
    const orden = [cerrada[2], cerrada[0], cerrada[1], cerrada[3]];
    for (let base = 1; base <= trasteMax; base++) {
      if (mod(AFINACION[cuerdas[0]] + base) !== mod(raiz + semitonosGrado(orden[0]))) continue;
      let altura = AFINACION[cuerdas[0]] + base;
      const trastesVoces = [base];
      for (let i = 1; i < 4; i++) {
        const pc = mod(raiz + semitonosGrado(orden[i]));
        altura += mod(pc - altura) || 12;
        trastesVoces.push(altura - AFINACION[cuerdas[i]]);
      }
      if (trastesVoces.some((t) => t < 1 || t > trasteMax + 3)) continue;
      if (Math.max(...trastesVoces) - Math.min(...trastesVoces) > 4) continue;
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
        arriba: orden[3],
        trastes,
        grados: gradosCuerda,
      });
    }
  }
  return res;
}

const pisados = (d: Drop2) => d.trastes.filter((t): t is number => t !== 'x');
const centro = (d: Drop2) => pisados(d).reduce((x, y) => x + y, 0) / 4;
const alturas = (d: Drop2) => d.trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t]));

/** Las cuatro inversiones en orden ascendente por el mástil, empezando por la más grave. */
export function escaleraInversiones(tonica: string, a: AcordeGrado, grupo: IdGrupo): Drop2[] {
  const todas = inversionesDrop2(tonica, a, grupo).sort((x, y) => centro(x) - centro(y));
  return todas.slice(0, 4);
}

/**
 * Drop 2 de una progresión en un grupo de cuerdas: la secuencia de inversiones
 * que menos mueve la mano y las voces (programación dinámica). El primer acorde
 * empieza cerca del traste `alrededor`.
 */
export function drop2Progresion(tonica: string, compases: readonly AcordeGrado[][], grupo: IdGrupo, alrededor = 5): Drop2[] {
  const acordes = compases.flat();
  const opciones = acordes.map((a, i) => {
    const todas = inversionesDrop2(tonica, a, grupo);
    const enZona = i === 0 ? todas.filter((d) => pisados(d).every((t) => t >= alrededor - 3 && t <= alrededor + 3)) : [];
    return enZona.length ? enZona : todas;
  });
  if (opciones.some((o) => o.length === 0)) throw new Error('Algún acorde no cabe en drop 2 en estas cuerdas.');
  const coste = (p: Drop2, s: Drop2) => {
    const [ap, as] = [alturas(p), alturas(s)];
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
  const res: Drop2[] = [];
  for (let i = opciones.length - 1; i >= 0; i--) {
    res.unshift(opciones[i][k]);
    k = previo[i][k];
  }
  return res;
}

/** Audio: cada voicing dura lo indicado en pulsos (rasgueo muy corto). */
export function eventosDrop2(voicings: readonly Drop2[], pulsos: readonly number[], bpm: number, sostenido = false) {
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
