// Reproductor con Web Audio (solo en el navegador). La guitarra usa samples (uno
// por semitono, E2–E6); el resto de instrumentos y el clic del metrónomo se
// sintetizan, así que no necesitan archivos.
import type { Evento } from './secuencias.ts';
import { archivo } from './rutas.ts';
import { RANGO_GUITARRA } from './teoria.ts';

export type Instrumento =
  | 'guitarra'
  | 'piano'
  | 'organo'
  | 'organo-jazz'
  | 'armonio'
  | 'cuerdas'
  | 'coro'
  | 'flauta'
  | 'pad'
  | 'pad-calido';

export const INSTRUMENTOS: { id: Instrumento; nombre: string }[] = [
  { id: 'guitarra', nombre: 'Guitarra jazz' },
  { id: 'piano', nombre: 'Piano eléctrico' },
  { id: 'organo', nombre: 'Órgano suave' },
  { id: 'organo-jazz', nombre: 'Órgano jazz' },
  { id: 'armonio', nombre: 'Armonio' },
  { id: 'cuerdas', nombre: 'Cuerdas' },
  { id: 'coro', nombre: 'Coro' },
  { id: 'flauta', nombre: 'Flauta' },
  { id: 'pad', nombre: 'Pad' },
  { id: 'pad-calido', nombre: 'Pad cálido' },
];

/** Instrumentos que mantienen la nota: los acordes repetidos se ligan en un solo sonido. */
export const SOSTENIDOS: readonly Instrumento[] = ['organo', 'organo-jazz', 'armonio', 'cuerdas', 'coro', 'flauta', 'pad', 'pad-calido'];

/**
 * Timbres sostenidos que se construyen con la misma receta: osciladores
 * (múltiplo de la frecuencia, peso, desafinación en cents), un filtro, una
 * envolvente (ataque y caída en s, nivel) y un vibrato opcional (Hz, cents).
 * Pocos osciladores por nota para que el móvil aguante acordes largos.
 */
interface Receta {
  osc: [OscillatorType, number, number, number?][];
  filtro?: { tipo: BiquadFilterType; f: number; q?: number }[];
  ataque: number;
  caida: number;
  nivel: number;
  vibrato?: [number, number];
}
const RECETAS: Partial<Record<Instrumento, Receta>> = {
  // Registros 16' + 8' + 5 1/3' ("888000000") con vibrato tipo Leslie lento.
  'organo-jazz': {
    osc: [['sine', 0.5, 0.8], ['sine', 1, 1], ['sine', 1.5, 0.7]],
    ataque: 0.01,
    caida: 0.06,
    nivel: 0.085,
    vibrato: [6.2, 7],
  },
  // Lengüetas: dos ondas cuadradas un poco desafinadas, filtradas.
  armonio: {
    osc: [['square', 1, 0.5, -6], ['square', 1, 0.5, 6]],
    filtro: [{ tipo: 'lowpass', f: 1600, q: 0.7 }],
    ataque: 0.06,
    caida: 0.1,
    nivel: 0.115,
  },
  // Sección de cuerdas: tres sierras desafinadas, ataque lento y vibrato suave.
  cuerdas: {
    osc: [['sawtooth', 1, 0.4, -11], ['sawtooth', 1, 0.4, 0], ['sawtooth', 1, 0.4, 11]],
    filtro: [{ tipo: 'lowpass', f: 2400, q: 0.5 }],
    ataque: 0.28,
    caida: 0.35,
    nivel: 0.19,
    vibrato: [5, 6],
  },
  // Voces "aah": sierras por dos formantes (≈ 700 y 1150 Hz).
  coro: {
    osc: [['sawtooth', 1, 0.5, -7], ['sawtooth', 1, 0.5, 7]],
    filtro: [
      { tipo: 'bandpass', f: 700, q: 4 },
      { tipo: 'bandpass', f: 1150, q: 5 },
    ],
    ataque: 0.35,
    caida: 0.4,
    nivel: 0.55,
    vibrato: [4.8, 9],
  },
  // Flauta: casi una senoidal, con un poco de segundo armónico y vibrato.
  flauta: {
    osc: [['sine', 1, 1], ['sine', 2, 0.18], ['triangle', 1, 0.15]],
    ataque: 0.08,
    caida: 0.12,
    nivel: 0.095,
    vibrato: [5.2, 10],
  },
  // Pad cálido: triángulo y una senoidal una octava por debajo, muy filtrado.
  'pad-calido': {
    osc: [['triangle', 1, 0.7, -5], ['triangle', 1, 0.7, 5], ['sine', 0.5, 0.6]],
    filtro: [{ tipo: 'lowpass', f: 750, q: 0.4 }],
    ataque: 0.6,
    caida: 0.8,
    nivel: 0.095,
  },
};

