// Reproductor con Web Audio (solo en el navegador). La guitarra usa samples (uno
// por semitono, E2–E6); el resto de instrumentos y el clic del metrónomo se
// sintetizan, así que no necesitan archivos.
import type { Evento } from './secuencias.ts';
import { archivo } from './rutas.ts';
import { RANGO_GUITARRA } from './teoria.ts';

export type Instrumento = 'guitarra' | 'piano' | 'organo' | 'pad';

export const INSTRUMENTOS: { id: Instrumento; nombre: string }[] = [
  { id: 'guitarra', nombre: 'Guitarra jazz' },
  { id: 'piano', nombre: 'Piano eléctrico' },
  { id: 'organo', nombre: 'Órgano' },
  { id: 'pad', nombre: 'Pad (continuo)' },
];

/** Instrumentos que mantienen la nota: los acordes repetidos se ligan en un solo sonido. */
export const SOSTENIDOS: readonly Instrumento[] = ['organo', 'pad'];

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
}
let sonando: Voz[] = [];
let turno = 0;

function obtenerContexto(): AudioContext {
  if (!contexto) {
    contexto = new AudioContext();
    // Compresor suave para que los acordes no saturen.
    const compresor = contexto.createDynamicsCompressor();
    compresor.threshold.value = -12;
    compresor.ratio.value = 4;
    compresor.connect(contexto.destination);
    salida = compresor;
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

/** Programa una nota sintetizada; devuelve la voz y cuándo deja de sonar. */
function vozSintetizada(ctx: AudioContext, e: Evento, inicio: number, instrumento: Instrumento): Voz & { fin: number } {
  const ganancia = ctx.createGain();
  ganancia.connect(salida!);
  const g = ganancia.gain;
  const final = inicio + e.duracion;
  let fuentes: OscillatorNode[];
  let fin: number;

  if (e.clic) {
    // Metrónomo: pitido corto, más agudo en la primera parte del compás.
    fuentes = [oscilador(ctx, 'square', e.clic === 'fuerte' ? 1760 : 1175, 1, ganancia)];
    g.setValueAtTime(0, inicio);
    g.linearRampToValueAtTime(e.clic === 'fuerte' ? 0.35 : 0.22, inicio + 0.002);
    g.exponentialRampToValueAtTime(0.0001, inicio + 0.05);
    fin = inicio + 0.06;
  } else {
    const f = frecuencia(e.midi);
    if (instrumento === 'piano') {
      fuentes = [oscilador(ctx, 'sine', f, 1, ganancia), oscilador(ctx, 'sine', f * 2, 0.3, ganancia), oscilador(ctx, 'triangle', f * 4, 0.04, ganancia)];
      g.setValueAtTime(0, inicio);
      g.linearRampToValueAtTime(0.16, inicio + 0.006);
      g.setTargetAtTime(0.05, inicio + 0.01, 0.7);
      g.setTargetAtTime(0, final, 0.08);
      fin = final + 0.5;
    } else if (instrumento === 'organo') {
      fuentes = [1, 2, 3, 4].map((n, i) => oscilador(ctx, 'sine', f * n, [1, 0.5, 0.3, 0.12][i], ganancia));
      g.setValueAtTime(0, inicio);
      g.linearRampToValueAtTime(0.09, inicio + 0.02);
      g.setTargetAtTime(0, final, 0.05);
      fin = final + 0.35;
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
      fin = final + 2;
    }
  }
  for (const o of fuentes) {
    o.start(inicio);
    o.stop(fin);
  }
  return { fuentes, ganancia, fin };
}

/**
 * Reproduce una secuencia (sustituye a la anterior). La promesa se resuelve
 * cuando termina de sonar, o antes si otra reproducción la interrumpe.
 * `alProgresar` recibe, en cada fotograma mientras suena, los segundos
 * transcurridos desde el inicio de la secuencia.
 * Debe llamarse desde un gesto del usuario (clic) la primera vez.
 */
export async function tocar(eventos: Evento[], alProgresar?: (segundos: number) => void, instrumento: Instrumento = 'guitarra'): Promise<void> {
  detener();
  const miTurno = turno;
  const ctx = obtenerContexto();
  if (ctx.state === 'suspended') await ctx.resume();

  const conSample = (e: Evento) => instrumento === 'guitarra' && !e.clic;
  const notas = await Promise.all(eventos.map((e) => (conSample(e) ? cargar(e.midi) : null)));
  if (miTurno !== turno) return; // otra reproducción empezó mientras cargaba

  const t0 = ctx.currentTime + 0.05;
  let fin = 0;
  eventos.forEach((e, i) => {
    const inicio = t0 + e.inicio;
    const buffer = notas[i];
    if (!buffer) {
      const voz = vozSintetizada(ctx, e, inicio, instrumento);
      sonando.push(voz);
      fin = Math.max(fin, voz.fin);
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
    sonando.push({ fuentes: [fuente], ganancia });
    fin = Math.max(fin, final);
  });

  if (alProgresar) {
    const fotograma = () => {
      if (miTurno !== turno || ctx.currentTime >= fin) return;
      alProgresar(ctx.currentTime - t0);
      requestAnimationFrame(fotograma);
    };
    requestAnimationFrame(fotograma);
  }

  await new Promise<void>((resolver) => {
    const comprobar = () => (miTurno !== turno || ctx.currentTime >= fin ? resolver() : setTimeout(comprobar, 100));
    comprobar();
  });
  if (miTurno === turno) sonando = [];
}
