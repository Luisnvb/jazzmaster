// Acordes slash y estructuras superiores: una tríada sobre un bajo (D/C) o sobre
// un acorde base (D sobre C7). Da el cifrado resultante, los grados sobre el bajo
// y el audio. Funciones puras, sin DOM.
import { ligarRepetidos, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, parseNota, pitchClass, semitonosGrado, type Nota } from './teoria.ts';

export type TipoTriada = 'mayor' | 'menor' | 'dis' | 'aum' | 'sus4';

export const TRIADAS: { id: TipoTriada; nombre: string; sufijo: string; formula: string[] }[] = [
  { id: 'mayor', nombre: 'Mayor', sufijo: '', formula: ['1', '3', '5'] },
  { id: 'menor', nombre: 'Menor', sufijo: 'm', formula: ['1', 'b3', '5'] },
  { id: 'dis', nombre: 'Disminuida', sufijo: '°', formula: ['1', 'b3', 'b5'] },
  { id: 'aum', nombre: 'Aumentada', sufijo: '+', formula: ['1', '3', '#5'] },
  { id: 'sus4', nombre: 'Sus4', sufijo: 'sus4', formula: ['1', '4', '5'] },
];

/** Raíz de la tríada como intervalo sobre el bajo. */
export const INTERVALOS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

export type IdBase = 'bajo' | 'dom' | 'maj' | 'men';

/** Debajo de la tríada: solo el bajo, o un acorde base (raíz, 3 y 7: el «shell»). */
export const BASES: { id: IdBase; nombre: string; sufijo: string; grados: string[] }[] = [
  { id: 'bajo', nombre: 'Solo el bajo', sufijo: '', grados: ['1'] },
  { id: 'dom', nombre: 'Sobre un dominante', sufijo: '7', grados: ['1', '3', 'b7'] },
  { id: 'maj', nombre: 'Sobre un maj7', sufijo: 'maj7', grados: ['1', '3', '7'] },
  { id: 'men', nombre: 'Sobre un m7', sufijo: 'm7', grados: ['1', 'b3', 'b7'] },
];

const mod = (n: number) => ((n % 12) + 12) % 12;
const NATURALES: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };

/** Nota con la grafía con que se piensa: sin dobles alteraciones ni Fb, Cb, E#, B#. */
function sencilla(n: Nota): Nota {
  const pc = pitchClass(n);
  const rara = Math.abs(n.alteracion) > 1 || (n.alteracion !== 0 && NATURALES[pc] !== undefined);
  return rara ? parseNota(NATURALES[pc] ?? formatNota({ letra: n.letra, alteracion: n.alteracion > 0 ? 1 : -1 })) : n;
}

/** Raíz de la tríada: ('C', 'b5') → Gb; ('F', 'b5') → B (no Cb). */
export const raizTriada = (bajo: string, intervalo: string) => sencilla(notaDeGrado(bajo, intervalo));

export const nombreTriada = (bajo: string, intervalo: string, tipo: TipoTriada) =>
  formatNota(raizTriada(bajo, intervalo)) + TRIADAS.find((t) => t.id === tipo)!.sufijo;

/** Notas de la tríada, deletreadas desde su raíz. */
export function notasTriada(bajo: string, intervalo: string, tipo: TipoTriada): string[] {
  const r = raizTriada(bajo, intervalo);
  return TRIADAS.find((t) => t.id === tipo)!.formula.map((g) => formatNota(notaDeGrado(r, g)));
}

/** Semitonos de las notas de la tríada sobre el bajo. */
export function semitonosTriada(intervalo: string, tipo: TipoTriada): number[] {
  return TRIADAS.find((t) => t.id === tipo)!.formula.map((g) => mod(semitonosGrado(intervalo) + semitonosGrado(g)));
}

export interface Analisis {
  /** Cifrado como acorde: 'C13(#11)', 'C9sus4', 'Cmaj7#5'… */
  simbolo: string;
  /** Grado de cada semitono presente sobre el bajo, de grave a agudo dentro de la octava. */
  grados: { st: number; grado: string }[];
  /** Si falta la 3ª (y no es sus). */
  sinTercera: boolean;
}

