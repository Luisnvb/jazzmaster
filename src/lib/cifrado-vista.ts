// HTML del cifrado (formato .cmb.json) y su secuencia de audio.
// Funciones puras: reciben el cifrado y devuelven texto o eventos.
import { esc } from './almacen.ts';
import { formaDeCelda, grupoDeCelda, lineas, simboloCelda, tiemposPorCompas, type CeldaCmb, type Cmb, type FormaCelda } from './cmb.ts';
import { diagramaSVG } from './diagrama.ts';
import type { Forma } from './formas.ts';
import { AFINACION, type Evento } from './secuencias.ts';
import { raizWeb } from './cmb.ts';

export interface OpcionesVista {
  diagramas: boolean;
  editando: boolean;
  seleccion: { compas: number; celda: number } | null;
  /** Formas personales por calidad (de la sección Acordes). */
  personales: Record<string, Forma[]>;
}

/** Forma, símbolo y grupo de una celda, calculados una vez. */
export function analizarCelda(celda: CeldaCmb, cmb: Cmb, personales: Record<string, Forma[]>) {
  const forma: FormaCelda | null = formaDeCelda(celda, personales[celda.type] ?? []);
  const grados = forma?.grados ?? [];
  return {
    forma,
    simbolo: simboloCelda(celda, grados, cmb.halfDimSymbol),
    grupo: grupoDeCelda(celda, grados),
  };
}

export function htmlCifrado(cmb: Cmb, op: OpcionesVista): string {
  const porLinea = Math.max(1, cmb.barsPerLine ?? 4);
  const indice = new Map(cmb.bars.map((b, i) => [b, i]));
  const conGrados = cmb.showDegrees !== false;
  return `<div class="cifrado${op.diagramas ? ' con-diagramas' : ''}${op.editando ? ' editando' : ''}">${lineas(cmb)
    .map(
      (linea) => `<div class="linea" style="--n:${Math.max(porLinea, linea.length)}">${linea
        .map((compas) => {
          const i = indice.get(compas)!;
          const clases = ['compas', compas.repeatStart && 'rep-ini', compas.repeatEnd && 'rep-fin', compas.ending != null && 'con-final']
            .filter(Boolean)
            .join(' ');
          const marcas = [
            compas.section ? `<span class="seccion-marca">${esc(compas.section)}</span>` : '',
            compas.ending != null && compas.ending !== '' ? `<span class="final-marca">${esc(compas.ending)}.</span>` : '',
            compas.timeSig ? `<span class="metrica">${esc(compas.timeSig.label)}</span>` : '',
          ].join('');
          const celdas = compas.cells
            .map((celda, j) => {
              const { forma, simbolo, grupo } = analizarCelda(celda, cmb, op.personales);
              const sel = op.seleccion?.compas === i && op.seleccion?.celda === j;
              const enlaza = !op.editando && grupo ? ' popovertarget="menu-acorde"' : '';
              const diagrama =
                op.diagramas && forma
                  ? diagramaSVG({ trastes: forma.trastes, grados: conGrados ? forma.grados : forma.grados.map(() => '') })
                  : '';
              return `<button type="button" class="celda${sel ? ' sel' : ''}${enlaza ? ' enlazada' : ''}" data-compas="${i}" data-celda="${j}"${enlaza}
                data-tonica="${esc(raizWeb(celda.root))}" data-grupo="${esc(grupo ?? '')}" data-simbolo="${esc(simbolo)}"
                ${sel ? 'aria-current="true"' : ''}><span class="simbolo">${esc(simbolo)}</span>${diagrama}</button>`;
            })
            .join('');
          return `<div class="${clases}"><div class="marcas">${marcas}</div><div class="celdas">${celdas}</div></div>`;
        })
        .join('')}</div>`,
    )
    .join('')}</div>`;
}

/** Notas que suenan en una forma (MIDI, de grave a agudo). */
export const alturas = (forma: FormaCelda | null) =>
  forma ? forma.trastes.flatMap((t, c) => (t === 'x' ? [] : [AFINACION[c] + t])) : [];

/** Rasgueo de una forma que dura `duracion` segundos desde `inicio`. */
function rasgueo(forma: FormaCelda | null, inicio: number, duracion: number): Evento[] {
  return alturas(forma).map((m, k) => ({ midi: m, inicio: inicio + k * 0.03, duracion: Math.max(0.2, duracion - k * 0.03) }));
}

export const secuenciaAcorde = (forma: FormaCelda | null) => rasgueo(forma, 0, 2.5);

/** Cuándo empieza y acaba cada acorde del cifrado (segundos), con el mismo reparto que secuenciaCifrado. */
export function tiemposCifrado(cmb: Cmb, bpm: number, desde = 0): { compas: number; celda: number; inicio: number; fin: number }[] {
  const pulso = 60 / bpm;
  const tiempos = tiemposPorCompas(cmb);
  const resultado: { compas: number; celda: number; inicio: number; fin: number }[] = [];
  let t = 0;
  cmb.bars.forEach((compas, i) => {
    if (i < desde) return;
    const porCelda = (tiempos[i] * pulso) / Math.max(1, compas.cells.length);
    compas.cells.forEach((_, j) => {
      resultado.push({ compas: i, celda: j, inicio: t, fin: t + porCelda });
      t += porCelda;
    });
  });
  return resultado;
}

/**
 * El cifrado entero a un tempo, desde el compás `desde`: cada compás se reparte
 * a partes iguales entre sus acordes. Las repeticiones no se tocan.
 */
export function secuenciaCifrado(cmb: Cmb, bpm: number, personales: Record<string, Forma[]>, desde = 0): Evento[] {
  const pulso = 60 / bpm;
  const tiempos = tiemposPorCompas(cmb);
  const eventos: Evento[] = [];
  let t = 0;
  cmb.bars.forEach((compas, i) => {
    if (i < desde) return;
    const porCelda = (tiempos[i] * pulso) / Math.max(1, compas.cells.length);
    for (const celda of compas.cells) {
      eventos.push(...rasgueo(analizarCelda(celda, cmb, personales).forma, t, porCelda));
      t += porCelda;
    }
  });
  return eventos;
}
