// Rearmonización: técnicas que transforman una progresión (en grados romanos)
// manteniendo su sentido funcional. Cada técnica recibe y devuelve compases de
// texto (['IIm7 V7', 'Imaj7']), así se pueden encadenar. Funciones puras.
import { parseAcordeGrado, type AcordeGrado } from './progresiones.ts';
import { semitonosGrado } from './teoria.ts';

const ROMANO: Record<number, string> = { 0: 'I', 1: 'bII', 2: 'II', 3: 'bIII', 4: 'III', 5: 'IV', 6: '#IV', 7: 'V', 8: 'bVI', 9: 'VI', 10: 'bVII', 11: 'VII' };
const mod = (n: number) => ((n % 12) + 12) % 12;
const raiz = (a: AcordeGrado) => mod(semitonosGrado(a.grado));
/** Los disminuidos de paso suben hacia el acorde siguiente: se escriben con sostenido (#I°7, #IV°7). */
const ROMANO_SOSTENIDO: Record<number, string> = { ...ROMANO, 1: '#I', 3: '#II', 8: '#V', 10: '#VI' };
/** Un dominante sobre el tritono de la tónica se escribe bV7 (el sustituto tritonal del I7). */
const ROMANO_DOMINANTE: Record<number, string> = { ...ROMANO, 6: 'bV' };
const acorde = (s: number, sufijo: string) =>
  `${(sufijo === '°7' ? ROMANO_SOSTENIDO : sufijo === '7' ? ROMANO_DOMINANTE : ROMANO)[mod(s)]}${sufijo}`;
const esDisminuido = (a: AcordeGrado) => a.grupo === 'dim7' || a.grupo === 'm7b5';
const esDominante = (a: AcordeGrado) => a.grupo === 'dom7' || a.grupo === 'alt7';
const esMenor = (a: AcordeGrado) => a.grupo === 'm7' || a.grupo === 'mmaj7';
const esMayor = (a: AcordeGrado) => a.grupo === 'maj7';

/** Lista plana de acordes con su compás, para mirar el siguiente aunque esté en otro compás. */
function aplanar(compases: readonly string[]) {
  return compases.flatMap((c, i) => c.trim().split(/\s+/).map((t) => ({ compas: i, texto: t, a: parseAcordeGrado(t) })));
}
function reagrupar(lista: { compas: number; texto: string }[], n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    lista
      .filter((x) => x.compas === i)
      .map((x) => x.texto)
      .join(' '),
  );
}

/** Cambia acordes uno a uno según el acorde siguiente (el último mira al primero, para el bucle). */
function porAcorde(compases: readonly string[], cambio: (a: AcordeGrado, sig: AcordeGrado, texto: string) => string): string[] {
  const lista = aplanar(compases);
  const nuevos = lista.map((x, i) => ({ ...x, texto: cambio(x.a, lista[(i + 1) % lista.length].a, x.texto) }));
  return reagrupar(nuevos, compases.length);
}

/**
 * Compases de un solo acorde que se parten para meter algo antes del siguiente
 * (`relleno` devuelve los acordes de la segunda mitad, o null para no tocarlo).
 */
function rellenar(compases: readonly string[], relleno: (a: AcordeGrado, sig: AcordeGrado) => string[] | null): string[] {
  return compases.map((c, i) => {
    const acordes = c.trim().split(/\s+/);
    if (acordes.length !== 1) return c;
    const a = parseAcordeGrado(acordes[0]);
    const sig = parseAcordeGrado(compases[(i + 1) % compases.length].trim().split(/\s+/)[0]);
    const extra = relleno(a, sig);
    return extra ? [acordes[0], ...extra].join(' ') : c;
  });
}

/** Sustitución diatónica: en dos compases seguidos del mismo acorde, el segundo pasa a uno de su misma función. */
export function sustitucionDiatonica(compases: readonly string[]): string[] {
  return compases.map((c, i) => {
    if (i === 0 || c.trim() !== compases[i - 1].trim() || c.trim().includes(' ')) return c;
    const a = parseAcordeGrado(c.trim());
    const s = raiz(a);
    if (s === 0 && esMayor(a)) return 'VIm7'; // I → VIm7 (tónica)
    if (s === 5 && esMayor(a)) return 'IIm7'; // IV → IIm7 (subdominante)
    if (s === 0 && esMenor(a)) return 'bIIImaj7'; // Im → bIII (tónica del menor)
    return c;
  });
}

/** Intercambio modal: el IV pasa a IVm7 y el IIm7 que va al V, a IIø7 (subdominante menor). */
export function intercambioModal(compases: readonly string[]): string[] {
  return porAcorde(compases, (a, sig, t) => {
    const s = raiz(a);
    if (s === 5 && esMayor(a)) return 'IVm7';
    if (s === 2 && esMenor(a) && raiz(sig) === 7) return 'IIm7b5';
    return t;
  });
}

