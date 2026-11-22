// De un cifrado escrito (Cmaj7, F#m7b5, Bb7(b9,#11), Ebm6/Bb…) a sus grados y notas.
// Admite las grafías habituales (Δ, -, ø, °, +, alt, sus, add9, 6/9) y las tensiones
// con o sin paréntesis. Lo usan el buscador de escalas y el transpositor. Funciones
// puras, sin DOM.
import { formatNota, notaDeGrado, parseNota } from './teoria.ts';

export interface AcordeLeido {
  raiz: string;
  /** Bajo si es un acorde slash (Am7/G), si no null. */
  bajo: string | null;
  /** Lo que va tras la raíz, tal cual (sin el bajo). */
  calidad: string;
  /** Grados sobre la raíz, sin repetir, de la fórmula a las tensiones. */
  grados: string[];
  /** Notas de esos grados (y el bajo delante si no está en el acorde). */
  notas: string[];
}

/** Raíz, calidad y bajo de un símbolo; null si no empieza por una nota. */
export function partesCifrado(simbolo: string): { raiz: string; calidad: string; bajo: string | null } | null {
  const m = /^([A-G](?:bb|b|##|#|♭|♯)?)(.*?)(?:\/([A-G](?:b|#|♭|♯)?))?$/.exec(simbolo.trim());
  if (!m) return null;
  const nota = (x: string) => x.replace('♭', 'b').replace('♯', '#');
  // 6/9 lleva barra pero no es un bajo.
  if (m[3] === undefined && /\/9$/.test(m[2])) return { raiz: nota(m[1]), calidad: m[2], bajo: null };
  return { raiz: nota(m[1]), calidad: m[2], bajo: m[3] ? nota(m[3]) : null };
}

/**
 * Grados de una calidad: '' → 1 3 5; 'm7b5' → 1 b3 b5 b7; '13(#11)' → 1 3 5 b7 9 #11 13.
 * Null si queda algo que no se entiende.
 */
export function gradosDeCalidad(calidad: string): string[] | null {
  let q = calidad
    .replace(/[()\s,]/g, '')
    .replace(/♭/g, 'b')
    .replace(/♯/g, '#')
    .replace(/[Δ△^]/g, 'maj')
    .replace(/^(?:MA|Ma|M)(?=7|9|11|13|$)/, 'maj')
    .replace(/^ma(?=7|9|11|13)/, 'maj')
    .replace(/^(?:min|mi|-)/, 'm');

  let tercera: string | null = '3';
  let quinta: string | null = '5';
  let septima: string | null = null;
  const extra: string[] = [];
  const quitar = (re: RegExp) => {
    const m = re.exec(q);
    if (m) q = q.slice(0, m.index) + q.slice(m.index + m[0].length);
    return m;
  };

  // Familias que fijan 3, 5 y 7.
  if (quitar(/^(?:ø7?|m7b5)/)) [tercera, quinta, septima] = ['b3', 'b5', 'b7'];
  else if (quitar(/^(?:°|o|dim)7/)) [tercera, quinta, septima] = ['b3', 'b5', 'bb7'];
  else if (quitar(/^(?:°|o|dim)/)) [tercera, quinta] = ['b3', 'b5'];
  else if (quitar(/^(?:\+|aug)/)) quinta = '#5';
  else if (quitar(/^m(?=maj|M|Δ)/)) tercera = 'b3';
  else if (/^m(?!aj)/.test(q)) {
    quitar(/^m/);
    tercera = 'b3';
  }
  // Séptima y extensiones: maj7/maj9…, 7/9/11/13, 6, 6/9, 5 (power chord).
  const maj = quitar(/^(?:maj|Maj|MAJ|Ma|ma|M)(7|9|11|13)?/);
  const num = maj ? maj[1] ?? '7' : quitar(/^(13|11|9|7|69|6\/9|6|5)/)?.[1];
  if (num === '5') {
    tercera = null;
  } else if (num === '6') extra.push('6');
  else if (num === '69' || num === '6/9') extra.push('6', '9');
  else if (num) {
    if (!septima) septima = maj ? '7' : 'b7';
    if (num === '9' || num === '11' || num === '13') extra.push('9');
    // La 11 natural en un acorde mayor o dominante choca con la 3: solo en menores (y sus).
    if (num === '11' && tercera === 'b3') extra.push('11');
    if (num === '11' && tercera === '3') {
      tercera = null;
      extra.push('11');
    }
    if (num === '13') extra.push('13');
  }
  // Sus, add y alteraciones, en cualquier orden.
  for (let vueltas = 0; q && vueltas < 12; vueltas++) {
    let m: RegExpExecArray | null;
    if (quitar(/^sus4|^sus(?!2)/)) tercera = '4';
    else if (quitar(/^sus2/)) tercera = '2';
    else if (quitar(/^alt/)) {
      if (!septima) septima = 'b7';
      quinta = null;
      extra.push('b9', '#9', '#11', 'b13');
    } else if ((m = quitar(/^add(9|11|13|2|4)/))) extra.push(m[1]);
    else if ((m = quitar(/^(?:b5|-5)/))) quinta = 'b5';
    else if ((m = quitar(/^(?:#5|\+5|\+(?!\d))/))) quinta = '#5';
    else if ((m = quitar(/^(b9|#9|#11|\+11|b13|-9|\+9|-13)/))) extra.push(m[1].replace('+', '#').replace('-', 'b'));
    else if ((m = quitar(/^(9|11|13)/))) extra.push(m[1]);
    else if (quitar(/^maj7|^M7/)) septima = '7';
    else break;
  }
  if (q) return null;
  // Una tensión alterada sustituye a la natural: 13(b9) no lleva 9; 7(b13), tampoco 13.
  const fuera = new Set<string>();
  if (extra.includes('b9') || extra.includes('#9')) fuera.add('9');
  if (extra.includes('#11')) fuera.add('11');
  if (extra.includes('b13')) fuera.add('13');
  const grados = ['1', tercera, quinta, septima, ...extra.filter((g) => !fuera.has(g))].filter((g): g is string => !!g);
  return [...new Set(grados)];
}

/** Lee un cifrado completo; null si no es un acorde. */
export function leerCifrado(simbolo: string): AcordeLeido | null {
  const p = partesCifrado(simbolo);
  if (!p) return null;
  const grados = gradosDeCalidad(p.calidad);
  if (!grados) return null;
  try {
    const notas = grados.map((g) => formatNota(notaDeGrado(p.raiz, g)));
    if (p.bajo) {
      const b = formatNota(parseNota(p.bajo));
      if (!notas.includes(b)) notas.unshift(b);
    }
    return { raiz: formatNota(parseNota(p.raiz)), bajo: p.bajo, calidad: p.calidad, grados, notas };
  } catch {
    return null;
  }
}