const RUTA = archivo('samples/guitarra-jazz/');
const VOLUMEN = 0.7;
const ATAQUE = 0.005;
const CAIDA = 0.12;

let contexto: AudioContext | null = null;
let salida: AudioNode | null = null;
const buffers = new Map<number, Promise<AudioBuffer>>();

interface Voz {
  fuentes: AudioScheduledSourceNode[];
  ganancia: GainNode;
  /** Cuándo deja de sonar (tiempo del contexto). */
  fin: number;
}
let sonando: Voz[] = [];
let turno = 0;
/** Sube con cada detener(): los programadores pendientes dejan de crear notas. */
let corte = 0;
/** Dónde empieza la siguiente vuelta de un bucle (tiempo del contexto). */
let siguienteVuelta = 0;

function obtenerContexto(): AudioContext {
  if (!contexto) {
    // En móviles y tabletas, un búfer más grande evita cortes y chasquidos cuando
    // el procesador va justo; el retraso extra no importa para reproducir.
    const tactil = matchMedia('(pointer: coarse)').matches;
    contexto = new AudioContext({ latencyHint: tactil ? 'playback' : 'interactive' });
    // Ganancia general por debajo de 1 y compresor casi limitador: un acorde de
    // seis cuerdas sumadas no debe pasar de 0 dB (en el móvil eso se oye como ruido).
    const general = contexto.createGain();
    general.gain.value = 0.6;
    const compresor = contexto.createDynamicsCompressor();
    compresor.threshold.value = -10;
    compresor.knee.value = 6;
    compresor.ratio.value = 12;
    compresor.attack.value = 0.003;
    compresor.release.value = 0.2;
    general.connect(compresor).connect(contexto.destination);
    salida = general;
  }
  return contexto;
}

function cargar(m: number): Promise<AudioBuffer> {
  if (m < RANGO_GUITARRA.min || m > RANGO_GUITARRA.max) {
    return Promise.reject(new Error(`Nota fuera del rango de samples: ${m}`));
  }
  let b = buffers.get(m);
  if (!b) {
    const ctx = obtenerContexto();
    b = fetch(`${RUTA}${m}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar el sample ${m}`);
        return r.arrayBuffer();
      })
      .then((datos) => ctx.decodeAudioData(datos));
    b.catch(() => buffers.delete(m));
    buffers.set(m, b);
  }
  return b;
}

/** Corta lo que esté sonando, con un fundido corto para que no chasquee. */
export function detener() {
  turno++;
  corte++;
  if (!contexto) return;
  const ahora = contexto.currentTime;
  for (const { fuentes, ganancia } of sonando) {
    ganancia.gain.cancelScheduledValues(ahora);
    ganancia.gain.setValueAtTime(ganancia.gain.value, ahora);
    ganancia.gain.linearRampToValueAtTime(0, ahora + 0.05);
    for (const f of fuentes) f.stop(ahora + 0.06);
  }
  sonando = [];
}

const frecuencia = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** Oscilador con un peso propio, conectado a `destino`. */
function oscilador(ctx: AudioContext, tipo: OscillatorType, f: number, peso: number, destino: AudioNode, desafinar = 0) {
  const o = ctx.createOscillator();
  o.type = tipo;
  o.frequency.value = f;
  o.detune.value = desafinar;
  const g = ctx.createGain();
  g.gain.value = peso;
  o.connect(g).connect(destino);
  return o;
}

/** Cuándo deja de sonar una nota sintetizada (con su cola). */
function finSintetizada(e: Evento, inicio: number, instrumento: Instrumento): number {
  if (e.clic) return inicio + 0.06;
  const final = inicio + e.duracion;
  const receta = RECETAS[instrumento];
  if (receta) return final + receta.caida * 5;
  return final + (instrumento === 'piano' ? 0.5 : instrumento === 'organo' ? 0.35 : 2);
}

