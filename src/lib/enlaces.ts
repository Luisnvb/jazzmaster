// Enlaces entre secciones con el acorde ya elegido: del Repertorio a Mástil por
// capas y Arpegios, y de Mástil por capas al resto. Cada página destino lee su
// parte de la dirección (?tonica=Bb&cualidad=m7…). Funciones puras: la ruta de
// la página se pasa ya hecha (lib/rutas.ts depende de Astro).
import { CUALIDADES_CAPAS, FORMAS_CAGED, type FormaCapas } from './capas.ts';

/** Lo que se puede pedir a Mástil por capas desde un enlace. */
export interface DestinoCapas {
  cualidad: string;
  forma?: FormaCapas;
  /** Id de la escala de la cualidad ('alterada', 'dorica'…). */
  escala?: string;
}

/**
 * Cada grupo de acordes (grupos.yaml) en las otras secciones: su cualidad en
 * Mástil por capas (y la escala, si no es la primera) y su arpegio en Arpegios
 * (si lo hay).
 */
export const DESDE_GRUPO: Record<string, { capas: DestinoCapas; arpegio?: string }> = {
  maj7: { capas: { cualidad: 'maj7' }, arpegio: 'Imaj7' },
  m7: { capas: { cualidad: 'm7' }, arpegio: 'Im7' },
  mmaj7: { capas: { cualidad: 'menor', escala: 'eolica' }, arpegio: 'ImMaj7' },
  dom7: { capas: { cualidad: '7' }, arpegio: 'I7' },
  sus: { capas: { cualidad: 'sus4' }, arpegio: 'I7sus4' },
  alt7: { capas: { cualidad: '7', escala: 'alterada' }, arpegio: 'I7' },
  aug: { capas: { cualidad: 'aum' } },
  m7b5: { capas: { cualidad: 'm7b5' }, arpegio: 'Im7b5' },
  dim7: { capas: { cualidad: 'dim', escala: 'disminuida' }, arpegio: 'I°7' },
};

/** Cada cualidad de Mástil por capas en las otras secciones: su grupo de acordes, su arpegio y si es una tríada. */
export const DESDE_CUALIDAD: Record<string, { grupo: string; arpegio?: string; triada?: boolean }> = {
  mayor: { grupo: 'maj7', arpegio: 'I', triada: true },
  menor: { grupo: 'm7', arpegio: 'Im', triada: true },
  dim: { grupo: 'dim7', triada: true },
  aum: { grupo: 'aug', triada: true },
  sus4: { grupo: 'sus', arpegio: 'I7sus4', triada: true },
  maj7: { grupo: 'maj7', arpegio: 'Imaj7' },
  '7': { grupo: 'dom7', arpegio: 'I7' },
  m7: { grupo: 'm7', arpegio: 'Im7' },
  m7b5: { grupo: 'm7b5', arpegio: 'Im7b5' },
  '6': { grupo: 'maj7', arpegio: 'I6' },
};

const consulta = (datos: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(datos)) if (v) p.set(k, v);
  return `?${p}`;
};

/** Mástil por capas con un acorde: `pagina` es ruta('estudio/capas'). */
export const enlaceCapas = (pagina: string, tonica: string, d: DestinoCapas) =>
  pagina + consulta({ tonica, cualidad: d.cualidad, forma: d.forma, escala: d.escala });

/** Arpegios con un acorde: `pagina` es ruta('estudio/arpegios'); `cualidad`, como en su selector ('Im7'). */
export const enlaceArpegios = (pagina: string, tonica: string, cualidad: string) => pagina + consulta({ tonica, cualidad });

/** Página con la tónica y un grupo de acordes (Acordes, Escalas): `pagina` es ruta('acordes')… */
export const enlaceGrupo = (pagina: string, tonica: string, grupo: string) => `${pagina}${consulta({ tonica })}#grupo-${grupo}`;

/** Lo que pide la dirección a Mástil por capas (solo lo válido). */
export function leerDestinoCapas(search: string): Partial<DestinoCapas> {
  const p = new URLSearchParams(search);
  const res: Partial<DestinoCapas> = {};
  const c = CUALIDADES_CAPAS.find((x) => x.id === p.get('cualidad'));
  if (c) {
    res.cualidad = c.id;
    const e = p.get('escala');
    if (e && c.escalas.some((x) => x.id === e)) res.escala = e;
  }
  const f = p.get('forma');
  if (f === 'todo' || FORMAS_CAGED.some((x) => x.letra === f)) res.forma = f as FormaCapas;
  return res;
}