/**
 * Pone nombre a un conjunto de notas sobre un bajo (semitonos 0–11, el 0 incluido).
 * La 3ª decide mayor o menor (con 3 y b3 a la vez, la b3 es #9); la 7ª, el tipo; las
 * tensiones naturales suben el número (9, 11, 13) y las alteradas van entre paréntesis.
 */
export function nombrarAcorde(bajo: string, semitonos: Iterable<number>): Analisis {
  const s = new Set([0, ...[...semitonos].map(mod)]);
  const h = (n: number) => s.has(n);
  const tercera = h(4) ? '3' : h(3) ? 'b3' : null;
  // Sus4 si hay 4 y no 3; sus2 solo con 5 y sin 7 (con 7, la 2 es la 9 de un acorde sin 3ª).
  const sus = tercera ? null : h(5) ? 'sus4' : h(2) && h(7) && !h(10) && !h(11) ? 'sus2' : null;
  const dis = tercera === 'b3' && h(6) && h(9) && !h(10) && !h(11) && !h(7);
  const septima = h(11) ? '7' : h(10) ? 'b7' : dis ? 'bb7' : null;
  const grado: Record<number, string> = {};
  grado[0] = '1';
  if (h(4)) grado[4] = '3';
  if (h(3)) grado[3] = h(4) ? '#9' : 'b3';
  if (h(7)) grado[7] = '5';
  if (h(11)) grado[11] = '7';
  if (h(10)) grado[10] = 'b7';
  if (h(1)) grado[1] = 'b9';
  if (h(2)) grado[2] = sus === 'sus2' ? '2' : '9';
  if (h(5)) grado[5] = sus === 'sus4' ? '4' : '11';
  // 6 semitonos: b5 si hace de quinta (sin 5 justa, en un menor o en un mayor sin 7ª); si no, #11.
  if (h(6)) grado[6] = !h(7) && (tercera === 'b3' || (tercera === '3' && !septima)) ? 'b5' : '#11';
  // 8 semitonos: b13 en un dominante (3 y b7) o con 5 justa; #5 en un mayor sin 5; b6 en un menor sin 7.
  if (h(8))
    grado[8] = h(7) || (tercera === '3' && septima === 'b7') ? 'b13' : tercera === '3' ? '#5' : tercera === 'b3' && !septima ? 'b6' : 'b13';
  if (h(9)) grado[9] = dis ? 'bb7' : septima ? '13' : '6';

  let simbolo: string;
  const alteradas = ['b9', '#9', '#11', 'b13'].filter((g) => Object.values(grado).includes(g));
  if (dis) {
    simbolo = '°7';
  } else {
    const menor = tercera === 'b3';
    const b5 = grado[6] === 'b5';
    const aum = grado[8] === '#5';
    if (septima === '7' || septima === 'b7') {
      // El número más alto de las tensiones naturales: 13 > 11 > 9 > 7.
      const nat = h(9) ? '13' : grado[5] === '11' && menor ? '11' : h(2) ? '9' : '7';
      const base = menor ? (septima === '7' ? 'mMaj' : 'm') : septima === '7' ? 'maj' : '';
      simbolo = `${base}${nat}${aum ? '#5' : ''}${sus ?? ''}`;
      // Menor con b5: m7b5 (semidisminuido); con tensiones, la b5 va entre paréntesis.
      if (menor && b5 && septima === 'b7') simbolo = nat === '7' ? 'm7b5' : `m${nat}`;
    } else {
      // Sin 7ª: 6, 6/9, add9…
      const seis = h(9) ? (h(2) ? '6/9' : '6') : h(2) && tercera ? 'add9' : '';
      simbolo = `${menor ? 'm' : ''}${aum ? '+' : ''}${b5 ? 'b5' : ''}${seis}${sus ?? ''}`;
      if (simbolo === 'mb5') simbolo = '°';
    }
    const extra = [...alteradas];
    if (menor && b5 && septima === 'b7' && simbolo !== 'm7b5') extra.unshift('b5');
    // La 11 natural sobre una 3 mayor no se sube al número: va entre paréntesis.
    if (grado[5] === '11' && !menor) extra.push('11');
    // La b6 de un menor sin 7ª (C, Eb y Ab: suele ser Ab/C) no se calla.
    if (grado[8] === 'b6') extra.push('b6');
    if (extra.length) simbolo += `(${extra.join(',')})`;
  }
  const grados = [...s].sort((a, b) => a - b).map((st) => ({ st, grado: grado[st] }));
  return { simbolo: formatNota(parseNota(bajo)) + simbolo, grados, sinTercera: !tercera && !sus };
}

