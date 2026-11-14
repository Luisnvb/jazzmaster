// Progresiones en grados romanos (IIm7 V7 | Imaj7), su transporte a una tónica
// y su secuencia de audio. Funciones puras, sin DOM.
import { ligarRepetidos, type Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

export interface Progresion {
  id: string;
  nombre: string;
  descripcion?: string;
  /** Pulsos por compás (4 por defecto). */
  pulsos?: number;
  /** Un texto por compás, con los acordes separados por espacios: ['IIm7 V7', 'Imaj7']. */
  compases: string[];
}

/** Ediciones locales: id → progresión cambiada o nueva, o null si se ha borrado. */
export type CambiosProgresiones = Record<string, Progresion | null>;

/** Calidades admitidas: sufijo → fórmula en grados y grupo de grupos.yaml. */
const CALIDADES: Record<string, { formula: string[]; grupo: string }> = {
  '': { formula: ['1', '3', '5'], grupo: 'maj7' },
  maj7: { formula: ['1', '3', '5', '7'], grupo: 'maj7' },
  maj9: { formula: ['1', '3', '7', '9'], grupo: 'maj7' },
  '6': { formula: ['1', '3', '5', '6'], grupo: 'maj7' },
  '6/9': { formula: ['1', '3', '6', '9'], grupo: 'maj7' },
  m: { formula: ['1', 'b3', '5'], grupo: 'm7' },
  m7: { formula: ['1', 'b3', '5', 'b7'], grupo: 'm7' },
  m9: { formula: ['1', 'b3', 'b7', '9'], grupo: 'm7' },
  m11: { formula: ['1', 'b3', 'b7', '11'], grupo: 'm7' },
  m6: { formula: ['1', 'b3', '5', '6'], grupo: 'mmaj7' },
  mMaj7: { formula: ['1', 'b3', '5', '7'], grupo: 'mmaj7' },
  '7': { formula: ['1', '3', '5', 'b7'], grupo: 'dom7' },
  '9': { formula: ['1', '3', 'b7', '9'], grupo: 'dom7' },
  '13': { formula: ['1', '3', 'b7', '13'], grupo: 'dom7' },
  sus4: { formula: ['1', '4', '5'], grupo: 'sus' },
  '7sus4': { formula: ['1', '4', '5', 'b7'], grupo: 'sus' },
  '7alt': { formula: ['1', '3', 'b7', '#9', 'b13'], grupo: 'alt7' },
  '7b9': { formula: ['1', '3', '5', 'b7', 'b9'], grupo: 'alt7' },
  '7#9': { formula: ['1', '3', 'b7', '#9'], grupo: 'alt7' },
  '7#5': { formula: ['1', '3', '#5', 'b7'], grupo: 'alt7' },
  '+': { formula: ['1', '3', '#5'], grupo: 'aug' },
  'maj7#5': { formula: ['1', '3', '#5', '7'], grupo: 'aug' },
  m7b5: { formula: ['1', 'b3', 'b5', 'b7'], grupo: 'm7b5' },
  'ø7': { formula: ['1', 'b3', 'b5', 'b7'], grupo: 'm7b5' },
  // Tríada disminuida (vii° de la escala mayor, ii° de la menor).
  '°': { formula: ['1', 'b3', 'b5'], grupo: 'm7b5' },
  '°7': { formula: ['1', 'b3', 'b5', 'bb7'], grupo: 'dim7' },
};

/** Grafías alternativas. */
const SINONIMOS: Record<string, string> = {
  ø: 'ø7',
  o7: '°7',
  o: '°',
  dim: '°',
  sus: 'sus4',
  dim7: '°7',
  aug: '+',
  'm(maj7)': 'mMaj7',
  '7sus': '7sus4',
  '-7': 'm7',
  '-': 'm',
  ma7: 'maj7',
};

export const SUFIJOS = Object.keys(CALIDADES).filter(Boolean);

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export interface AcordeGrado {
  /** Tal como se escribe: bVII7. */
  texto: string;
  /** Grado de la raíz respecto a la tónica: b7. */
  grado: string;
  sufijo: string;
  formula: string[];
  grupo: string;
  /**
   * Inversión: nota del acorde que va en el bajo, como grado de la fórmula
   * ('3', 'b3', '5', 'b7'…). Sin ella, el bajo es la raíz.
   */
  bajo?: string;
}

/** Inversiones: I/3 (primera), I/5 (segunda), V7/7 (tercera). El número es la nota del acorde. */
const INVERSIONES = ['1', '3', '5', '7'];

export function parseAcordeGrado(texto: string): AcordeGrado {
  // "I/3": acorde y, tras la barra, la nota del acorde que va en el bajo.
  const [acorde, inversion, sobra] = texto.trim().split('/');
  if (sobra !== undefined) throw new Error(`Acorde no válido: "${texto}" (solo una barra: I/3)`);
  const base = parseAcordeSinBajo(texto.trim(), acorde);
  if (inversion === undefined) return base;
  if (!INVERSIONES.includes(inversion)) {
    throw new Error(`Inversión no válida en "${texto}": después de la barra va 3, 5 o 7 (la nota del acorde que hace de bajo).`);
  }
  // La nota con ese número en la fórmula (/3 en un acorde menor es su b3).
  const bajo = base.formula.find((g) => g.replace(/^[b#]+/, '') === inversion);
  if (!bajo) throw new Error(`"${texto}": el acorde no tiene ${inversion}ª para ponerla en el bajo.`);
  return bajo === '1' ? base : { ...base, bajo };
}

function parseAcordeSinBajo(texto: string, acorde: string): AcordeGrado {
  const m = /^(b|#)?(VII|VI|IV|V|III|II|I)(.*)$/i.exec(acorde);
  if (!m) throw new Error(`Acorde no válido: "${texto}" (usa grados romanos: IIm7, V7, bVI7…)`);
  const numero = ROMANOS.indexOf(m[2].toUpperCase()) + 1;
  // En minúsculas (ii, vi) y sin sufijo se entiende menor.
  const sufijoEscrito = m[3] === '' && m[2] === m[2].toLowerCase() ? 'm' : m[3];
  const sufijo = SINONIMOS[sufijoEscrito] ?? sufijoEscrito;
  const calidad = CALIDADES[sufijo];
  if (!calidad) throw new Error(`Calidad no reconocida en "${texto}": "${m[3]}". Valen: ${SUFIJOS.join(', ')}`);
  return { texto: texto.trim(), grado: `${m[1] ?? ''}${numero}`, sufijo, ...calidad };
}

/** Compases de una progresión ya analizados. Lanza un error si algo no se entiende. */
export function analizarProgresion(compases: readonly string[]): AcordeGrado[][] {
  if (compases.length === 0) throw new Error('La progresión no tiene compases.');
  return compases.map((c, i) => {
    const acordes = c.trim().split(/\s+/).filter(Boolean);
    if (acordes.length === 0) throw new Error(`Compás ${i + 1} vacío.`);
    return acordes.map(parseAcordeGrado);
  });
}

/** Texto editable ("IIm7 V7 | Imaj7") ↔ lista de compases. */
export const compasesDeTexto = (texto: string) =>
  texto
    .split('|')
    .map((c) => c.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
export const textoDeCompases = (compases: readonly string[]) => compases.join(' | ');

/** Raíz de un acorde en una tónica: (Bb, bVII7) → Ab. */
export const raizEn = (tonica: string, a: AcordeGrado) => formatNota(notaDeGrado(tonica, a.grado));

/** Cifrado de un acorde en una tónica: (Bb, bVII7) → Ab7; (C, I/3) → C/E. */
export const simboloEn = (tonica: string, a: AcordeGrado) =>
  raizEn(tonica, a) + a.sufijo + (a.bajo ? `/${formatNota(notaDeGrado(notaDeGrado(tonica, a.grado), a.bajo))}` : '');

export interface Tramo {
  compas: number;
  acorde: number;
  inicio: number;
  fin: number;
}

export interface OpcionesProgresion {
  /** Un clic por pulso, más fuerte en el primero de cada compás. */
  metronomo?: boolean;
  /** Acordes mantenidos de principio a fin y ligados si se repiten (pad, órgano). */
  sostenido?: boolean;
}

/**
 * Audio de la progresión: en cada acorde, el bajo y el acorde en posición cerrada
 * por encima (raíz entre G2 y F#3 para que no salte de registro). Devuelve también
 * cuándo suena cada acorde, para marcarlo, y la duración total (para el bucle).
 */
export function secuenciaProgresion(
  tonica: string,
  compases: AcordeGrado[][],
  bpm: number,
  pulsos = 4,
  op: OpcionesProgresion = {},
): { eventos: Evento[]; tramos: Tramo[]; duracion: number } {
  const pulso = 60 / bpm;
  const eventos: Evento[] = [];
  const tramos: Tramo[] = [];
  let t = 0;
  compases.forEach((acordes, i) => {
    if (op.metronomo) {
      for (let p = 0; p < pulsos; p++) eventos.push({ midi: 0, inicio: t + p * pulso, duracion: 0.05, clic: p === 0 ? 'fuerte' : 'debil' });
    }
    const dur = (pulsos * pulso) / acordes.length;
    const notas = op.sostenido ? 1 : 0.95;
    acordes.forEach((a, j) => {
      // Con inversión, el bajo es esa nota del acorde y el resto (raíz incluida) va encima.
      const gradoBajo = a.bajo ?? '1';
      const sobreBajo = semitonosGrado(gradoBajo) % 12;
      const pc = (pitchClass(notaDeGrado(tonica, a.grado)) + sobreBajo) % 12;
      const bajo = 43 + ((pc - 7 + 12) % 12); // G2 (43) … F#3 (54)
      eventos.push({ midi: bajo, inicio: t, duracion: dur * notas });
      for (const g of a.formula.filter((g) => g !== gradoBajo)) {
        // Notas y tensiones (9, 11, 13) dentro de la octava sobre el bajo.
        const midi = bajo + 12 + ((semitonosGrado(g) - sobreBajo + 120) % 12);
        eventos.push(
          op.sostenido ? { midi, inicio: t, duracion: dur } : { midi, inicio: t + 0.02, duracion: dur * 0.9 },
        );
      }
      tramos.push({ compas: i, acorde: j, inicio: t, fin: t + dur });
      t += dur;
    });
  });
  return { eventos: op.sostenido ? ligarRepetidos(eventos) : eventos, tramos, duracion: t };
}

/**
 * Lista final: las del repositorio en su orden (con los cambios aplicados y sin
 * las borradas) y después las nuevas.
 */
export function aplicarCambiosProgresiones(base: readonly Progresion[], cambios: CambiosProgresiones): Progresion[] {
  const ids = new Set(base.map((p) => p.id));
  const res: Progresion[] = [];
  for (const p of base) {
    if (!(p.id in cambios)) res.push(p);
    else if (cambios[p.id]) res.push(cambios[p.id]!);
  }
  for (const [id, p] of Object.entries(cambios)) if (!ids.has(id) && p) res.push(p);
  return res;
}

/** Lista en el formato de src/data/progresiones.yaml. */
export function progresionesAYaml(lista: readonly Progresion[]): string {
  const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
  const entradas = lista.map((p) =>
    [
      `- id: ${p.id}`,
      `  nombre: ${q(p.nombre)}`,
      p.descripcion ? `  descripcion: ${q(p.descripcion)}` : '',
      p.pulsos && p.pulsos !== 4 ? `  pulsos: ${p.pulsos}` : '',
      `  compases: [${p.compases.map(q).join(', ')}]`,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  return `# Progresiones. Exportado desde la web: sustituye src/data/progresiones.yaml por este archivo.\n\n${entradas.join('\n\n')}\n`;
}
