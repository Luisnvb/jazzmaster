// Tensiones y avoid notes: el papel de cada una de las 12 notas sobre un acorde,
// según el acorde y la escala que le corresponde. Funciones puras.
import { semitonosGrado } from './teoria.ts';

export type Rol = 'acorde' | 'tension' | 'alterada' | 'evitar' | 'fuera';

export const ROLES: { id: Rol; nombre: string; resumen: string }[] = [
  { id: 'acorde', nombre: 'Nota del acorde', resumen: 'Apoyo seguro.' },
  { id: 'tension', nombre: 'Tensión', resumen: 'De la escala y sin choque: suena apoyada y en el voicing.' },
  { id: 'alterada', nombre: 'Tensión alterada', resumen: 'Solo en dominantes: b9, #9, #11, b13. Más tensión antes de resolver.' },
  { id: 'evitar', nombre: 'Nota a evitar', resumen: 'De la escala, pero medio tono por encima de una nota del acorde: choca. De paso, sí; apoyada, no.' },
  { id: 'fuera', nombre: 'Fuera de la escala', resumen: 'Cromática: de paso o como aproximación, no para apoyarse.' },
];

export interface Contexto {
  id: string;
  /** Acorde en grados (como se escribe en una progresión): IIm7, V7alt… */
  nombre: string;
  /** Sufijo del cifrado (C + m7 → Cm7). */
  sufijo: string;
  /** Dónde aparece. */
  uso: string;
  acorde: string[];
  escala: { nombre: string; formula: string[] };
  /** Admite tensiones alteradas (b9, #9, #11, b13) aunque no estén en la escala. */
  dominante?: boolean;
  /** Notas con un papel distinto del que sale de la regla (semitonos → papel y explicación). */
  ajustes?: Record<number, { rol: Rol; nota: string }>;
}

const J = (nombre: string, formula: string[]) => ({ nombre, formula });

export const CONTEXTOS: Contexto[] = [
  {
    id: 'maj7-jonico',
    nombre: 'Imaj7',
    sufijo: 'maj7',
    uso: 'I de la tonalidad mayor',
    acorde: ['1', '3', '5', '7'],
    escala: J('Jónico', ['1', '2', '3', '4', '5', '6', '7']),
  },
  {
    id: 'maj7-lidio',
    nombre: 'IVmaj7',
    sufijo: 'maj7',
    uso: 'IV de la tonalidad mayor; también bVImaj7 y bIIImaj7 prestados',
    acorde: ['1', '3', '5', '7'],
    escala: J('Lidio', ['1', '2', '3', '#4', '5', '6', '7']),
  },
  {
    id: 'm7-dorico',
    nombre: 'IIm7',
    sufijo: 'm7',
    uso: 'II de la tonalidad mayor; Im7 del blues menor y del jazz modal',
    acorde: ['1', 'b3', '5', 'b7'],
    escala: J('Dórico', ['1', '2', 'b3', '4', '5', '6', 'b7']),
    ajustes: {
      9: {
        rol: 'tension',
        nota: 'Tensión característica del dórico. En el IIm7 de un ii–V algunos la evitan como nota larga: con la b3 forma un tritono y suena al V7 que viene.',
      },
    },
  },
  {
    id: 'm7-frigio',
    nombre: 'IIIm7',
    sufijo: 'm7',
    uso: 'III de la tonalidad mayor',
    acorde: ['1', 'b3', '5', 'b7'],
    escala: J('Frigio', ['1', 'b2', 'b3', '4', '5', 'b6', 'b7']),
  },
  {
    id: 'm7-eolico',
    nombre: 'VIm7',
    sufijo: 'm7',
    uso: 'VI de la tonalidad mayor; Im7 del menor natural',
    acorde: ['1', 'b3', '5', 'b7'],
    escala: J('Eólico', ['1', '2', 'b3', '4', '5', 'b6', 'b7']),
  },
  {
    id: 'mmaj7-melodica',
    nombre: 'ImMaj7',
    sufijo: 'mMaj7',
    uso: 'Tónica menor con la 7 mayor (Im6 y ImMaj7)',
    acorde: ['1', 'b3', '5', '7'],
    escala: J('Menor melódica', ['1', '2', 'b3', '4', '5', '6', '7']),
  },
  {
    id: 'dom-mixolidio',
    nombre: 'V7',
    sufijo: '7',
    uso: 'V de la tonalidad mayor; I7, IV7 del blues',
    acorde: ['1', '3', '5', 'b7'],
    escala: J('Mixolidio', ['1', '2', '3', '4', '5', '6', 'b7']),
    dominante: true,
  },
  {
    id: 'dom-lidio',
    nombre: 'bVII7',
    sufijo: '7',
    uso: 'Dominantes que no resuelven por quintas: bVII7, IV7, subV7 (bII7)',
    acorde: ['1', '3', '5', 'b7'],
    escala: J('Lidio dominante', ['1', '2', '3', '#4', '5', '6', 'b7']),
    dominante: true,
  },
  {
    id: 'dom-alterado',
    nombre: 'V7alt',
    sufijo: '7alt',
    uso: 'V7 que va a un acorde menor (V7/II, V7/VI, V7 del menor), o cuando se busca la máxima tensión',
    acorde: ['1', '3', 'b7'],
    escala: J('Superlocrio (alterada)', ['1', 'b2', '#2', '3', 'b5', '#5', 'b7']),
    dominante: true,
  },
  {
    id: 'sus',
    nombre: 'V7sus4',
    sufijo: '7sus4',
    uso: 'Dominante suspendido: jazz modal, IIm7/V',
    acorde: ['1', '4', '5', 'b7'],
    escala: J('Mixolidio', ['1', '2', '3', '4', '5', '6', 'b7']),
    ajustes: {
      4: {
        rol: 'evitar',
        nota: 'La 3 choca con la 4, que hace su papel: medio tono por debajo. Si suena apoyada, el acorde deja de ser sus (es la resolución de la 4).',
      },
      1: {
        rol: 'alterada',
        nota: 'b9: da el sonido frigio del sus(b9) (como en Maiden Voyage o el frigio de McCoy Tyner).',
      },
    },
  },
  {
    id: 'm7b5-locrio2',
    nombre: 'IIø7',
    sufijo: 'm7b5',
    uso: 'II del menor; VIIø7 de la tonalidad mayor',
    acorde: ['1', 'b3', 'b5', 'b7'],
    escala: J('Locrio #2', ['1', '2', 'b3', '4', 'b5', 'b6', 'b7']),
    ajustes: {
      1: {
        rol: 'evitar',
        nota: 'b9: es la del locrio (el VIIø7 de la escala mayor), y ahí es la nota a evitar: medio tono por encima de la raíz. Con el locrio #2 se cambia por la 9.',
      },
    },
  },
  {
    id: 'dim7',
    nombre: 'VII°7',
    sufijo: '°7',
    uso: 'Disminuido de paso (#I°7, #IV°7) y VII°7 del menor',
    acorde: ['1', 'b3', 'b5', 'bb7'],
    escala: J('Disminuida (T–S)', ['1', '2', 'b3', '4', 'b5', '#5', '6', '7']),
  },
];

