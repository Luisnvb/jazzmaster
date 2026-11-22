// Idiomas de la web. El español es el principal y vive en la raíz (/acordes/); el inglés,
// bajo /en/ con sus propias direcciones (/en/tools/metronome/). De momento solo están en
// inglés la interfaz común y las Herramientas (ver docs/decisiones/0011). Funciones puras,
// sin DOM ni import.meta.env: las usan las páginas al compilar, los scripts del
// navegador y los tests.

export type Idioma = 'es' | 'en';

export const IDIOMAS: readonly Idioma[] = ['es', 'en'];

/** Prefijo de las direcciones de cada idioma ('' = la raíz). */
export const PREFIJO: Record<Idioma, string> = { es: '', en: 'en' };

/** Nombre de cada idioma en su propio idioma (para el selector). */
export const NOMBRE_IDIOMA: Record<Idioma, string> = { es: 'Español', en: 'English' };

/** Valor de <html lang> leído o escrito: lo que no sea 'en' cuenta como español. */
export const idiomaValido = (x: unknown): Idioma => (x === 'en' ? 'en' : 'es');

/** Idioma de una dirección de la web: '/jazzmaster/en/tools/' con base '/jazzmaster/' → 'en'. */
export function idiomaDeDireccion(pathname: string, base = '/'): Idioma {
  const dentro = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/+/, '');
  return /^en(?:\/|$)/.test(dentro) ? 'en' : 'es';
}

/** Dirección relativa a la base con el prefijo del idioma: ('en', 'tools/metronome') → 'en/tools/metronome'. */
export const conPrefijo = (idioma: Idioma, direccion: string) =>
  [PREFIJO[idioma], direccion.replace(/^\/+|\/+$/g, '')].filter(Boolean).join('/');

/**
 * Rellena una plantilla: formatear('Compás {n} · {bpm} BPM', { n: 3, bpm: 120 }).
 * Las llaves sin valor se dejan tal cual, para que se note.
 */
export function formatear(plantilla: string, valores: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (todo, clave: string) => (clave in valores ? String(valores[clave]) : todo));
}

/** Plural sencillo: plural(1, 'día', 'días') → 'día'. */
export const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/**
 * Textos de una página o componente en los dos idiomas. El inglés tiene que tener las
 * mismas claves que el español (el tipo lo exige: si falta una, `astro check` falla).
 */
export function textos<T extends Record<string, unknown>>(es: T, en: { [K in keyof T]: T[K] }): Record<Idioma, T> {
  return { es, en: en as T };
}

/** Formatos de fecha y número de cada idioma (para Intl). */
export const LOCALE: Record<Idioma, string> = { es: 'es', en: 'en' };

/** Clave de localStorage con el idioma que eligió el visitante (al cambiar o al rechazar la sugerencia). */
export const CLAVE_IDIOMA = 'idioma:elegido';

/**
 * El idioma que conviene sugerir en una página en `actual`, o null si no hay que sugerir
 * nada. Si el visitante ya eligió, se respeta: solo se sugiere su idioma si la página
 * está en el otro. Si no eligió, manda el primero de los idiomas del navegador que
 * tenga la web (es-MX → es); si ninguno, el inglés. Nunca se redirige: es una sugerencia.
 */
export function idiomaSugerido(navegador: readonly string[], actual: Idioma, elegido: unknown): Idioma | null {
  if (elegido === 'es' || elegido === 'en') return elegido === actual ? null : elegido;
  if (!navegador.length) return null;
  const principal = navegador.map((l) => l.toLowerCase().split(/[-_]/)[0]).find((l): l is Idioma => (IDIOMAS as readonly string[]).includes(l));
  const preferido: Idioma = principal ?? 'en';
  return preferido === actual ? null : preferido;
}
