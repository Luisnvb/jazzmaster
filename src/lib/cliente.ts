// Comportamiento en el navegador compartido por varias secciones.
import { normalizar } from './cifrado.ts';
import { parseNota, pitchClass } from './teoria.ts';
import { detener, tocar, type Instrumento } from './audio.ts';
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
      // Los eliminados (lib/eliminados.ts) siguen ocultos aunque coincidan.
      const coincide = normalizar(el.dataset.buscar!).includes(consulta) && !el.hasAttribute('data-eliminado');
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

// --- Pantalla encendida mientras suena ------------------------------------------
// Como un vídeo: mientras hay reproducción se pide al sistema que no apague la
// pantalla (Screen Wake Lock). Con la pantalla apagada el móvil frena la página y
// el audio se corta. El sistema suelta el bloqueo al cambiar de pestaña o de app,
// así que se vuelve a pedir al volver si sigue sonando.
let bloqueo: WakeLockSentinel | null = null;
let quiereBloqueo = false;

async function pedirBloqueo() {
  if (!quiereBloqueo || bloqueo || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    bloqueo = await navigator.wakeLock.request('screen');
    bloqueo.addEventListener('release', () => (bloqueo = null));
    // Si se paró mientras se concedía, se suelta enseguida.
    if (!quiereBloqueo) soltarBloqueo();
  } catch {
    // Sin permiso (batería baja, http sin cifrar…): la pantalla se apagará como siempre.
  }
}

function soltarBloqueo() {
  bloqueo?.release().catch(() => {});
  bloqueo = null;
}

/** Mantiene la pantalla encendida (true) o deja que se apague (false). */
export function pantallaEncendida(si: boolean) {
  quiereBloqueo = si;
  if (si) void pedirBloqueo();
  else soltarBloqueo();
}

document.addEventListener('visibilitychange', () => void pedirBloqueo());

/** Secuencia con avisos de progreso (p. ej. para marcar el acorde que suena). */
export interface Reproduccion {
  eventos: Evento[];
  alProgresar?: (segundos: number) => void;
  alTerminar?: () => void;
  instrumento?: Instrumento;
  /** Si devuelve true al acabar una vuelta, se vuelve a empezar sin pausa. */
  bucle?: () => boolean;
  /** Duración musical de una vuelta (necesaria para encadenar el bucle a tiempo). */
  duracion?: number;
}

/**
 * Conecta los botones [data-audio] de la página. `construir` recibe el botón
 * pulsado y devuelve la secuencia que debe sonar. Pulsar el botón que está
 * sonando lo para; pulsar otro sustituye lo que suena. Los botones
 * [data-detener] paran cualquier reproducción.
 */
export function conectarAudio(construir: (boton: HTMLButtonElement) => Evento[] | Reproduccion) {
  let activo: HTMLButtonElement | null = null;

  const marcar = (boton: HTMLButtonElement | null) => {
    activo?.classList.remove('sonando');
    activo?.setAttribute('aria-pressed', 'false');
    activo = boton;
    activo?.classList.add('sonando');
    activo?.setAttribute('aria-pressed', 'true');
    document.documentElement.classList.toggle('reproduciendo', activo !== null);
    pantallaEncendida(activo !== null);
  };

  document.addEventListener('click', async (evento) => {
    if ((evento.target as Element).closest('button[data-detener]')) {
      detener();
      marcar(null);
      return;
    }
    const boton = (evento.target as Element).closest<HTMLButtonElement>('button[data-audio]');
    if (!boton) return;
    if (boton === activo) {
      detener();
      marcar(null);
      return;
    }
    marcar(boton);
    let reproduccion: Reproduccion | null = null;
    try {
      const construida = construir(boton);
      reproduccion = Array.isArray(construida) ? { eventos: construida } : construida;
      const r = reproduccion;
      const enBucle = () => r.duracion != null && r.bucle?.() === true;
      let vuelta = 0;
      do {
        await tocar(r.eventos, r.alProgresar, r.instrumento, {
          duracion: enBucle() ? r.duracion : undefined,
          encadenar: vuelta++ > 0,
        });
      } while (activo === boton && enBucle());
    } catch (error) {
      console.error(error);
    }
    reproduccion?.alTerminar?.();
    if (activo === boton) marcar(null);
  });
}

/**
 * Conecta un selector de sonido ([data-instrumento]) y lo recuerda con `clave`.
 * Devuelve una función con el instrumento elegido.
 */
export function conectarInstrumento(clave: string, raiz: ParentNode = document): () => Instrumento {
  const sel = raiz.querySelector<HTMLSelectElement>('[data-instrumento]');
  if (!sel) return () => 'guitarra';
  const guardado = leer(clave);
  if (guardado && [...sel.options].some((o) => o.value === guardado)) sel.value = guardado;
  sel.addEventListener('change', () => guardar(clave, sel.value));
  return () => sel.value as Instrumento;
}

/**
 * Conecta un selector de arpegio (tipo de acorde, [data-filtro-arpegio]) que
 * filtra la página. Lo recuerda con `clave`; si la dirección lleva #grupo-…,
 * empieza en ese grupo. Llama a `alCambiar` con el id del grupo ('' = todos).
 */
export function conectarFiltroArpegio(clave: string, alCambiar: (grupo: string) => void) {
  const sel = document.querySelector<HTMLSelectElement>('[data-filtro-arpegio]');
  if (!sel) return;
  const valido = (v: string | null) => v !== null && [...sel.options].some((o) => o.value === v);
  const delEnlace = /^#grupo-(.+)$/.exec(location.hash)?.[1] ?? null;
  const inicial = valido(delEnlace) ? delEnlace! : valido(leer(clave)) ? leer(clave)! : '';
  sel.value = inicial;
  sel.addEventListener('change', () => {
    guardar(clave, sel.value);
    alCambiar(sel.value);
  });
  alCambiar(inicial);
}

/**
 * Mástil más ancho que su caja (en el móvil): desplaza la caja para que se vea la
 * zona marcada (y los ecos), en vez de quedarse siempre en la cejuela. Sin zona
 * acotada a unos trastes (todo, una cuerda…), vuelve al principio.
 */
export function mostrarZona(caja: HTMLElement) {
  if (caja.scrollWidth <= caja.clientWidth) {
    // Si los estilos aún no han llegado, el mástil todavía cabe: se reintenta al cargar.
    if (document.readyState !== 'complete') window.addEventListener('load', () => mostrarZona(caja), { once: true });
    return;
  }
  const marcas = [...caja.querySelectorAll<SVGGraphicsElement>('.zona, .eco')].map((r) => r.getBoundingClientRect());
  const anchoMastil = caja.querySelector('svg')?.getBoundingClientRect().width ?? 0;
  // Las zonas de cuerda ocupan todo el mástil: no hay nada que centrar.
  const acotadas = marcas.filter((r) => r.width < anchoMastil * 0.8);
  if (!acotadas.length) {
    caja.scrollLeft = 0;
    return;
  }
  const base = caja.getBoundingClientRect().left - caja.scrollLeft;
  const izq = Math.min(...acotadas.map((r) => r.left)) - base;
  const der = Math.max(...acotadas.map((r) => r.right)) - base;
  // Centrada si cabe; si no (zona y eco juntos), desde su borde izquierdo.
  caja.scrollLeft = der - izq <= caja.clientWidth ? (izq + der - caja.clientWidth) / 2 : izq - 8;
}
