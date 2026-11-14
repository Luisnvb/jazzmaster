// Voicings que aparecen en los cifrados del repertorio, para añadirlos a la
// sección Acordes. Cada forma (el mismo dibujo con los mismos grados) sale una
// sola vez aunque se toque en varias canciones o en varias tónicas.
import type { Voicing } from './acordes-datos.ts';
import { formaDeCelda, grupoDeCelda, raizWeb, simboloCelda, type Cmb } from './cmb.ts';
import type { Traste } from './voicings.ts';

export interface CifradoConTitulo {
  titulo: string;
  cmb: Cmb;
}

/**
 * Clave de una forma: grupo, grados y dibujo relativo al traste más bajo. Con
 * cuerdas al aire el dibujo no se puede mover, así que cuenta también la tónica.
 */
export function claveForma(v: Pick<Voicing, 'grupo' | 'trastes' | 'grados' | 'tonica'>): string {
  const tocados = v.trastes.filter((t): t is number => t !== 'x');
  const alAire = tocados.includes(0);
  const minimo = Math.min(...tocados);
  const dibujo = v.trastes.map((t: Traste) => (t === 'x' ? 'x' : alAire ? t : t - minimo)).join(',');
  return [v.grupo, v.grados.join(','), dibujo, alAire ? v.tonica : ''].join('|');
}

const ORDEN_CUERDA = (v: Voicing) => v.trastes.findIndex((t) => t !== 'x');

/**
 * Voicings nuevos (no presentes en `existentes`) de los cifrados. Se nombran con la
 * calidad del cifrado (m11, 7b9…) y llevan en las notas las canciones donde salen.
 * `ordenGrupos` decide el orden de salida (y descarta los acordes sin grupo conocido).
 */
export function voicingsDeCifrados(cifrados: readonly CifradoConTitulo[], existentes: readonly Voicing[], ordenGrupos: readonly string[]): Voicing[] {
  const vistos = new Set(existentes.map(claveForma));
  const nuevos = new Map<string, { v: Voicing; canciones: Set<string> }>();

  for (const { titulo, cmb } of cifrados) {
    for (const compas of cmb.bars) {
      for (const celda of compas.cells) {
        const forma = formaDeCelda(celda);
        if (!forma || forma.trastes.every((t) => t === 'x')) continue;
        const grupo = grupoDeCelda(celda, forma.grados);
        if (!grupo || !ordenGrupos.includes(grupo)) continue;
        const tonica = raizWeb(celda.root);
        // Sin calidad es una tríada mayor (C → "Tríada", C/G → "Tríada/G").
        const calidad = simboloCelda(celda, forma.grados).slice(tonica.length);
        const nombre = !calidad || calidad.startsWith('/') ? `Tríada${calidad}` : calidad;
        const v: Voicing = { id: '', grupo, nombre, tonica, trastes: forma.trastes, grados: forma.grados };
        const clave = claveForma(v);
        if (vistos.has(clave)) continue;
        const previo = nuevos.get(clave);
        if (previo) previo.canciones.add(titulo);
        else nuevos.set(clave, { v, canciones: new Set([titulo]) });
      }
    }
  }

  const lista = [...nuevos.values()].sort(
    (a, b) => ordenGrupos.indexOf(a.v.grupo) - ordenGrupos.indexOf(b.v.grupo) || ORDEN_CUERDA(a.v) - ORDEN_CUERDA(b.v) || a.v.nombre.localeCompare(b.v.nombre),
  );
  const ids = new Set(existentes.map((v) => v.id));
  const porGrupo = new Map<string, number>();
  return lista.map(({ v, canciones }) => {
    let n = porGrupo.get(v.grupo) ?? 0;
    let id: string;
    do id = `rep-${v.grupo}-${++n}`;
    while (ids.has(id));
    porGrupo.set(v.grupo, n);
    ids.add(id);
    return { ...v, id, notas: `De: ${[...canciones].sort().join(', ')}.` };
  });
}
