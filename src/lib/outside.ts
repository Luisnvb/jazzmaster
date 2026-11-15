// Fuera y dentro (outside): una frase sobre un vamp de un acorde, tocada dentro y
// con un compás desplazado (medio tono, tritono o en escalera) que vuelve a la
// tonalidad. Funciones puras, sin DOM.
import { ligarRepetidos, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

export interface AcordeOut {
  id: string;
  simbolo: string;
  nombre: string;
  /** Escala del acorde: las notas «dentro». */
  escala: string[];
  /** Notas del acorde (fondo y nota final). */
  acorde: string[];
  /** Células de un compás (8 corcheas), como grados del acorde. */
  celulas: Record<string, string[]>;
}

export const CELULAS: { id: string; nombre: string }[] = [
  { id: 'pentatonica', nombre: 'Pentatónica' },
  { id: 'arpegio', nombre: 'Arpegio' },
  { id: 'escala', nombre: 'Escala' },
];

export const ACORDES_OUT: AcordeOut[] = [
  {
    id: 'm7',
    simbolo: 'm7',
    nombre: 'Menor (dórico)',
    escala: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    acorde: ['1', 'b3', '5', 'b7'],
    celulas: {
      pentatonica: ['1', 'b3', '4', '5', 'b7', '5', '4', 'b3'],
      arpegio: ['1', 'b3', '5', 'b7', '9', 'b7', '5', 'b3'],
      escala: ['5', '4', 'b3', '2', '1', '2', 'b3', '4'],
    },
  },
  {
    id: '7',
    simbolo: '7',
    nombre: 'Dominante (mixolidio)',
    escala: ['1', '2', '3', '4', '5', '6', 'b7'],
    acorde: ['1', '3', '5', 'b7'],
    celulas: {
      pentatonica: ['1', '2', '3', '5', '6', '5', '3', '2'],
      arpegio: ['1', '3', '5', 'b7', '9', 'b7', '5', '3'],
      escala: ['5', '4', '3', '2', '1', '2', '3', '4'],
    },
  },
  {
    id: 'maj7',
    simbolo: 'maj7',
    nombre: 'Mayor (jónico)',
    escala: ['1', '2', '3', '4', '5', '6', '7'],
    acorde: ['1', '3', '5', '7'],
    celulas: {
      pentatonica: ['1', '2', '3', '5', '6', '5', '3', '2'],
      arpegio: ['1', '3', '5', '7', '9', '7', '5', '3'],
      escala: ['5', '4', '3', '2', '1', '2', '3', '4'],
    },
  },
];

export interface Tecnica {
  id: string;
  nombre: string;
  descripcion: string;
  /** Semitonos que se desplaza cada medio compás del compás de fuera. */
  desplazamientos: [number, number];
  /** Si el compás de fuera repite la primera mitad de la célula (escalera) en vez de tocarla entera. */
  escalera?: boolean;
}

export const TECNICAS: Tecnica[] = [
  {
    id: 'arriba',
    nombre: 'Medio tono arriba',
    descripcion: 'La misma frase medio tono más alta (side-slipping): sobre Dm7 piensas en Ebm7. Casi todas las notas quedan fuera, y al volver se resuelve bajando medio tono.',
    desplazamientos: [1, 1],
  },
  {
    id: 'abajo',
    nombre: 'Medio tono abajo',
    descripcion: 'La misma frase medio tono más baja: sobre Dm7 piensas en C#m7. Suena a aproximación cromática de un compás entero, que se resuelve subiendo.',
    desplazamientos: [-1, -1],
  },
  {
    id: 'tritono',
    nombre: 'Tritono',
    descripcion: 'La frase a un tritono: la tonalidad más lejana. Muy tensa sobre un menor; sobre un dominante es la sustitución tritonal y suena a alterado.',
    desplazamientos: [6, 6],
  },
  {
    id: 'escalera',
    nombre: 'Escalera cromática',
    descripcion: 'El primer trozo de la frase, medio tono arriba y después un tono arriba: la idea sube por semitonos y vuelve a caer en la tonalidad.',
    desplazamientos: [1, 2],
    escalera: true,
  },
];

export interface NotaOut {
  midi: number;
  nota: string;
  /** Si la nota está en la escala del acorde. */
  dentro: boolean;
  /** Duración en corcheas. */
  dur: number;
}

export interface CompasOut {
  fuera: boolean;
  /** En qué tonalidad se piensa ese compás: 'Dm7', 'Ebm7', 'Ebm7 → Em7'. */
  piensa: string;
  notas: NotaOut[];
}

const mod = (n: number) => ((n % 12) + 12) % 12;
const BEMOLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Raíz entre G3 y F#4: la frase cae en el registro medio. */
const baseMidi = (tonica: string) => 55 + mod(pitchClass(notaDeGrado(tonica, '1')) - 7);

/**
 * Las dos versiones de la frase de cuatro compases: la original (todo dentro) y
 * la que sale en el compás 2 y vuelve en el 3. El compás 4 resuelve en la raíz.
 */
export function frasesOutside(tonica: string, a: AcordeOut, celula: string, t: Tecnica): { original: CompasOut[]; salida: CompasOut[] } {
  const base = baseMidi(tonica);
  const pcRaiz = mod(base);
  const enEscala = new Set(a.escala.map((g) => mod(pcRaiz + semitonosGrado(g))));
  const grados = a.celulas[celula] ?? a.celulas.pentatonica;
  const dentroDe = (g: string, dur = 1): NotaOut => {
    const midi = base + semitonosGrado(g);
    return { midi, nota: formatNota(notaDeGrado(tonica, g)), dentro: true, dur };
  };
  const celda = grados.map((g) => dentroDe(g));
  /**
   * Raíz de la tonalidad de fuera (a `d` semitonos) con la grafía que da menos
   * alteraciones a la frase: C#m mejor que Dbm (Db Fb Gb…), Ebm mejor que D#m.
   * A igualdad, bemoles subiendo y sostenidos bajando.
   */
  const raizFuera = (d: number, usados: readonly string[]): string => {
    const opciones = [...new Set(d < 0 ? [SOSTENIDOS[mod(pcRaiz + d)], BEMOLES[mod(pcRaiz + d)]] : [BEMOLES[mod(pcRaiz + d)], SOSTENIDOS[mod(pcRaiz + d)]])];
    const coste = (r: string) =>
      [r, ...usados].reduce((s, g) => {
        const alt = Math.abs(notaDeGrado(r, g === r ? '1' : g).alteracion);
        return s + alt + (alt > 1 ? 10 : 0);
      }, 0);
    return opciones.reduce((mejor, r) => (coste(r) < coste(mejor) ? r : mejor));
  };
  const desplazar = (notas: readonly NotaOut[], gs: readonly string[], d: number): NotaOut[] => {
    const raiz = raizFuera(d, gs);
    return notas.map((n, k) => {
      const midi = n.midi + d;
      return { midi, nota: formatNota(notaDeGrado(raiz, gs[k])), dentro: enEscala.has(mod(midi)), dur: n.dur };
    });
  };
  const nombre = (d: number, gs: readonly string[]) => `${raizFuera(d, gs)}${a.simbolo}`;
  const yo = `${formatNota(notaDeGrado(tonica, '1'))}${a.simbolo}`;
  // Final: las cuatro primeras notas y la raíz más cercana, larga.
  const ultima = celda[3].midi;
  const raices = [base - 12, base, base + 12];
  const raiz = raices.sort((x, y) => Math.abs(x - ultima) - Math.abs(y - ultima))[0];
  const final: CompasOut = {
    fuera: false,
    piensa: yo,
    notas: [...celda.slice(0, 4), { midi: raiz, nota: formatNota(notaDeGrado(tonica, '1')), dentro: true, dur: 4 }],
  };
  const dentro = (): CompasOut => ({ fuera: false, piensa: yo, notas: celda.map((n) => ({ ...n })) });
  const [d1, d2] = t.desplazamientos;
  const [g1, g2] = t.escalera ? [grados.slice(0, 4), grados.slice(0, 4)] : [grados.slice(0, 4), grados.slice(4)];
  const [n1, n2] = t.escalera ? [celda.slice(0, 4), celda.slice(0, 4)] : [celda.slice(0, 4), celda.slice(4)];
  // La grafía de toda la frase de fuera se decide con la frase entera si es una sola tonalidad.
  const fuera: CompasOut = {
    fuera: true,
    piensa: d1 === d2 ? nombre(d1, grados) : `${nombre(d1, g1)} → ${nombre(d2, g2)}`,
    notas: d1 === d2 ? desplazar(celda, grados, d1) : [...desplazar(n1, g1, d1), ...desplazar(n2, g2, d2)],
  };
  return { original: [dentro(), dentro(), dentro(), final], salida: [dentro(), fuera, dentro(), final] };
}

export interface OpcionesOutside {
  swing?: number;
  /** El acorde del vamp de fondo (dentro todo el rato). */
  fondo?: boolean;
  sostenido?: boolean;
}

/**
 * Audio de una o varias frases seguidas (cada una, cuatro compases de 4/4), y
 * cuándo suena cada nota (frase, compás, posición) para marcarla.
 */
export function secuenciaOutside(
  frases: readonly CompasOut[][],
  tonica: string,
  a: AcordeOut,
  bpm: number,
  op: OpcionesOutside = {},
): { eventos: Evento[]; tiempos: { frase: number; compas: number; k: number; inicio: number; fin: number }[]; duracion: number } {
  const pulso = 60 / bpm;
  const s = op.swing ?? 0.5;
  const momento = (c: number) => {
    const p = Math.floor(c / 2);
    const x = c - 2 * p;
    return p * pulso + (x < 1 ? x * s : s + (x - 1) * (1 - s)) * pulso;
  };
  const eventos: Evento[] = [];
  const tiempos: { frase: number; compas: number; k: number; inicio: number; fin: number }[] = [];
  let compasGlobal = 0;
  frases.forEach((frase, f) => {
    frase.forEach((compas, c) => {
      let corchea = compasGlobal * 8;
      compas.notas.forEach((n, k) => {
        const inicio = momento(corchea);
        const fin = momento(corchea + n.dur);
        eventos.push({ midi: n.midi, inicio, duracion: (fin - inicio) * 0.92 });
        tiempos.push({ frase: f, compas: c, k, inicio, fin });
        corchea += n.dur;
      });
      if (op.fondo) {
        const pc = mod(pitchClass(notaDeGrado(tonica, '1')));
        const t0 = compasGlobal * 4 * pulso;
        const notas = [40 + mod(pc - 4), ...a.acorde.slice(1).map((g) => 52 + mod(pc + semitonosGrado(g) - 4))];
        for (const midi of notas) eventos.push({ midi, inicio: t0, duracion: 4 * pulso * (op.sostenido ? 1 : 0.9) });
      }
      compasGlobal++;
    });
  });
  return { eventos: op.sostenido ? ligarRepetidos(eventos) : eventos, tiempos, duracion: compasGlobal * 4 * pulso };
}
