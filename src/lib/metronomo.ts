// Metrónomo (Herramientas): un compás de clics con acentos por pulso, subdivisiones
// (con swing en las corcheas), subida progresiva de tempo y compases en silencio para
// comprobar el pulso interno. Se toca compás a compás en bucle (conectarAudio), y cada
// compás se calcula aquí. Funciones puras, sin DOM.
import type { Evento } from './secuencias.ts';

/** Cómo suena cada pulso: el clic agudo, el normal o nada. */
export type Acento = 'fuerte' | 'debil' | 'mudo';
/** Clics por pulso: 1 = solo el pulso, 2 = corcheas, 3 = tresillos, 4 = semicorcheas. */
export type Subdivision = 1 | 2 | 3 | 4;

export const SUBDIVISIONES: { id: Subdivision; nombre: string }[] = [
  { id: 1, nombre: 'Negras' },
  { id: 2, nombre: 'Corcheas' },
  { id: 3, nombre: 'Tresillos' },
  { id: 4, nombre: 'Semicorcheas' },
];

export const BPM_MIN = 30;
export const BPM_MAX = 300;
export const PULSOS_MAX = 12;

export interface OpcionesMetronomo {
  bpm: number;
  /** Uno por pulso del compás. */
  acentos: Acento[];
  subdivision: Subdivision;
  /** Swing de las corcheas en % (50 = recto, 67 = tresillo). */
  swing: number;
  /** Subir `paso` BPM cada `cada` compases, hasta `hasta`. */
  subida: { activa: boolean; paso: number; cada: number; hasta: number };
  /** Tocar `suenan` compases y callar `callan`, en bucle. */
  silencio: { activo: boolean; suenan: number; callan: number };
}

export const limitarBpm = (bpm: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(Number(bpm) || 100)));

/** Acentos de un compás de `n` pulsos: el primero fuerte y el resto normales. */
export const acentosIniciales = (n: number): Acento[] => Array.from({ length: n }, (_, i) => (i === 0 ? 'fuerte' : 'debil'));

/** Cambia el número de pulsos conservando los acentos que ya había. */
export function cambiarPulsos(acentos: readonly Acento[], n: number): Acento[] {
  const total = Math.min(PULSOS_MAX, Math.max(1, Math.round(n)));
  return Array.from({ length: total }, (_, i) => acentos[i] ?? (i === 0 ? 'fuerte' : 'debil'));
}

/** Al pulsar un pulso: fuerte → normal → mudo → fuerte. */
export const siguienteAcento = (a: Acento): Acento => (a === 'fuerte' ? 'debil' : a === 'debil' ? 'mudo' : 'fuerte');

export const OPCIONES_INICIALES: OpcionesMetronomo = {
  bpm: 100,
  acentos: acentosIniciales(4),
  subdivision: 1,
  swing: 50,
  subida: { activa: false, paso: 5, cada: 4, hasta: 160 },
  silencio: { activo: false, suenan: 2, callan: 2 },
};

const entero = (x: unknown, min: number, max: number, defecto: number) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : defecto;
};

/** Opciones guardadas (de cualquier versión) completadas y saneadas. */
export function opcionesValidas(x: unknown): OpcionesMetronomo {
  const o = (typeof x === 'object' && x ? x : {}) as Partial<OpcionesMetronomo>;
  const i = OPCIONES_INICIALES;
  const acentos = Array.isArray(o.acentos) && o.acentos.length ? o.acentos.slice(0, PULSOS_MAX).map((a) => (a === 'fuerte' || a === 'mudo' ? a : 'debil')) : i.acentos;
  const subida = { ...i.subida, ...(o.subida ?? {}) };
  const silencio = { ...i.silencio, ...(o.silencio ?? {}) };
  return {
    bpm: limitarBpm(o.bpm ?? i.bpm),
    acentos,
    subdivision: ([1, 2, 3, 4] as const).find((s) => s === o.subdivision) ?? 1,
    swing: entero(o.swing, 50, 75, 50),
    subida: {
      activa: subida.activa === true,
      paso: entero(subida.paso, 1, 40, 5),
      cada: entero(subida.cada, 1, 64, 4),
      hasta: limitarBpm(subida.hasta),
    },
    silencio: { activo: silencio.activo === true, suenan: entero(silencio.suenan, 1, 16, 2), callan: entero(silencio.callan, 1, 16, 2) },
  };
}

/** Tempo del compás `compas` (0 = el primero): sube `paso` cada `cada` compases sin pasar de `hasta`. */
export function tempoEnCompas(op: OpcionesMetronomo, compas: number): number {
  if (!op.subida.activa || op.subida.hasta <= op.bpm) return op.bpm;
  return Math.min(op.subida.hasta, op.bpm + op.subida.paso * Math.floor(compas / op.subida.cada));
}

/** Si el compás `compas` es de los que callan. */
export function compasEnSilencio(op: OpcionesMetronomo, compas: number): boolean {
  if (!op.silencio.activo) return false;
  return compas % (op.silencio.suenan + op.silencio.callan) >= op.silencio.suenan;
}

/**
 * Un compás de clics. Los pulsos fuertes y normales suenan con el clic del metrónomo;
 * las subdivisiones, más flojas. Un compás `callado` lleva los mismos eventos sin
 * volumen (así se sigue marcando el pulso en pantalla). Devuelve también cuándo
 * empieza cada pulso.
 */
export function eventosCompas(op: OpcionesMetronomo, bpm: number, callado = false): { eventos: Evento[]; duracion: number; pulsos: number[] } {
  const pulso = 60 / bpm;
  const eventos: Evento[] = [];
  const pulsos = op.acentos.map((_, i) => i * pulso);
  const volumen = (v: number) => (callado ? 0 : v);
  op.acentos.forEach((a, i) => {
    const t = i * pulso;
    if (a !== 'mudo') eventos.push({ midi: 0, inicio: t, duracion: 0.05, clic: a, volumen: volumen(1) });
    for (let k = 1; k < op.subdivision; k++) {
      const pos = op.subdivision === 2 ? op.swing / 100 : k / op.subdivision;
      eventos.push({ midi: 0, inicio: t + pos * pulso, duracion: 0.05, clic: 'debil', volumen: volumen(0.4) });
    }
  });
  return { eventos, duracion: op.acentos.length * pulso, pulsos };
}

/** Pulso que suena a los `segundos` del compás (-1 antes del primero). */
export function pulsoEn(pulsos: readonly number[], segundos: number): number {
  let res = -1;
  pulsos.forEach((t, i) => {
    if (segundos >= t - 0.01) res = i;
  });
  return res;
}

/**
 * Tempo marcado a golpes (tap tempo): la media de los intervalos entre los últimos
 * toques (hasta 8). Un hueco de más de 2 s empieza una cuenta nueva. Null con menos
 * de dos toques.
 */
export function bpmDeToques(toques: readonly number[]): number | null {
  let inicio = 0;
  for (let i = 1; i < toques.length; i++) if (toques[i] - toques[i - 1] > 2000) inicio = i;
  const validos = toques.slice(inicio).slice(-8);
  if (validos.length < 2) return null;
  const media = (validos[validos.length - 1] - validos[0]) / (validos.length - 1);
  return limitarBpm(60000 / media);
}
