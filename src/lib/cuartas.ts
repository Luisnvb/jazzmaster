// Cuartas (quartal voicings): acordes apilando cuartas de una escala modal, al
// estilo de McCoy Tyner, y la estructura «So What» (tres cuartas justas y una
// tercera mayor). Se colocan en un grupo de cuerdas y se encadenan por la escala
// sobre un vamp. Funciones puras, sin DOM.
import { AFINACION, ligarRepetidos, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

export interface ModoCuartas {
  id: string;
  nombre: string;
  /** Sufijo del acorde del vamp. */
  simbolo: string;
  escala: string[];
  /** Notas del acorde del vamp (las demás se rotulan como tensiones). */
  acorde: string[];
}

export const MODOS_CUARTAS: ModoCuartas[] = [
  { id: 'dorico', nombre: 'Dórico', simbolo: 'm7', escala: ['1', '2', 'b3', '4', '5', '6', 'b7'], acorde: ['1', 'b3', '5', 'b7'] },
  { id: 'mixolidio', nombre: 'Mixolidio (sus)', simbolo: '7sus4', escala: ['1', '2', '3', '4', '5', '6', 'b7'], acorde: ['1', '4', '5', 'b7'] },
  { id: 'lidio', nombre: 'Lidio', simbolo: 'maj7#11', escala: ['1', '2', '3', '#4', '5', '6', '7'], acorde: ['1', '3', '5', '7'] },
];

export type TipoCuartas = 'tres' | 'cuatro' | 'so-what';

/** Grupos de cuerdas de cada tipo (índice 0 = 6ª). */
export const GRUPOS_CUARTAS: Record<TipoCuartas, { id: string; nombre: string; cuerdas: number[] }[]> = {
  tres: [
    { id: '654', nombre: 'Cuerdas 6-5-4', cuerdas: [0, 1, 2] },
    { id: '543', nombre: 'Cuerdas 5-4-3', cuerdas: [1, 2, 3] },
    { id: '432', nombre: 'Cuerdas 4-3-2', cuerdas: [2, 3, 4] },
    { id: '321', nombre: 'Cuerdas 3-2-1', cuerdas: [3, 4, 5] },
  ],
  cuatro: [
    { id: '6543', nombre: 'Cuerdas 6-5-4-3', cuerdas: [0, 1, 2, 3] },
    { id: '5432', nombre: 'Cuerdas 5-4-3-2', cuerdas: [1, 2, 3, 4] },
    { id: '4321', nombre: 'Cuerdas 4-3-2-1', cuerdas: [2, 3, 4, 5] },
  ],
  'so-what': [
    { id: '65432', nombre: 'Cuerdas 6-5-4-3-2', cuerdas: [0, 1, 2, 3, 4] },
    { id: '54321', nombre: 'Cuerdas 5-4-3-2-1', cuerdas: [1, 2, 3, 4, 5] },
  ],
};

export interface VoicingCuartas {
  /** Grado de la escala desde el que se apila (la nota más grave). */
  desde: string;
  /** Grados de la escala, de grave a agudo. */
  grados: string[];
  /** Los mismos, rotulados sobre el acorde del vamp (tensiones como 9, 11, 13). */
  rotulos: string[];
  notas: string[];
  midis: number[];
  trastes: Traste[];
  /** Grado rotulado de cada cuerda ('' en las que no suenan), para el diagrama. */
  gradosCuerda: string[];
  /** Semitonos entre voces seguidas (5 = cuarta justa, 6 = aumentada, 4 = tercera mayor). */
  intervalos: number[];
}

const mod = (n: number) => ((n % 12) + 12) % 12;
const TENSION: Record<string, string> = { '2': '9', b2: 'b9', '4': '11', '#4': '#11', '6': '13', b6: 'b13' };

/** Rótulo de un grado sobre el acorde del vamp: si no es nota del acorde, como tensión. */
export const rotulo = (m: ModoCuartas, g: string) => (m.acorde.some((a) => mod(semitonosGrado(a)) === mod(semitonosGrado(g))) ? g : (TENSION[g] ?? g));

/** Grados del voicing apilado desde la posición `i` de la escala. */
function apilar(m: ModoCuartas, i: number, tipo: TipoCuartas): string[] | null {
  const n = m.escala.length;
  if (tipo === 'so-what') {
    // Tres cuartas justas y una tercera mayor, todas dentro de la escala.
    const pcs = [0, 5, 10, 15, 19].map((s) => mod(semitonosGrado(m.escala[i]) + s));
    const grados = pcs.map((pc) => m.escala.find((g) => mod(semitonosGrado(g)) === pc));
    return grados.every(Boolean) ? (grados as string[]) : null;
  }
  // Cuartas diatónicas: cada voz, tres grados de la escala por encima de la anterior.
  return Array.from({ length: tipo === 'tres' ? 3 : 4 }, (_, k) => m.escala[(i + 3 * k) % n]);
}

/**
 * Los voicings por cuartas de la escala en un grupo de cuerdas, en escalera por
 * el mástil: desde el más grave que se puede tocar (traste 1 o más), uno por grado
 * hasta completar la octava. Con `soloJustas`, solo los de cuartas justas.
 */
export function escaleraCuartas(
  tonica: string,
  m: ModoCuartas,
  tipo: TipoCuartas,
  cuerdas: readonly number[],
  soloJustas = false,
): VoicingCuartas[] {
  const pcRaiz = pitchClass(notaDeGrado(tonica, '1'));
  const candidatos: VoicingCuartas[] = [];
  m.escala.forEach((_, i) => {
    const grados = apilar(m, i, tipo);
    if (!grados) return;
    for (let traste = 1; traste <= 15; traste++) {
      const grave = AFINACION[cuerdas[0]] + traste;
      if (mod(grave) !== mod(pcRaiz + semitonosGrado(grados[0]))) continue;
      const midis = [grave];
      for (let k = 1; k < grados.length; k++) {
        const pc = mod(pcRaiz + semitonosGrado(grados[k]));
        const previa = midis[k - 1];
        midis.push(previa + (mod(pc - previa) || 12));
      }
      const trastesVoces = midis.map((x, k) => x - AFINACION[cuerdas[k]]);
      if (trastesVoces.some((t) => t < 0 || t > 17)) continue;
      const pisados = trastesVoces.filter((t) => t > 0);
      if (pisados.length && Math.max(...pisados) - Math.min(...pisados) > 3) continue;
      const intervalos = midis.slice(1).map((x, k) => x - midis[k]);
      if (soloJustas && tipo !== 'so-what' && intervalos.some((s) => s !== 5)) continue;
      const trastes: Traste[] = ['x', 'x', 'x', 'x', 'x', 'x'];
      const gradosCuerda = ['', '', '', '', '', ''];
      const rotulos = grados.map((g) => rotulo(m, g));
      cuerdas.forEach((c, k) => {
        trastes[c] = trastesVoces[k];
        gradosCuerda[c] = rotulos[k];
      });
      candidatos.push({
        desde: grados[0],
        grados,
        rotulos,
        notas: grados.map((g) => formatNota(notaDeGrado(tonica, g))),
        midis,
        trastes,
        gradosCuerda,
        intervalos,
      });
    }
  });
  candidatos.sort((a, b) => a.midis[0] - b.midis[0]);
  // Una octava de escalera: del más grave hasta la misma nota una octava más arriba.
  if (candidatos.length === 0) return [];
  const limite = candidatos[0].midis[0] + 12;
  return candidatos.filter((v) => v.midis[0] <= limite);
}

/** Nombre del vamp: ('D', dórico) → 'Dm7'. */
export const vampEn = (tonica: string, m: ModoCuartas) => `${formatNota(notaDeGrado(tonica, '1'))}${m.simbolo}`;

export type Patron = 'escalera' | 'vecinos';

/**
 * Audio sobre el vamp: la raíz como pedal en el bajo y los voicings con un
 * ritmo de acompañamiento (cada uno dura dos pulsos, golpe corto y anticipado
 * en el «y» del 2 como en el comping modal). `escalera`: sube y baja por todos.
 * `vecinos`: alterna el elegido y el de encima, como el «So What».
 */
export function secuenciaCuartas(
  tonica: string,
  voicings: readonly VoicingCuartas[],
  patron: Patron,
  elegido: number,
  bpm: number,
  sostenido = false,
): { eventos: Evento[]; orden: number[]; tiempos: { inicio: number; fin: number }[]; duracion: number } {
  const pulso = 60 / bpm;
  const n = voicings.length;
  const k = Math.min(Math.max(elegido, 0), n - 1);
  const sig = k + 1 < n ? k + 1 : k - 1;
  const orden =
    patron === 'escalera'
      ? [...voicings.keys(), ...[...voicings.keys()].reverse().slice(1, -1)]
      : [k, k, sig, k, k, k, sig, k];
  const eventos: Evento[] = [];
  const tiempos: { inicio: number; fin: number }[] = [];
  orden.forEach((v, i) => {
    const inicio = i * 2 * pulso;
    const dur = 2 * pulso;
    voicings[v].midis.forEach((midi, j) =>
      eventos.push({ midi, inicio: inicio + (sostenido ? 0 : j * 0.015), duracion: sostenido ? dur : dur * 0.85 }),
    );
    tiempos.push({ inicio, fin: inicio + dur });
  });
  const duracion = orden.length * 2 * pulso;
  // Pedal: la raíz entre E2 y D#3, un golpe por compás.
  const bajo = 40 + mod(pitchClass(notaDeGrado(tonica, '1')) - 4);
  for (let t = 0; t < duracion - 1e-9; t += 4 * pulso) eventos.push({ midi: bajo, inicio: t, duracion: 4 * pulso * (sostenido ? 1 : 0.95) });
  return { eventos: sostenido ? ligarRepetidos(eventos) : eventos, orden, tiempos, duracion };
}
