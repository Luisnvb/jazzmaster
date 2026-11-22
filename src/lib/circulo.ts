// Círculo de quintas (Herramientas): las 12 tonalidades mayores y sus relativas menores
// por quintas, con su armadura, sus acordes diatónicos, los dominantes secundarios y las
// tonalidades vecinas. El dibujo es SVG como texto. Funciones puras, sin DOM.
import { parseAcordeGrado, simboloEn } from './progresiones.ts';
import { formatNota, notaDeGrado, notasDeFormula } from './teoria.ts';

export type Modo = 'mayor' | 'menor';

export interface Tonalidad {
  mayor: string;
  menor: string;
  /** Alteraciones de la armadura: positivas = sostenidos, negativas = bemoles. */
  alteraciones: number;
  /** La misma tonalidad escrita de la otra forma (F# / Gb), si se usa. */
  enarmonica?: { mayor: string; menor: string; alteraciones: number };
}

const relativa = (mayor: string) => formatNota(notaDeGrado(mayor, '6'));
const tonalidad = (mayor: string, alteraciones: number, otra?: [string, number]): Tonalidad => ({
  mayor,
  menor: relativa(mayor),
  alteraciones,
  ...(otra ? { enarmonica: { mayor: otra[0], menor: relativa(otra[0]), alteraciones: otra[1] } } : {}),
});

/** Por quintas desde C, en el sentido de las agujas del reloj. */
export const CIRCULO: Tonalidad[] = [
  tonalidad('C', 0),
  tonalidad('G', 1),
  tonalidad('D', 2),
  tonalidad('A', 3),
  tonalidad('E', 4),
  tonalidad('B', 5, ['Cb', -7]),
  tonalidad('F#', 6, ['Gb', -6]),
  tonalidad('Db', -5, ['C#', 7]),
  tonalidad('Ab', -4),
  tonalidad('Eb', -3),
  tonalidad('Bb', -2),
  tonalidad('F', -1),
];

const ORDEN_SOSTENIDOS = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'];
const ORDEN_BEMOLES = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];

/** Notas alteradas de la armadura, en el orden en que se escriben. */
export const armadura = (alteraciones: number): string[] =>
  alteraciones >= 0 ? ORDEN_SOSTENIDOS.slice(0, alteraciones) : ORDEN_BEMOLES.slice(0, -alteraciones);

/** Nombre de un modo en un idioma. */
export const nombreModo = (modo: Modo, idioma: 'es' | 'en' = 'es') => (idioma === 'en' ? (modo === 'mayor' ? 'major' : 'minor') : modo);

/** «2♯», «3♭» o «sin alteraciones» («no sharps or flats»). */
export const textoArmadura = (alteraciones: number, idioma: 'es' | 'en' = 'es') =>
  alteraciones === 0 ? (idioma === 'en' ? 'no sharps or flats' : 'sin alteraciones') : `${Math.abs(alteraciones)}${alteraciones > 0 ? '♯' : '♭'}`;

/** Tónica de la tonalidad en un modo. */
export const tonicaDe = (t: Tonalidad, modo: Modo) => (modo === 'mayor' ? t.mayor : t.menor);

/** Nombre: «D mayor», «Bm» → «B menor». */
export const nombreTonalidad = (t: Tonalidad, modo: Modo, idioma: 'es' | 'en' = 'es') => `${tonicaDe(t, modo)} ${nombreModo(modo, idioma)}`;

const ESCALAS: Record<Modo, string[]> = {
  mayor: ['1', '2', '3', '4', '5', '6', '7'],
  menor: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
};

export const escala = (t: Tonalidad, modo: Modo) => notasDeFormula(tonicaDe(t, modo), ESCALAS[modo]);

/** Acordes de cuatro notas de la tonalidad (en menor, la V7 de la menor armónica). */
const DIATONICOS: Record<Modo, string[]> = {
  mayor: ['Imaj7', 'IIm7', 'IIIm7', 'IVmaj7', 'V7', 'VIm7', 'VIIm7b5'],
  menor: ['Im7', 'IIm7b5', 'bIIImaj7', 'IVm7', 'V7', 'bVImaj7', 'bVII7'],
};

/** Dominantes secundarios: el V7 de cada grado (en mayor) o de los habituales (en menor). */
const SECUNDARIOS: Record<Modo, { grado: string; destino: string }[]> = {
  mayor: [
    { grado: 'VI7', destino: 'IIm7' },
    { grado: 'VII7', destino: 'IIIm7' },
    { grado: 'I7', destino: 'IVmaj7' },
    { grado: 'II7', destino: 'V7' },
    { grado: 'III7', destino: 'VIm7' },
  ],
  menor: [
    { grado: 'I7', destino: 'IVm7' },
    { grado: 'bVII7', destino: 'bIIImaj7' },
    { grado: 'bIII7', destino: 'bVImaj7' },
    { grado: 'II7', destino: 'V7' },
  ],
};

export interface AcordeTonalidad {
  grado: string;
  simbolo: string;
}

const acorde = (tonica: string, grado: string): AcordeTonalidad => ({ grado, simbolo: simboloEn(tonica, parseAcordeGrado(grado)) });

export const diatonicos = (t: Tonalidad, modo: Modo): AcordeTonalidad[] => DIATONICOS[modo].map((g) => acorde(tonicaDe(t, modo), g));