/** Tensiones alteradas del dominante (semitonos): b9, #9, #11, b13. */
const ALTERADAS = new Set([1, 3, 6, 8]);

/** Nombre de cada semitono sobre la raíz cuando no es nota del acorde. */
const NOMBRES = ['1', 'b9', '9', '#9', '3', '11', '#11', '5', 'b13', '13', 'b7', '7'];

export interface NotaSobreAcorde {
  /** Semitonos sobre la raíz (0–11). */
  semitonos: number;
  /** Grado: el del acorde si es nota del acorde, si no, la tensión (b9, 11, b13…). */
  grado: string;
  rol: Rol;
  nota: string;
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Grado de un semitono en un acorde (b3 y b5 en los menores; 3 "mayor" sobre ellos). */
function nombre(c: Contexto, s: number): string {
  const delAcorde = c.acorde.find((g) => mod12(semitonosGrado(g)) === s);
  if (delAcorde) return delAcorde;
  const menor = c.acorde.includes('b3');
  if (menor && s === 6) return 'b5';
  return NOMBRES[s];
}

/** Las 12 notas sobre el acorde (desde la raíz), con su papel y por qué. */
export function notasSobre(c: Contexto): NotaSobreAcorde[] {
  const acorde = new Map(c.acorde.map((g) => [mod12(semitonosGrado(g)), g]));
  const escala = new Set(c.escala.formula.map((g) => mod12(semitonosGrado(g))));
  return Array.from({ length: 12 }, (_, s) => {
    const grado = nombre(c, s);
    const debajo = acorde.get(mod12(s - 1)); // nota del acorde medio tono por debajo
    const encima = acorde.get(mod12(s + 1)); // nota del acorde medio tono por encima
    const res = (rol: Rol, nota: string): NotaSobreAcorde => ({ semitonos: s, grado, rol, nota });
    if (acorde.has(s)) return res('acorde', s === 0 ? 'La raíz.' : `Nota del acorde (${grado}): apoyo seguro.`);
    const ajuste = c.ajustes?.[s];
    if (ajuste) return res(ajuste.rol, ajuste.nota);
    if (c.dominante && ALTERADAS.has(s)) {
      return res(
        'alterada',
        `Tensión alterada (${grado}): más tensión antes de resolver. ${escala.has(s) ? `Está en la escala (${c.escala.nombre}).` : `No está en la escala ${c.escala.nombre}: pide la alterada, la disminuida o la mixolidia b9 b13.`}`,
      );
    }
    if (escala.has(s)) {
      if (debajo) return res('evitar', `Medio tono por encima de la ${debajo} del acorde: choca con ella (intervalo de b9). De paso, sí; apoyada o en el voicing, no.`);
      return res('tension', `Tensión disponible (${grado}): está en la escala (${c.escala.nombre}) y no choca con ninguna nota del acorde.`);
    }
    const choque = debajo
      ? `medio tono por encima de la ${debajo} del acorde`
      : encima
        ? `medio tono por debajo de la ${encima} del acorde (buena aproximación cromática hacia ella)`
        : '';
    return res('fuera', `No está en la escala (${c.escala.nombre})${choque ? `: ${choque}` : ''}. Cromática: de paso, no apoyada.`);
  });
}

/** Tensiones disponibles (sin las notas del acorde), para resumir: "9, 11, 13". */
export const tensiones = (c: Contexto, roles: readonly Rol[] = ['tension', 'alterada']) =>
  notasSobre(c)
    .filter((n) => roles.includes(n.rol))
    .map((n) => n.grado);