export interface Combinacion {
  bajo: string;
  base: IdBase;
  intervalo: string;
  tipo: TipoTriada;
}

export interface Resultado {
  /** Cómo se escribe la combinación: 'D/C' o 'D sobre C7'. */
  escrito: string;
  /** El acorde que suena (o la inversión, si el bajo está en la tríada). */
  analisis: Analisis;
  /** Si el bajo es una nota de la tríada: es una inversión, no un acorde nuevo. */
  inversion: boolean;
  triada: string;
  notasTriada: string[];
  /** Grados (sobre el bajo) que pone la tríada y los que pone la base. */
  deTriada: string[];
  deBase: string[];
}

export function combinar(c: Combinacion): Resultado {
  const base = BASES.find((b) => b.id === c.base)!;
  const st = semitonosTriada(c.intervalo, c.tipo);
  const stBase = base.grados.map((g) => mod(semitonosGrado(g)));
  const analisis = nombrarAcorde(c.bajo, [...stBase, ...st]);
  const triada = nombreTriada(c.bajo, c.intervalo, c.tipo);
  const bajoNombre = formatNota(parseNota(c.bajo));
  // Si el bajo es nota de la tríada, es una inversión (o la tríada sin más, si es su raíz).
  const inversion = c.base === 'bajo' && st.includes(0);
  if (c.base === 'bajo' && c.intervalo === '1') {
    return { escrito: triada, analisis: { ...analisis, simbolo: triada }, inversion: false, triada, notasTriada: notasTriada(c.bajo, c.intervalo, c.tipo), deTriada: [], deBase: [] };
  }
  const gradoDe = (x: number) => analisis.grados.find((g) => g.st === x)!.grado;
  return {
    escrito: c.base === 'bajo' ? `${triada}/${bajoNombre}` : `${triada} sobre ${bajoNombre}${base.sufijo}`,
    analisis: inversion ? { ...analisis, simbolo: `${triada}/${bajoNombre}` } : analisis,
    inversion,
    triada,
    notasTriada: notasTriada(c.bajo, c.intervalo, c.tipo),
    deTriada: st.map(gradoDe),
    deBase: stBase.map(gradoDe),
  };
}

