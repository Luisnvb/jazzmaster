// Comportamiento en el navegador compartido por varias secciones.
import { normalizar } from './cifrado.ts';

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

/**
 * Conecta el selector de tónica de la página (componente SelectorTonica).
 * Llama a `alCambiar` con la tónica inicial (la última elegida en esta sección)
 * y cada vez que cambie.
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
  const guardada = leer(clave);
  if (guardada && botones.some((b) => b.dataset.tonica === guardada)) elegir(guardada);
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
