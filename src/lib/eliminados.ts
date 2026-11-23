// Registros eliminados desde la web (escalas, intervalos, canciones del repositorio).
// La web es estática: eliminar oculta el registro en este navegador y se puede
// deshacer con «Restaurar eliminados». Para quitarlo del todo, bórralo del archivo de datos.
import { borrar, guardarJSON, leerJSON } from './almacen.ts';
import { formatear, idiomaValido } from '../i18n/idiomas.ts';
import { INTERFAZ } from '../i18n/interfaz.ts';

const clave = (seccion: string) => `eliminados:${seccion}`;

export function eliminados(seccion: string): Set<string> {
  return new Set(leerJSON<string[]>(clave(seccion)) ?? []);
}

export function eliminar(seccion: string, id: string) {
  const ids = eliminados(seccion);
  ids.add(id);
  guardarJSON(clave(seccion), [...ids]);
}

export function restaurarEliminados(seccion: string) {
  borrar(clave(seccion));
}

/**
 * Conecta los elementos [data-eliminable="<id>"] de la página: los ya eliminados
 * se ocultan, sus botones [data-eliminar] los eliminan (tras confirmar) y el botón
 * [data-restaurar-eliminados] los recupera. `alEliminar`, si devuelve true, se
 * encarga él del borrado (p. ej. canciones que solo existen en el navegador).
 * Devuelve una función para volver a aplicarlo si la página repinta los registros.
 */
export function conectarEliminados(seccion: string, alEliminar?: (id: string, el: HTMLElement) => boolean): () => void {
  const restaurar = document.querySelector<HTMLButtonElement>('[data-restaurar-eliminados]');
  const T = INTERFAZ[idiomaValido(document.documentElement.lang)];

  const aplicar = () => {
    const ids = eliminados(seccion);
    for (const el of document.querySelectorAll<HTMLElement>('[data-eliminable]')) {
      const fuera = ids.has(el.dataset.eliminable!);
      el.toggleAttribute('data-eliminado', fuera);
      el.hidden = fuera;
    }
    if (restaurar) {
      restaurar.hidden = ids.size === 0;
      restaurar.textContent = formatear(T.restaurarEliminadosN, { n: ids.size });
    }
    // Que el buscador vuelva a filtrar (y oculte los grupos vacíos).
    document.querySelector('[data-buscador]')?.dispatchEvent(new Event('input'));
  };

  document.addEventListener('click', (e) => {
    const objetivo = e.target as Element;
    if (restaurar && objetivo.closest('[data-restaurar-eliminados]')) {
      restaurarEliminados(seccion);
      aplicar();
      return;
    }
    const boton = objetivo.closest<HTMLButtonElement>('button[data-eliminar]');
    const el = boton?.closest<HTMLElement>('[data-eliminable]');
    if (!boton || !el) return;
    e.preventDefault();
    const nombre = el.dataset.nombre ?? T.esteRegistro;
    if (!confirm(formatear(T.confirmarEliminar, { nombre }))) return;
    if (alEliminar?.(el.dataset.eliminable!, el)) return;
    eliminar(seccion, el.dataset.eliminable!);
    aplicar();
  });

  aplicar();
  return aplicar;
}