/** Combinaciones útiles de cada base, con su sonido (sobre C en los textos). */
export const UTILES: Record<IdBase, { intervalo: string; tipo: TipoTriada; sonido: string }[]> = {
  bajo: [
    { intervalo: '2', tipo: 'mayor', sonido: 'Mayor un tono arriba: lidio, sin 3ª. Muy abierto, el final de muchas baladas.' },
    { intervalo: 'b7', tipo: 'mayor', sonido: 'Mayor un tono abajo: 9sus4, el sonido del sus moderno (Herbie Hancock).' },
    { intervalo: 'b2', tipo: 'mayor', sonido: 'Mayor medio tono arriba: frigio. Oscuro y español; sobre un dominante, suena a sus(b9).' },
    { intervalo: '3', tipo: 'mayor', sonido: 'Mayor una 3ª arriba: maj7#5, el sonido del lidio aumentado.' },
    { intervalo: '5', tipo: 'menor', sonido: 'Menor una 5ª arriba: 9 sin 3ª. Un dominante suspendido más suave que el sus4.' },
    { intervalo: 'b3', tipo: 'mayor', sonido: 'Mayor una 3ª menor arriba: el m7 escrito como tríada sobre el bajo.' },
  ],
  dom: [
    { intervalo: '2', tipo: 'mayor', sonido: 'II mayor: 9, #11 y 13. Lidio dominante, sin resolver (IV7, bVII7).' },
    { intervalo: '6', tipo: 'mayor', sonido: 'VI mayor: 13 y b9. Escala disminuida (semitono-tono).' },
    { intervalo: 'b5', tipo: 'mayor', sonido: 'bV mayor: b9 y #11. También disminuida; el tritono del acorde.' },
    { intervalo: 'b6', tipo: 'mayor', sonido: 'bVI mayor: #9 y b13. El sonido alterado más usado.' },
    { intervalo: 'b3', tipo: 'mayor', sonido: 'bIII mayor: #9 con la 5 y la b7. El sonido del blues.' },
    { intervalo: 'b2', tipo: 'menor', sonido: 'bII menor: b9 y b13 con la 3. Dominante hacia un menor.' },
  ],
  maj: [
    { intervalo: '5', tipo: 'mayor', sonido: 'V mayor: maj9, sin la raíz en la tríada.' },
    { intervalo: '2', tipo: 'mayor', sonido: 'II mayor: maj13(#11). El lidio completo.' },
    { intervalo: '7', tipo: 'menor', sonido: 'VII menor: maj9(#11). Lidio sin la 13.' },
    { intervalo: '3', tipo: 'menor', sonido: 'III menor: el acorde sin raíz (3, 5, 7).' },
  ],
  men: [
    { intervalo: '4', tipo: 'mayor', sonido: 'IV mayor: m13. El sonido dórico (la 13 es la 6 mayor).' },
    { intervalo: 'b7', tipo: 'mayor', sonido: 'bVII mayor: m11 (b7, 9 y 11).' },
    { intervalo: '2', tipo: 'menor', sonido: 'II menor: m13 (9, 11, 13), muy abierto.' },
    { intervalo: 'b3', tipo: 'mayor', sonido: 'bIII mayor: el acorde sin raíz (b3, 5, b7).' },
  ],
};

/**
 * Audio: el bajo (E2–D#3), la base por encima (3 y 7 en la octava siguiente) y la
 * tríada arriba, cerrada desde G4 aprox. `modo`: 'base' (sin la tríada), 'todo'
 * (en bloque) o 'arpegio' (de grave a agudo y el acorde entero al final).
 */
export function secuenciaSlash(c: Combinacion, bpm: number, modo: 'base' | 'todo' | 'arpegio', sostenido = false): { eventos: Evento[]; duracion: number } {
  const pulso = 60 / bpm;
  const pc = pitchClass(parseNota(c.bajo));
  const bajo = 40 + mod(pc - 4);
  const base = BASES.find((b) => b.id === c.base)!;
  const medios = base.grados.slice(1).map((g) => 52 + mod(pc + semitonosGrado(g) - 4));
  const st = semitonosTriada(c.intervalo, c.tipo);
  const raiz = 55 + mod(pc + st[0] - 7);
  const triada = st.map((x) => raiz + mod(x - st[0]));
  const notas = modo === 'base' ? [bajo, ...medios] : [bajo, ...medios, ...triada];
  const eventos: Evento[] = [];
  if (modo === 'arpegio') {
    const paso = pulso / 2;
    notas.forEach((m, i) => eventos.push({ midi: m, inicio: i * paso, duracion: (notas.length - i) * paso + 4 * pulso }));
    const duracion = notas.length * paso + 4 * pulso;
    return { eventos, duracion };
  }
  const duracion = 4 * pulso;
  notas.forEach((m, i) => eventos.push({ midi: m, inicio: sostenido ? 0 : i * 0.015, duracion: duracion * (sostenido ? 1 : 0.95) }));
  return { eventos: sostenido ? ligarRepetidos(eventos) : eventos, duracion };
}
