// Comportamiento en el navegador compartido por varias secciones.
import { normalizar } from './cifrado.ts';
import { parseNota, pitchClass } from './teoria.ts';
import { detener, tocar } from './audio.ts';
import type { Evento } from './secuencias.ts';

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento (modo privado…): la elección dura lo que la página.
  }
}

/** Botón del selector que corresponde a una tónica, aceptando enarmónicos (A# → Bb). */
function botonDeTonica(botones: HTMLButtonElement[], tonica: string | null): HTMLButtonElement | undefined {
  if (!tonica) return undefined;
  const exacto = botones.find((b) => b.dataset.tonica === tonica);
  if (exacto) return exacto;
  try {
    const pc = pitchClass(parseNota(tonica));
    return botones.find((b) => pitchClass(parseNota(b.dataset.tonica!)) === pc);
  } catch {
    return undefined;
  }
}

/**
 * Conecta el selector de tónica de la página (componente SelectorTonica).
 * Llama a `alCambiar` con la tónica inicial y cada vez que cambie. La inicial
 * es la de la URL (?tonica=Bb, desde los enlaces del repertorio) o, si no hay,
 * la última elegida en esta sección.
 */
export function conectarTonica(alCambiar: (tonica: string) => void) {
  const selector = document.querySelector<HTMLElement>('[data-selector-tonica]');
  if (!selector) return;
  const clave = `tonica:${selector.dataset.clave}`;
  const botones = [...selector.querySelectorAll<HTMLButtonElement>('button[data-tonica]')];

  const elegir = (tonica: string) => {
    for (const b of botones) b.setAttribute('aria-pressed', String(b.dataset.tonica === tonica));
    guardar(clave, tonica);
    alCambiar(tonica);
  };

  for (const b of botones) b.addEventListener('click', () => elegir(b.dataset.tonica!));
  const inicial =
    botonDeTonica(botones, new URLSearchParams(location.search).get('tonica')) ?? botonDeTonica(botones, leer(clave));
  if (inicial) elegir(inicial.dataset.tonica!);
}

/**
 * Conecta el buscador de la página: oculta los elementos [data-buscar] cuyo
 * texto no contiene lo escrito, y los grupos [data-grupo-busqueda] que se quedan vacíos.
 */
export function conectarBuscador() {
  const entrada = document.querySelector<HTMLInputElement>('[data-buscador]');
  if (!entrada) return;
  const elementos = [...document.querySelectorAll<HTMLElement>('[data-buscar]')];
  const grupos = [...document.querySelectorAll<HTMLElement>('[data-grupo-busqueda]')];
  const vacio = document.querySelector<HTMLElement>('[data-sin-resultados]');

  const filtrar = () => {
    const consulta = normalizar(entrada.value.trim());
    let visibles = 0;
    for (const el of elementos) {
      const coincide = normalizar(el.dataset.buscar!).includes(consulta);
      el.hidden = !coincide;
      if (coincide) visibles++;
    }
    for (const g of grupos) g.hidden = !g.querySelector('[data-buscar]:not([hidden])');
    if (vacio) vacio.hidden = visibles > 0;
  };

  entrada.addEventListener('input', filtrar);
  filtrar();
}

/**
 * Conecta el control de tempo de la página (componente Tempo).
 * Devuelve una función que da el tempo actual en BPM.
 */
export function conectarTempo(): () => number {
  const control = document.querySelector<HTMLInputElement>('[data-tempo]');
  if (!control) return () => 100;
  const clave = `tempo:${control.dataset.clave}`;
  const valor = document.querySelector('[data-tempo-valor]');
  const mostrar = () => {
    if (valor) valor.textContent = control.value;
  };
  const guardado = Number(leer(clave));
  if (guardado >= Number(control.min) && guardado <= Number(control.max)) control.value = String(guardado);
  mostrar();
  control.addEventListener('input', () => {
    mostrar();
    guardar(clave, control.value);
  });
  return () => Number(control.value);
}

/**
 * Conecta los botones [data-audio] de la página. `construir` recibe el botón
 * pulsado y devuelve la secuencia que debe sonar. Pulsar el botón que está
 * sonando lo para; pulsar otro sustituye lo que suena.
 */
export function conectarAudio(construir: (boton: HTMLButtonElement) => Evento[]) {
  let activo: HTMLButtonElement | null = null;

  const marcar = (boton: HTMLButtonElement | null) => {
    activo?.classList.remove('sonando');
    activo?.setAttribute('aria-pressed', 'false');
    activo = boton;
    activo?.classList.add('sonando');
    activo?.setAttribute('aria-pressed', 'true');
  };

  document.addEventListener('click', async (evento) => {
    const boton = (evento.target as Element).closest<HTMLButtonElement>('button[data-audio]');
    if (!boton) return;
    if (boton === activo) {
      detener();
      marcar(null);
      return;
    }
    marcar(boton);
    try {
      await tocar(construir(boton));
    } catch (error) {
      console.error(error);
    }
    if (activo === boton) marcar(null);
  });
}
