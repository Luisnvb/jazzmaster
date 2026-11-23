// Voicings de la sección Acordes: los del repositorio (src/data/acordes.yaml)
// más las ediciones hechas en el navegador, y su exportación a YAML.
import { gradosDeTrastes } from './formas.ts';
import { parseGrado, parseNota, pitchClass, semitonosGrado } from './teoria.ts';
import type { Traste } from './voicings.ts';

export interface Voicing {
  id: string;
  grupo: string;
  nombre: string;
  tonica: string;
  trastes: Traste[];
  grados: string[];
  dedos?: (number | 'T' | '')[];
  notas?: string;
  /** Versión inglesa: nombre (si cambia, como Tríada → Triad) y notas. */
  en?: { nombre?: string; notas?: string };
}

/** Ediciones locales: id → voicing cambiado o nuevo, o null si se ha borrado. */
export type Cambios = Record<string, Voicing | null>;

/**
 * Lista final: los del repositorio en su orden (con los cambios aplicados y sin
 * los borrados) y después los nuevos, en el orden en que se crearon.
 */
export function aplicarCambios(base: readonly Voicing[], cambios: Cambios): Voicing[] {
  const ids = new Set(base.map((v) => v.id));
  const res: Voicing[] = [];
  for (const v of base) {
    if (!(v.id in cambios)) res.push(v);
    else if (cambios[v.id]) res.push(cambios[v.id]!);
  }
  for (const [id, v] of Object.entries(cambios)) if (!ids.has(id) && v) res.push(v);
  return res;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

const ERRORES = {
  es: {
    nombre: 'Falta el nombre.',
    tipo: 'Tipo de acorde desconocido.',
    tonica: 'Tónica no válida.',
    seis: 'Hacen falta 6 cuerdas.',
    alguna: 'Toca al menos una cuerda.',
    cuerda: (n: number) => `${n}ª cuerda`,
    apagada: 'está apagada y tiene grado.',
    falta: 'falta el grado.',
    invalido: (g: string) => `grado no válido "${g}".`,
    distinto: (t: Traste, esperado: string, tonica: string, g: string) => `la nota del traste ${t} es ${esperado} de ${tonica}, no ${g}.`,
  },
  en: {
    nombre: 'The name is missing.',
    tipo: 'Unknown chord type.',
    tonica: 'Invalid root.',
    seis: 'It needs 6 strings.',
    alguna: 'Play at least one string.',
    cuerda: (n: number) => `${n}${['', 'st', 'nd', 'rd'][n] ?? 'th'} string`,
    apagada: 'it is muted but has a degree.',
    falta: 'the degree is missing.',
    invalido: (g: string) => `invalid degree "${g}".`,
    distinto: (t: Traste, esperado: string, tonica: string, g: string) => `the note at fret ${t} is the ${esperado} of ${tonica}, not ${g}.`,
  },
};

/** Errores de un voicing (lista vacía si es correcto), en el idioma de la página. */
export function erroresVoicing(v: Voicing, grupos: readonly string[], idioma: 'es' | 'en' = 'es'): string[] {
  const E = ERRORES[idioma];
  const errores: string[] = [];
  if (!v.nombre.trim()) errores.push(E.nombre);
  if (!grupos.includes(v.grupo)) errores.push(E.tipo);
  let tonica: unknown = null;
  try {
    tonica = parseNota(v.tonica);
  } catch {
    errores.push(E.tonica);
  }
  if (v.trastes.length !== 6 || v.grados.length !== 6) errores.push(E.seis);
  if (v.trastes.every((t) => t === 'x')) errores.push(E.alguna);
  v.trastes.forEach((t, c) => {
    const g = v.grados[c];
    const cuerda = E.cuerda(6 - c);
    if (t === 'x') {
      if (g) errores.push(`${cuerda}: ${E.apagada}`);
      return;
    }
    if (!g) return void errores.push(`${cuerda}: ${E.falta}`);
    try {
      parseGrado(g);
    } catch {
      return void errores.push(`${cuerda}: ${E.invalido(g)}`);
    }
    if (!tonica) return;
    const esperado = gradosDeTrastes(v.tonica, cuerdaSola(c, t))[c];
    if (mod(semitonosGrado(g), 12) !== mod(semitonosGrado(esperado), 12)) {
      errores.push(`${cuerda}: ${E.distinto(t, esperado, v.tonica, g)}`);
    }
  });
  return errores;
}

/** Trastes con solo una cuerda tocada. */
function cuerdaSola(c: number, t: Traste): Traste[] {
  return Array.from({ length: 6 }, (_, i) => (i === c ? t : 'x'));
}

/** Grados que suenan en unos trastes, con la ortografía del grupo (su arpegio primero). */
export function gradosSugeridos(tonica: string, trastes: readonly Traste[], arpegio: readonly string[]): string[] {
  return gradosDeTrastes(tonica, trastes, [...arpegio, '9', 'b9', '#9', '11', '#11', '13', 'b13']);
}

/** Id libre a partir del grupo y el nombre: "m7", "Drop 2" → "m7-drop-2-2". */
export function nuevoIdVoicing(v: Pick<Voicing, 'grupo' | 'nombre'>, existentes: Iterable<string>): string {
  const usados = new Set(existentes);
  const base = `${v.grupo}-${v.nombre}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  let id = base;
  for (let n = 2; usados.has(id); n++) id = `${base}-${n}`;
  return id;
}

const CABECERA = `# Voicings personales. Cada uno se escribe sobre una tónica de referencia y la web
# lo transporta moviendo el mismo dibujo de traste.
#
#   nombre:    nombre del voicing (shell, drop 2…); la cuerda del bajo se añade sola
#   grupo:     id de un tipo de acorde de grupos.yaml
#   tonica:    tónica en la que están escritos los trastes
#   trastes:   de 6ª a 1ª cuerda; número de traste, 0 = al aire, x = apagada
#   grados:    de 6ª a 1ª cuerda; '' en las cuerdas apagadas
#   dedos:     opcional, de 6ª a 1ª; '' donde no aplique
#   notas:     texto libre
#   en:        opcional, versión inglesa: { nombre, notas }
#
# La cuerda del bajo se deduce: es la primera cuerda tocada empezando por la 6ª.
# Exportado desde la web: sustituye src/data/acordes.yaml por este archivo.
`;

const cadena = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lista = (xs: readonly (string | number)[]) => `[${xs.map((x) => (typeof x === 'number' || x === 'x' ? String(x) : cadena(x))).join(', ')}]`;

/** Un voicing en el formato de src/data/acordes.yaml. */
export function voicingAYaml(v: Voicing): string {
  {
    const lineas: string[] = [
      `- id: ${v.id}`,
      `  grupo: ${v.grupo}`,
      `  nombre: ${cadena(v.nombre)}`,
      `  tonica: ${v.tonica}`,
      `  trastes: ${lista(v.trastes)}`,
      `  grados: ${lista(v.grados)}`,
    ];
    if (v.dedos?.some(Boolean)) lineas.push(`  dedos: ${lista(v.dedos)}`);
    if (v.notas?.trim()) {
      lineas.push(v.notas.includes('\n') ? `  notas: |\n${v.notas.replace(/^/gm, '    ')}` : `  notas: ${cadena(v.notas)}`);
    }
    const en = limpiarEn(v.en);
    if (en) {
      lineas.push('  en:');
      if (en.nombre) lineas.push(`    nombre: ${cadena(en.nombre)}`);
      if (en.notas) lineas.push(en.notas.includes('\n') ? `    notas: |\n${en.notas.replace(/^/gm, '      ')}` : `    notas: ${cadena(en.notas)}`);
    }
    return lineas.join('\n');
  }
}

/** Lista de voicings en el formato de src/data/acordes.yaml. */
export function voicingsAYaml(voicings: readonly Voicing[]): string {
  return `${CABECERA}\n${voicings.map(voicingAYaml).join('\n\n')}\n`;
}

/** Comprueba la forma de un voicing leído de un archivo. */
export function aVoicing(x: unknown): Voicing {
  const v = x as Partial<Voicing>;
  if (!v || typeof v !== 'object' || typeof v.id !== 'string' || !Array.isArray(v.trastes) || !Array.isArray(v.grados)) {
    throw new Error('Cada voicing necesita id, trastes y grados.');
  }
  return {
    id: v.id,
    grupo: String(v.grupo ?? ''),
    nombre: String(v.nombre ?? ''),
    tonica: String(v.tonica ?? 'C'),
    trastes: v.trastes.map((t) => (t === 'x' ? 'x' : Number(t))) as Traste[],
    grados: v.grados.map((g) => String(g ?? '')),
    ...(v.dedos ? { dedos: v.dedos } : {}),
    ...(v.notas ? { notas: String(v.notas) } : {}),
    ...(limpiarEn(v.en) ? { en: limpiarEn(v.en) } : {}),
  };
}

/** La versión inglesa sin campos vacíos, o undefined si no queda nada. */
export function limpiarEn(en: unknown): Voicing['en'] {
  if (!en || typeof en !== 'object') return undefined;
  const { nombre, notas } = en as Record<string, unknown>;
  const limpio = {
    ...(typeof nombre === 'string' && nombre.trim() ? { nombre: nombre.trim() } : {}),
    ...(typeof notas === 'string' && notas.trim() ? { notas: notas.trim() } : {}),
  };
  return Object.keys(limpio).length ? limpio : undefined;
}

/** Clase de altura de la tónica (para comparar Bb con A#). */
export const pcTonica = (t: string) => pitchClass(parseNota(t));

/** Ordena según una lista de ids guardada; lo que no está en ella conserva su sitio relativo, al final. */
export function ordenarPorIds<T extends { id: string }>(lista: readonly T[], orden: readonly string[]): T[] {
  const pos = new Map(orden.map((id, i) => [id, i]));
  return lista
    .map((v, i) => ({ v, i, p: pos.get(v.id) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .map((x) => x.v);
}

/**
 * Cambia un voicing de sitio con su vecino del mismo grupo (-1 = antes, 1 = después).
 * `visible` limita los vecinos a los que se ven en la página (Voicings o Cuerdas al aire).
 */
export function moverEnGrupo<T extends { id: string; grupo: string }>(
  lista: readonly T[],
  id: string,
  direccion: -1 | 1,
  visible: (v: T) => boolean = () => true,
): T[] {
  const res = [...lista];
  const i = res.findIndex((v) => v.id === id);
  if (i === -1) return res;
  let j = i + direccion;
  while (j >= 0 && j < res.length && (res[j].grupo !== res[i].grupo || !visible(res[j]))) j += direccion;
  if (j < 0 || j >= res.length) return res;
  [res[i], res[j]] = [res[j], res[i]];
  return res;
}
