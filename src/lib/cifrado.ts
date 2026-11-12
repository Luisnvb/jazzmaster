/**
 * Convierte el cifrado de una sección en compases:
 * "Fmaj7 | Gm7 C7 |" → [['Fmaj7'], ['Gm7', 'C7']]
 * Los compases vacíos ("| |") se conservan; las barras inicial y final se ignoran.
 */
export function compases(cifrado: string): string[][] {
  const trozos = cifrado.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
  if (trozos.length === 1 && trozos[0].trim() === '') return [];
  return trozos.map((c) => c.trim().split(/\s+/).filter(Boolean));
}

export interface AcordeCifrado {
  /** Tónica tal como está escrita (Bb, F#…). */
  tonica: string;
  /** id del grupo (grupos.yaml) al que pertenece, o null si no se reconoce. */
  grupo: string | null;
}

// Reglas de calidad → grupo, en orden: la primera que coincide gana.
// Se aplican a la calidad sin paréntesis ni espacios (Cm(maj7) → "mmaj7").
const MAYOR = '(?:maj|Maj|MAJ|ma|M|Δ|△|\\^)';
const MENOR = '(?:m|-|min|mi)';
const REGLAS: [RegExp, string][] = [
  [/^(?:°|o|dim)7?$/, 'dim7'],
  [new RegExp(`^(?:ø7?|${MENOR}7b5|${MENOR}9b5)$`), 'm7b5'],
  [new RegExp(`^${MENOR}${MAYOR}(?:7|9|11|13)?$`), 'mmaj7'],
  // Dominante con tensiones alteradas (7#11 es lidio dominante, no alterado).
  [/^(?:\+7|7\+|aug7|7alt|alt|(?:7|9|13).*(?:b9|#9|b13|#5|\+5|b5|alt).*)$/, 'alt7'],
  [new RegExp(`^(?:|6|69|add9|${MAYOR}(?:7|9|11|13)?(?:#11)?)$`), 'maj7'],
  [new RegExp(`^${MENOR}(?:6|7|9|11|13|69)?$`), 'm7'],
  [/^(?:7|9|11|13|sus)/, 'dom7'],
];

/** Analiza un acorde del cifrado: "Bbmaj7" → { tonica: 'Bb', grupo: 'maj7' }. */
export function analizarAcorde(simbolo: string): AcordeCifrado | null {
  const m = /^([A-G](?:b|#)?)([^/]*)(?:\/[A-G](?:b|#)?)?$/.exec(simbolo.trim());
  if (!m) return null;
  const calidad = m[2].replace(/[()\s]/g, '');
  const regla = REGLAS.find(([re]) => re.test(calidad));
  return { tonica: m[1], grupo: regla ? regla[1] : null };
}

/** Texto en minúsculas y sin tildes, para buscar sin preocuparse de acentos. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