/** Nota con una de las RECETAS; devuelve sus fuentes (osciladores y vibrato). */
function vozReceta(ctx: AudioContext, r: Receta, f: number, inicio: number, final: number, ganancia: GainNode): OscillatorNode[] {
  // Los filtros van en paralelo (formantes) y se suman en la ganancia de la nota.
  let entrada: AudioNode = ganancia;
  if (r.filtro) {
    const suma = ctx.createGain();
    for (const { tipo, f: fc, q } of r.filtro) {
      const filtro = ctx.createBiquadFilter();
      filtro.type = tipo;
      filtro.frequency.value = fc;
      filtro.Q.value = q ?? 0.7;
      suma.connect(filtro).connect(ganancia);
    }
    entrada = suma;
  }
  const fuentes = r.osc.map(([tipo, mult, peso, cents]) => oscilador(ctx, tipo, f * mult, peso, entrada, cents ?? 0));
  if (r.vibrato) {
    const [hz, cents] = r.vibrato;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = hz;
    const prof = ctx.createGain();
    prof.gain.value = cents;
    lfo.connect(prof);
    for (const o of fuentes) prof.connect(o.detune);
    fuentes.push(lfo);
  }
  const g = ganancia.gain;
  g.setValueAtTime(0, inicio);
  g.linearRampToValueAtTime(r.nivel, inicio + r.ataque);
  g.setTargetAtTime(0, final, r.caida);
  return fuentes;
}

/** Programa una nota sintetizada; devuelve la voz y cuándo deja de sonar. */
function vozSintetizada(ctx: AudioContext, e: Evento, inicio: number, instrumento: Instrumento): Voz {
  const ganancia = ctx.createGain();
  ganancia.connect(salida!);
  const g = ganancia.gain;
  const final = inicio + e.duracion;
  const fin = finSintetizada(e, inicio, instrumento);
  let fuentes: OscillatorNode[];

  if (e.clic) {
    // Metrónomo: pitido corto, más agudo en la primera parte del compás.
    fuentes = [oscilador(ctx, 'square', e.clic === 'fuerte' ? 1760 : 1175, 1, ganancia)];
    g.setValueAtTime(0, inicio);
    g.linearRampToValueAtTime(e.clic === 'fuerte' ? 0.35 : 0.22, inicio + 0.002);
    g.exponentialRampToValueAtTime(0.0001, inicio + 0.05);
  } else {
    const f = frecuencia(e.midi);
    const receta = RECETAS[instrumento];
    if (receta) {
      fuentes = vozReceta(ctx, receta, f, inicio, final, ganancia);
    } else if (instrumento === 'piano') {
      fuentes = [oscilador(ctx, 'sine', f, 1, ganancia), oscilador(ctx, 'sine', f * 2, 0.3, ganancia), oscilador(ctx, 'triangle', f * 4, 0.04, ganancia)];
      g.setValueAtTime(0, inicio);
      g.linearRampToValueAtTime(0.16, inicio + 0.006);
      g.setTargetAtTime(0.05, inicio + 0.01, 0.7);
      g.setTargetAtTime(0, final, 0.08);
    } else if (instrumento === 'organo') {
      fuentes = [1, 2, 3, 4].map((n, i) => oscilador(ctx, 'sine', f * n, [1, 0.5, 0.3, 0.12][i], ganancia));
      g.setValueAtTime(0, inicio);
      g.linearRampToValueAtTime(0.09, inicio + 0.02);
      g.setTargetAtTime(0, final, 0.05);
    } else {
      // Pad: dos dientes de sierra desafinados y un filtro paso bajo, con ataque y caída lentos.
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'lowpass';
      filtro.frequency.value = 1100;
      filtro.Q.value = 0.6;
      filtro.connect(ganancia);
      fuentes = [oscilador(ctx, 'sawtooth', f, 0.5, filtro, -9), oscilador(ctx, 'sawtooth', f, 0.5, filtro, 9), oscilador(ctx, 'triangle', f, 0.6, filtro)];
      g.setValueAtTime(0, inicio);
      g.linearRampToValueAtTime(0.11, inicio + 0.35);
      g.setTargetAtTime(0, final, 0.3);
    }
  }
  for (const o of fuentes) {
    o.start(inicio);
    o.stop(fin);
  }
  // Al acabar, se suelta del grafo para que no se acumulen nodos en canciones largas.
  fuentes[0].onended = () => ganancia.disconnect();
  return { fuentes, ganancia, fin };
}

export interface OpcionesTocar {
  /**
   * Duración musical de la secuencia (sin las colas de las notas). Si se da, la
   * promesa se resuelve un poco antes de ese momento para poder encadenar la
   * siguiente vuelta de un bucle a tiempo.
   */
  duracion?: number;
  /** Seguir a continuación de la vuelta anterior, sin cortar lo que aún suena. */
  encadenar?: boolean;
}

