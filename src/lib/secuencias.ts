// Secuencias de notas para el audio. Funciones puras: devuelven qué notas MIDI
// suenan, cuándo y cuánto duran; lib/audio.ts se encarga de reproducirlas.
import { ajustarARango, midi, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

export interface Evento {
  midi: number;
  /** Segundos desde el inicio. */
  inicio: number;
  /** Segundos que suena. */
  duracion: number;
  /** Clic de metrónomo en vez de nota (fuerte = primera parte del compás). */
  clic?: 'fuerte' | 'debil';
}

/**
 * Liga las notas repetidas que se tocan seguidas (la misma altura que empieza
 * justo donde acaba la anterior) en una sola más larga: así un pad o un órgano
 * suenan de forma continua cuando el acorde se repite.
 */
export function ligarRepetidos(eventos: readonly Evento[], margen = 0.02): Evento[] {
  const ordenados = [...eventos].sort((a, b) => a.midi - b.midi || a.inicio - b.inicio);
  const res: Evento[] = [];
  for (const e of ordenados) {
    const previo = res[res.length - 1];
    if (previo && !e.clic && !previo.clic && previo.midi === e.midi && e.inicio <= previo.inicio + previo.duracion + margen) {
      previo.duracion = Math.max(previo.duracion, e.inicio + e.duracion - previo.inicio);
    } else {
      res.push({ ...e });
    }
  }
  return res.sort((a, b) => a.inicio - b.inicio || a.midi - b.midi);
}

export type ModoIntervalo = 'ascendente' | 'descendente' | 'armonico';
export type ModoVoicing = 'rasgueo' | 'arpegiado';

/** MIDI de las cuerdas al aire, de 6ª a 1ª (E2 A2 D3 G3 B3 E4). */
export const AFINACION = [40, 45, 50, 55, 59, 64] as const;

/** Octava en la que empiezan intervalos, escalas y arpegios (C3 = 5ª cuerda, traste 3). */
const OCTAVA_BASE = 3;

const pulso = (bpm: number) => 60 / bpm;

/** Coloca alturas una tras otra, una por pulso; la última suena algo más. */
function enSerie(alturas: number[], bpm: number): Evento[] {
  const p = pulso(bpm);
  return alturas.map((m, i) => ({
    midi: m,
    inicio: i * p,
    duracion: i === alturas.length - 1 ? Math.max(p * 2, 1.2) : p * 1.1,
  }));
}

/** Semitonos de una fórmula, garantizando que siempre suben. */
function semitonosAscendentes(formula: readonly string[]): number[] {
  const res: number[] = [];
  for (const g of formula) {
    let s = semitonosGrado(g);
    while (res.length && s <= res[res.length - 1]) s += 12;
    res.push(s);
  }
  return res;
}

export function secuenciaIntervalo(tonica: string, grado: string, modo: ModoIntervalo): Evento[] {
  const partida = midi(tonica, OCTAVA_BASE);
  const s = semitonosGrado(grado);
  if (modo === 'armonico') {
    const [a, b] = ajustarARango([partida, partida + s]);
    return [
      { midi: a, inicio: 0, duracion: 2.5 },
      { midi: b, inicio: 0, duracion: 2.5 },
    ];
  }
  const alturas = modo === 'ascendente' ? [partida, partida + s] : [partida, partida - s];
  const [a, b] = ajustarARango(alturas);
  return [
    { midi: a, inicio: 0, duracion: 1.1 },
    { midi: b, inicio: 1, duracion: 1.8 },
  ];
}

/** Escala de una octava, terminando (o empezando) en la tónica una octava arriba. */
export function secuenciaEscala(tonica: string, formula: readonly string[], direccion: 'ascendente' | 'descendente', bpm: number): Evento[] {
  const base = midi(tonica, OCTAVA_BASE);
  const alturas = [...semitonosAscendentes(formula), 12].map((s) => base + s);
  const ajustadas = ajustarARango(alturas);
  return enSerie(direccion === 'ascendente' ? ajustadas : ajustadas.reverse(), bpm);
}

/** Arpegio del acorde, subiendo hasta la octava. */
export function secuenciaArpegio(tonica: string, arpegio: readonly string[], bpm: number): Evento[] {
  const base = midi(tonica, OCTAVA_BASE);
  return enSerie(ajustarARango([...semitonosAscendentes(arpegio), 12].map((s) => base + s)), bpm);
}

/**
 * Arpegios por terceras sobre cada grado de una escala de 7 notas
 * (1-3-5-7, 2-4-6-8, …), uno detrás de otro con un pulso de silencio.
 */
export function secuenciaArpegiosPorGrado(tonica: string, formula: readonly string[], bpm: number): Evento[] {
  if (formula.length !== 7) throw new Error('Los arpegios por grado necesitan una escala de 7 notas');
  const escala = semitonosAscendentes(formula);
  const nota = (i: number) => escala[i % 7] + 12 * Math.floor(i / 7);
  const base = midi(tonica, OCTAVA_BASE);
  const p = pulso(bpm);
  const alturas: number[] = [];
  for (let g = 0; g < 7; g++) for (const salto of [0, 2, 4, 6]) alturas.push(base + nota(g + salto));
  const ajustadas = ajustarARango(alturas);
  // 4 notas por grado + 1 pulso de silencio entre grados.
  return ajustadas.map((m, i) => ({
    midi: m,
    inicio: (i + Math.floor(i / 4)) * p,
    duracion: i % 4 === 3 ? p * 1.8 : p * 1.1,
  }));
}

/** Voicing tocado en la guitarra: rasgueado (casi a la vez) o arpegiado y dejando sonar. */
export function secuenciaVoicing(trastes: readonly Traste[], modo: ModoVoicing, bpm: number): Evento[] {
  const alturas = trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t]));
  const separacion = modo === 'rasgueo' ? 0.035 : pulso(bpm) / 2;
  const final = (alturas.length - 1) * separacion + 2.5;
  return alturas.map((m, i) => ({ midi: m, inicio: i * separacion, duracion: final - i * separacion }));
}