/** Cadena de dominantes: todo acorde que va una cuarta hacia arriba se convierte en dominante (IIIm7 VIm7 → III7 VI7). */
export function cadenaDominantes(compases: readonly string[]): string[] {
  return porAcorde(compases, (a, sig, t) => (!esDominante(a) && !a.bajo && raiz(sig) === mod(raiz(a) + 5) ? acorde(raiz(a), '7') : t));
}

/** Dominante secundario delante de cada acorde (en la segunda mitad del compás anterior). */
export function dominantesSecundarios(compases: readonly string[]): string[] {
  return rellenar(compases, (a, sig) => {
    const v = mod(raiz(sig) + 7);
    // No hace falta si el acorde ya es ese dominante, es el mismo que el siguiente o el siguiente es disminuido.
    if (raiz(a) === raiz(sig) || esDisminuido(sig) || (esDominante(a) && raiz(a) === v)) return null;
    return [acorde(v, '7')];
  });
}

/** ii–V secundario delante de cada acorde: la segunda mitad del compás anterior pasa a IIm7 – V7 del siguiente. */
export function iiVSecundarios(compases: readonly string[]): string[] {
  return rellenar(compases, (a, sig) => {
    const s = raiz(sig);
    if (raiz(a) === s || esDisminuido(sig) || (esDominante(a) && raiz(a) === mod(s + 7))) return null;
    // Si el acorde ya es el ii del siguiente, basta con añadir el V.
    if (raiz(a) === mod(s + 2) && !esDominante(a)) return [acorde(s + 7, '7')];
    // Hacia un acorde menor, ii–V menor (IIø7 – V7). El compás queda X X ii V:
    // el acorde ocupa la primera mitad y el ii–V la segunda, a negras.
    const ii = acorde(s + 2, esMenor(sig) ? 'm7b5' : 'm7');
    return [a.texto, ii, acorde(s + 7, '7')];
  });
}

/** Sustitución tritonal: cada dominante que resuelve una quinta por debajo pasa al dominante a un tritono (V7 → bII7). */
export function sustitucionTritonal(compases: readonly string[]): string[] {
  return porAcorde(compases, (a, sig, t) => (esDominante(a) && !a.bajo && raiz(sig) === mod(raiz(a) + 5) ? acorde(raiz(a) + 6, '7') : t));
}

/** Disminuido de paso entre dos acordes a un tono de distancia (I → #I°7 → IIm7). */
export function disminuidosDePaso(compases: readonly string[]): string[] {
  return rellenar(compases, (a, sig) => (raiz(sig) === mod(raiz(a) + 2) ? [acorde(raiz(a) + 1, '°7')] : null));
}

export interface Tecnica {
  id: string;
  nombre: string;
  descripcion: string;
  aplicar: (compases: readonly string[]) => string[];
}

/** Técnicas en el orden en que se aplican al combinarlas. */
export const TECNICAS: Tecnica[] = [
  { id: 'diatonica', nombre: 'Sustitución diatónica', descripcion: 'Un acorde repetido se cambia por otro de su función: I → VIm7, IV → IIm7.', aplicar: sustitucionDiatonica },
  { id: 'modal', nombre: 'Intercambio modal', descripcion: 'IV → IVm7 y IIm7 → IIø7: la subdominante prestada del menor.', aplicar: intercambioModal },
  { id: 'cadena', nombre: 'Cadena de dominantes', descripcion: 'Los acordes que suben una cuarta se vuelven dominantes: IIIm7 VIm7 → III7 VI7.', aplicar: cadenaDominantes },
  { id: 'dominantes', nombre: 'Dominantes secundarios', descripcion: 'El dominante de cada acorde, en la segunda mitad del compás anterior.', aplicar: dominantesSecundarios },
  { id: 'ii-v', nombre: 'ii–V secundarios', descripcion: 'El ii–V de cada acorde, en la segunda mitad del compás anterior (en lugar del dominante solo).', aplicar: iiVSecundarios },
  { id: 'tritonal', nombre: 'Sustitución tritonal', descripcion: 'Cada dominante que resuelve pasa al dominante a un tritono: V7 → bII7.', aplicar: sustitucionTritonal },
  { id: 'disminuidos', nombre: 'Disminuidos de paso', descripcion: 'Un °7 entre dos acordes a un tono: I → #I°7 → IIm7.', aplicar: disminuidosDePaso },
];

/** Aplica las técnicas elegidas, en el orden de TECNICAS. */
export function rearmonizar(compases: readonly string[], ids: readonly string[]): string[] {
  return TECNICAS.filter((t) => ids.includes(t.id)).reduce<string[]>((c, t) => t.aplicar(c), [...compases]);
}
