// Comping: un acompañamiento sobre una progresión que combina ritmos (células de
// un compás, con anticipaciones), voicings (drop 2 o shells) y registro, fijos o
// variando por compases. Funciones puras, sin DOM.
import { AFINACION, ligarRepetidos, type Evento } from './secuencias.ts';
import { dropProgresion, type Drop, type IdGrupo } from './drop.ts';
import { shellsProgresion, type Shell } from './shells.ts';
import { notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';
import type { AcordeGrado } from './progresiones.ts';
import type { Traste } from './voicings.ts';

export interface Golpe {
  /** Corchea del compás (0–7). */
  corchea: number;
  /** Duración en corcheas (corto: 0.7; largo: hasta el siguiente golpe o más). */
  dur: number;
}

export interface CelulaComping {
  id: string;
  nombre: string;
  descripcion: string;
  golpes: Golpe[];
}

/** Células de un compás de 4/4 (en corcheas). Un golpe en la corchea 7 anticipa el acorde siguiente. */
export const CELULAS: CelulaComping[] = [
  { id: 'negras', nombre: 'Negras', descripcion: 'Un golpe corto en cada pulso (Freddie Green).', golpes: [0, 2, 4, 6].map((c) => ({ corchea: c, dur: 0.8 })) },
  { id: 'charleston', nombre: 'Charlestón', descripcion: 'El 1 (largo) y el «y» del 2.', golpes: [{ corchea: 0, dur: 2.5 }, { corchea: 3, dur: 0.8 }] },
  { id: 'charleston-inv', nombre: 'Charlestón invertido', descripcion: 'El «y» del 1 y el 3.', golpes: [{ corchea: 1, dur: 0.8 }, { corchea: 4, dur: 2 }] },
  { id: 'dos-cuatro', nombre: 'En 2 y 4', descripcion: 'Golpes cortos en los tiempos débiles, con el charles.', golpes: [{ corchea: 2, dur: 0.8 }, { corchea: 6, dur: 0.8 }] },
  { id: 'redonda', nombre: 'Redonda', descripcion: 'Un acorde largo en el 1: deja todo el espacio al solista.', golpes: [{ corchea: 0, dur: 7.5 }] },
  { id: 'anticipacion', nombre: 'Anticipación', descripcion: 'El 1 y el acorde siguiente adelantado al «y» del 4.', golpes: [{ corchea: 0, dur: 2 }, { corchea: 7, dur: 2.5 }] },
  { id: 'sincopa', nombre: 'Síncopa', descripcion: 'El «y» del 2 y el «y» del 4 (que anticipa el siguiente).', golpes: [{ corchea: 3, dur: 1.5 }, { corchea: 7, dur: 2 }] },
];

export type Variacion = 'fijo' | 'variado';
export type Registro = 'grave' | 'medio' | 'agudo' | 'alternar';
export type TipoVoicing = 'drop2' | 'shells';

const GRUPO_REGISTRO: Record<Exclude<Registro, 'alternar'>, IdGrupo> = { grave: '6543', medio: '5432', agudo: '4321' };
const ORDEN_ALTERNAR: Exclude<Registro, 'alternar'>[] = ['medio', 'agudo', 'medio', 'grave'];

/** Generador con semilla (mulberry32). */
function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Voz {
  trastes: Traste[];
  grados: string[];
  midis: number[];
}

export interface GolpeComping {
  /** Corchea desde el principio de la progresión. */
  corchea: number;
  dur: number;
  /** Índice del acorde que suena (el siguiente si el golpe lo anticipa). */
  acorde: number;
  anticipa: boolean;
}

export interface CompasComping {
  celula: CelulaComping;
  registro: Exclude<Registro, 'alternar'>;
  /** Índices de los acordes del compás. */
  acordes: number[];
  golpes: GolpeComping[];
}

export interface Comping {
  compases: CompasComping[];
  /** Voicing de cada acorde en cada registro usado. */
  voces: Record<string, Voz[]>;
  /** Acorde que empieza en cada compás y su corchea de inicio (para marcar). */
  inicioAcorde: number[];
}

const aVoz = (d: Drop | Shell): Voz => ({
  trastes: d.trastes,
  grados: d.grados,
  midis: d.trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t])),
});

/**
 * El acompañamiento: para cada compás, una célula rítmica (fija o variada) y un
 * registro; cada golpe suena con el voicing del acorde que esté sonando en ese
 * momento, o con el del siguiente si cae en la última corchea antes de un cambio
 * de acorde (anticipación). Las variaciones salen de `semilla` y el último compás
 * de cada frase de cuatro tiende a anticipar.
 */
