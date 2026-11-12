// Reproductor de samples con Web Audio (solo en el navegador).
// Hay un sample por semitono (E2–E6), así que no hace falta cambiar la afinación.
import type { Evento } from './secuencias.ts';
import { archivo } from './rutas.ts';
import { RANGO_GUITARRA } from './teoria.ts';

const RUTA = archivo('samples/guitarra-jazz/');
const VOLUMEN = 0.7;
const ATAQUE = 0.005;
const CAIDA = 0.12;

let contexto: AudioContext | null = null;
let salida: AudioNode | null = null;
const buffers = new Map<number, Promise<AudioBuffer>>();
let sonando: { fuente: AudioBufferSourceNode; ganancia: GainNode }[] = [];
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
  for (const { fuente, ganancia } of sonando) {
    ganancia.gain.cancelScheduledValues(ahora);
    ganancia.gain.setValueAtTime(ganancia.gain.value, ahora);
    ganancia.gain.linearRampToValueAtTime(0, ahora + 0.05);
    fuente.stop(ahora + 0.06);
  }
  sonando = [];
}

/**
 * Reproduce una secuencia (sustituye a la anterior). La promesa se resuelve
 * cuando termina de sonar, o antes si otra reproducción la interrumpe.
 * Debe llamarse desde un gesto del usuario (clic) la primera vez.
 */
export async function tocar(eventos: Evento[]): Promise<void> {
  detener();
  const miTurno = turno;
  const ctx = obtenerContexto();
  if (ctx.state === 'suspended') await ctx.resume();

  const notas = await Promise.all(eventos.map((e) => cargar(e.midi)));
  if (miTurno !== turno) return; // otra reproducción empezó mientras cargaba

  const t0 = ctx.currentTime + 0.05;
  let fin = 0;
  eventos.forEach((e, i) => {
    const fuente = ctx.createBufferSource();
    fuente.buffer = notas[i];
    const ganancia = ctx.createGain();
    const inicio = t0 + e.inicio;
    const final = inicio + Math.min(e.duracion, notas[i].duration);
    ganancia.gain.setValueAtTime(0, inicio);
    ganancia.gain.linearRampToValueAtTime(VOLUMEN, inicio + ATAQUE);
    ganancia.gain.setValueAtTime(VOLUMEN, Math.max(inicio + ATAQUE, final - CAIDA));
    ganancia.gain.linearRampToValueAtTime(0, final);
    fuente.connect(ganancia).connect(salida!);
    fuente.start(inicio);
    fuente.stop(final + 0.01);
    sonando.push({ fuente, ganancia });
    fin = Math.max(fin, final);
  });

  await new Promise<void>((resolver) => {
    const comprobar = () => (miTurno !== turno || ctx.currentTime >= fin ? resolver() : setTimeout(comprobar, 100));
    comprobar();
  });
  if (miTurno === turno) sonando = [];
}