export const secundarios = (t: Tonalidad, modo: Modo): { acorde: AcordeTonalidad; destino: AcordeTonalidad }[] =>
  SECUNDARIOS[modo].map((s) => ({ acorde: acorde(tonicaDe(t, modo), s.grado), destino: acorde(tonicaDe(t, modo), s.destino) }));

/** El II–V–I de la tonalidad, en grados (para oírlo con secuenciaProgresion). */
export const CADENCIA: Record<Modo, string[]> = { mayor: ['IIm7', 'V7', 'Imaj7', 'Imaj7'], menor: ['IIm7b5', 'V7b9', 'Im7', 'Im7'] };

/** Sustituto por tritono del V7: bII7. */
export const sustitutoTritonal = (t: Tonalidad, modo: Modo) => acorde(tonicaDe(t, modo), 'bII7');

/**
 * Tonalidades vecinas (una alteración de diferencia): la de la subdominante (un paso
 * a la izquierda en el círculo) y la de la dominante (uno a la derecha).
 */
export const vecinas = (indice: number) => ({
  subdominante: CIRCULO[(indice + 11) % 12],
  dominante: CIRCULO[(indice + 1) % 12],
});

/** Índice en el círculo de una tónica escrita (mayor o menor, enarmónicas incluidas). */
export function indiceDe(tonica: string, modo: Modo): number {
  return CIRCULO.findIndex((t) => tonicaDe(t, modo) === tonica || (t.enarmonica && (modo === 'mayor' ? t.enarmonica.mayor : t.enarmonica.menor) === tonica));
}

// --- Dibujo ------------------------------------------------------------------------

const C = 200;
const R_FUERA = 192;
const R_MEDIO = 132;
const R_DENTRO = 82;
const R_ARMADURA = 62;

const punto = (r: number, angulo: number) => {
  const a = ((angulo - 90) * Math.PI) / 180;
  return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
};

/** Sector de corona entre dos radios, centrado en el ángulo de la tonalidad `i`. */
function sector(i: number, r1: number, r2: number): string {
  const a1 = i * 30 - 15;
  const a2 = i * 30 + 15;
  return `M ${punto(r2, a1)} A ${r2} ${r2} 0 0 1 ${punto(r2, a2)} L ${punto(r1, a2)} A ${r1} ${r1} 0 0 0 ${punto(r1, a1)} Z`;
}

const bonito = (n: string) => n.replace('#', '♯').replace(/b$/, '♭');

/**
 * El círculo: fuera las mayores, dentro las relativas menores y en el centro la
 * armadura. `seleccion` (índice y modo) se resalta; sus vecinas, más suave. Cada
 * sector lleva data-indice y data-modo para pulsarlo.
 */
export function circuloSVG(seleccion: { indice: number; modo: Modo }, idioma: 'es' | 'en' = 'es'): string {
  const o = idioma === 'en' ? 'or' : 'o';
  const partes: string[] = [];
  const cerca = (i: number) => (i - seleccion.indice + 12) % 12;
  CIRCULO.forEach((t, i) => {
    for (const modo of ['mayor', 'menor'] as const) {
      const elegido = i === seleccion.indice && modo === seleccion.modo;
      const vecino = !elegido && [0, 1, 11].includes(cerca(i));
      const clase = `sector ${modo}${elegido ? ' elegido' : vecino ? ' vecino' : ''}`;
      const [r1, r2] = modo === 'mayor' ? [R_MEDIO, R_FUERA] : [R_DENTRO, R_MEDIO];
      const nombre = modo === 'mayor' ? t.mayor : `${t.menor}m`;
      const otra = t.enarmonica ? (modo === 'mayor' ? t.enarmonica.mayor : `${t.enarmonica.menor}m`) : '';
      const m = nombreModo(modo, idioma);
      const etiqueta = `${tonicaDe(t, modo)} ${m}${t.enarmonica ? ` (${o} ${t.enarmonica[modo]} ${m})` : ''}, ${textoArmadura(t.alteraciones, idioma)}`;
      const centro = (r1 + r2) / 2;
      const [x, y] = punto(centro, i * 30).split(' ');
      partes.push(
        `<g class="${clase}" data-indice="${i}" data-modo="${modo}" role="button" tabindex="0" aria-label="${etiqueta}" aria-pressed="${elegido}">` +
          `<path d="${sector(i, r1, r2)}"/>` +
          (otra
            ? `<text x="${x}" y="${Number(y) - 8}" text-anchor="middle" dominant-baseline="central">${bonito(nombre)}</text><text class="enarmonica" x="${x}" y="${Number(y) + 10}" text-anchor="middle" dominant-baseline="central">${bonito(otra)}</text>`
            : `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${bonito(nombre)}</text>`) +
          `</g>`,
      );
    }
    const [x, y] = punto(R_ARMADURA, i * 30).split(' ');
    partes.push(`<text class="armadura" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${t.alteraciones === 0 ? '0' : textoArmadura(t.alteraciones)}</text>`);
  });
  return `<svg class="circulo" viewBox="0 0 ${C * 2} ${C * 2}" xmlns="http://www.w3.org/2000/svg" aria-label="${idioma === 'en' ? 'Circle of fifths' : 'Círculo de quintas'}">${partes.join('')}</svg>`;
}