export function generarComping(
  tonica: string,
  compases: readonly AcordeGrado[][],
  op: { celula: string; variacion: Variacion; registro: Registro; voicing: TipoVoicing; semilla?: number },
): Comping {
  const azar = aleatorio(op.semilla ?? 1);
  const acordes = compases.flat();
  // Corchea en la que empieza cada acorde (el compás de 8 corcheas se reparte entre sus acordes).
  const inicioAcorde: number[] = [];
  compases.forEach((c, i) => c.forEach((_, j) => inicioAcorde.push(i * 8 + Math.round((8 * j) / c.length / 2) * 2)));
  const acordeEn = (corchea: number) => {
    let k = 0;
    while (k + 1 < inicioAcorde.length && inicioAcorde[k + 1] <= corchea) k++;
    return k;
  };
  const registros = op.registro === 'alternar' ? ORDEN_ALTERNAR : [op.registro];
  const voces: Record<string, Voz[]> = {};
  for (const r of new Set(registros)) {
    voces[r] = op.voicing === 'shells' ? shellsProgresion(tonica, compases, r === 'grave' ? 3 : r === 'medio' ? 6 : 9).map(aVoz) : dropProgresion(tonica, compases, GRUPO_REGISTRO[r]).map(aVoz);
  }
  const fija = CELULAS.find((c) => c.id === op.celula) ?? CELULAS[1];
  const variadas = CELULAS.filter((c) => c.id !== 'negras');
  let anterior = '';
  const total = compases.length * 8;
  const res: CompasComping[] = compases.map((_, i) => {
    let celula = fija;
    if (op.variacion === 'variado') {
      // Fin de frase (compás 4, 8…): mejor una anticipación hacia la siguiente.
      const finFrase = i % 4 === 3 && i < compases.length - 1;
      const candidatas = finFrase ? variadas.filter((x) => x.golpes.some((g) => g.corchea === 7)) : variadas.filter((x) => x.id !== anterior);
      celula = candidatas[Math.floor(azar() * candidatas.length)];
    }
    anterior = celula.id;
    const registro = registros[Math.floor(i / 4) % registros.length];
    const golpes = celula.golpes.map((g) => {
      const corchea = i * 8 + g.corchea;
      const actual = acordeEn(corchea);
      // Anticipa si el siguiente acorde empieza en la corchea siguiente (y no es el final de la progresión).
      const anticipa = actual + 1 < acordes.length && inicioAcorde[actual + 1] === corchea + 1;
      return { corchea, dur: g.dur, acorde: anticipa ? actual + 1 : actual, anticipa };
    });
    const propios = acordes.map((_, k) => k).filter((k) => Math.floor(inicioAcorde[k] / 8) === i);
    // Todo acorde del compás suena al menos una vez: si la célula no lo toca (una redonda
    // con dos acordes por compás), un golpe donde empieza.
    for (const k of propios) {
      if (!golpes.some((g) => g.acorde === k)) golpes.push({ corchea: inicioAcorde[k], dur: 2, acorde: k, anticipa: false });
    }
    golpes.sort((a, b) => a.corchea - b.corchea);
    return { celula, registro, acordes: propios, golpes };
  });
  // Cada golpe dura como mucho hasta el siguiente golpe, hasta que cambia el acorde y hasta el final.
  const todos = res.flatMap((c) => c.golpes);
  todos.forEach((g, j) => {
    const siguiente = todos[j + 1]?.corchea ?? total;
    const cambio = inicioAcorde[g.acorde + 1] ?? total;
    g.dur = Math.max(0.5, Math.min(g.dur, siguiente - g.corchea, cambio - g.corchea, total - g.corchea));
  });
  return { compases: res, voces, inicioAcorde };
}

export interface OpcionesAudio {
  swing?: number;
  /** Raíz en el 1 y la 5 en el 3 (bajo «a dos»). */
  bajo?: boolean;
  /** Charles (clic) en el 2 y el 4. */
  charles?: boolean;
  sostenido?: boolean;
}

/** Audio del comping, y cuándo suena cada golpe (compás e índice) para marcarlo. */
export function secuenciaComping(
  tonica: string,
  compases: readonly AcordeGrado[][],
  c: Comping,
  bpm: number,
  op: OpcionesAudio = {},
): { eventos: Evento[]; golpes: { compas: number; k: number; inicio: number; fin: number }[]; duracion: number } {
  const pulso = 60 / bpm;
  const s = op.swing ?? 0.5;
  const momento = (corchea: number) => {
    const p = Math.floor(corchea / 2);
    const x = corchea - 2 * p;
    return p * pulso + (x < 1 ? x * s : s + (x - 1) * (1 - s)) * pulso;
  };
  const acordes = compases.flat();
  const eventos: Evento[] = [];
  const golpes: { compas: number; k: number; inicio: number; fin: number }[] = [];
  c.compases.forEach((cc, i) => {
    cc.golpes.forEach((g, k) => {
      const voz = c.voces[cc.registro][g.acorde];
      const inicio = momento(g.corchea);
      const fin = momento(g.corchea + g.dur);
      voz.midis.forEach((midi, j) => eventos.push({ midi, inicio: inicio + j * 0.012, duracion: Math.max(0.08, (fin - inicio) * 0.92) }));
      golpes.push({ compas: i, k, inicio, fin });
    });
    if (op.charles) for (const p of [1, 3]) eventos.push({ midi: 0, inicio: (i * 4 + p) * pulso, duracion: 0.05, clic: 'debil' });
  });
  if (op.bajo) {
    // Bajo a dos: la raíz del acorde que suena en el 1 y su 5 en el 3 (o la raíz del nuevo si cambia).
    for (let corchea = 0; corchea < compases.length * 8; corchea += 4) {
      let k = 0;
      while (k + 1 < c.inicioAcorde.length && c.inicioAcorde[k + 1] <= corchea) k++;
      const a = acordes[k];
      const raiz = pitchClass(notaDeGrado(tonica, a.grado));
      const cambia = c.inicioAcorde[k] === corchea;
      const g = cambia || corchea % 8 === 0 ? '1' : (a.formula.find((x) => /^(b|#)?5$/.test(x)) ?? '1');
      const midi = 40 + ((raiz + semitonosGrado(g) - 4 + 120) % 12);
      eventos.push({ midi, inicio: momento(corchea), duracion: 2 * pulso * 0.95 });
    }
  }
  return { eventos: op.sostenido ? ligarRepetidos(eventos) : eventos, golpes, duracion: compases.length * 4 * pulso };
}