/** Margen con el que se programa la siguiente vuelta de un bucle. */
const ANTELACION = 0.25;
/** Segundos por delante que se crean notas (pestaña visible / en segundo plano). */
const VENTANA = 1.5;
const VENTANA_OCULTA = 12;

/**
 * Reproduce una secuencia (sustituye a la anterior). La promesa se resuelve
 * cuando termina de sonar, o antes si otra reproducción la interrumpe.
 * `alProgresar` recibe, en cada fotograma mientras suena, los segundos
 * transcurridos desde el inicio de la secuencia.
 * Debe llamarse desde un gesto del usuario (clic) la primera vez.
 */
export async function tocar(
  eventos: Evento[],
  alProgresar?: (segundos: number) => void,
  instrumento: Instrumento = 'guitarra',
  op: OpcionesTocar = {},
): Promise<void> {
  if (op.encadenar) turno++;
  else detener();
  const miTurno = turno;
  const ctx = obtenerContexto();
  if (ctx.state === 'suspended') await ctx.resume();
  sonando = sonando.filter((v) => v.fin > ctx.currentTime);

  const conSample = (e: Evento) => instrumento === 'guitarra' && !e.clic;
  const notas = await Promise.all(eventos.map((e) => (conSample(e) ? cargar(e.midi) : null)));
  if (miTurno !== turno) return; // otra reproducción empezó mientras cargaba

  const t0 = op.encadenar && siguienteVuelta > ctx.currentTime + 0.01 ? siguienteVuelta : ctx.currentTime + 0.05;

  // Las notas no se crean todas de golpe: un programador va creando solo las de
  // los próximos segundos. Con una canción entera (cientos de notas) crearlas al
  // principio satura el móvil y produce cortes.
  const pendientes = eventos.map((e, i) => ({ e, buffer: notas[i] })).sort((a, b) => a.e.inicio - b.e.inicio);
  const finDe = ({ e, buffer }: (typeof pendientes)[number]) =>
    buffer ? t0 + e.inicio + Math.min(e.duracion, buffer.duration) : finSintetizada(e, t0 + e.inicio, instrumento);
  const fin = pendientes.reduce((m, p) => Math.max(m, finDe(p)), 0);

  const programarNota = ({ e, buffer }: (typeof pendientes)[number]) => {
    const inicio = t0 + e.inicio;
    if (!buffer) {
      sonando.push(vozSintetizada(ctx, e, inicio, instrumento));
      return;
    }
    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    const ganancia = ctx.createGain();
    const final = inicio + Math.min(e.duracion, buffer.duration);
    ganancia.gain.setValueAtTime(0, inicio);
    ganancia.gain.linearRampToValueAtTime(VOLUMEN, inicio + ATAQUE);
    ganancia.gain.setValueAtTime(VOLUMEN, Math.max(inicio + ATAQUE, final - CAIDA));
    ganancia.gain.linearRampToValueAtTime(0, final);
    fuente.connect(ganancia).connect(salida!);
    fuente.start(inicio);
    fuente.stop(final + 0.01);
    fuente.onended = () => ganancia.disconnect();
    sonando.push({ fuentes: [fuente], ganancia, fin: final + 0.01 });
  };

  const miCorte = corte;
  let k = 0;
  const programar = () => {
    if (miCorte !== corte) return;
    // Con la pestaña en segundo plano los temporizadores se espacian: se programa más por delante.
    const horizonte = ctx.currentTime + (document.hidden ? VENTANA_OCULTA : VENTANA);
    while (k < pendientes.length && t0 + pendientes[k].e.inicio < horizonte) programarNota(pendientes[k++]);
    if (k < pendientes.length) setTimeout(programar, 200);
    // Limpia de la lista lo que ya terminó.
    if (sonando.length > 200) sonando = sonando.filter((v) => v.fin > ctx.currentTime);
  };
  programar();

  // Con duración musical, se espera hasta poco antes de ese momento (para encadenar).
  const esperarHasta = op.duracion != null ? t0 + op.duracion - ANTELACION : fin;
  if (op.duracion != null) siguienteVuelta = t0 + op.duracion;

  if (alProgresar) {
    const fotograma = () => {
      if (miTurno !== turno || ctx.currentTime >= fin) return;
      const s = ctx.currentTime - t0;
      if (s >= 0) alProgresar(s);
      requestAnimationFrame(fotograma);
    };
    requestAnimationFrame(fotograma);
  }

  await new Promise<void>((resolver) => {
    const comprobar = () => (miTurno !== turno || ctx.currentTime >= esperarHasta ? resolver() : setTimeout(comprobar, 50));
    comprobar();
  });
}
