// Armonía funcional: la función de cada acorde en una tonalidad (tónica,
// subdominante, dominante) y los acordes de fuera de ella (dominantes secundarios,
// sustituto tritonal, intercambio modal, disminuidos de paso). Funciones puras.
import type { AcordeGrado } from './progresiones.ts';
import { semitonosGrado } from './teoria.ts';

export type Modo = 'mayor' | 'menor';
export type Funcion = 'T' | 'SD' | 'D' | '?';

export interface Analisis {
  funcion: Funcion;
  /** Nombre del papel del acorde: "IIm7", "V7/II", "subV7", "IVm (intercambio modal)"… */
  papel: string;
  /** Explicación corta. */
  nota: string;
}

/** Familia de un acorde según su grupo de grupos.yaml. */
function familia(a: AcordeGrado): 'maj' | 'm' | 'dom' | 'semi' | 'dim' | 'aum' {
  switch (a.grupo) {
    case 'm7':
    case 'mmaj7':
      return 'm';
    case 'dom7':
    case 'alt7':
    case 'sus':
      return 'dom';
    case 'm7b5':
      return 'semi';
    case 'dim7':
      return 'dim';
    case 'aug':
      return 'aum';
    default:
      return 'maj';
  }
}

const ROMANO_MAYOR: Record<number, string> = { 0: 'I', 1: 'bII', 2: 'II', 3: 'bIII', 4: 'III', 5: 'IV', 6: '#IV', 7: 'V', 8: 'bVI', 9: 'VI', 10: 'bVII', 11: 'VII' };

type Tabla = Record<number, Partial<Record<ReturnType<typeof familia>, Analisis>>>;

const T = (papel: string, nota: string): Analisis => ({ funcion: 'T', papel, nota });
const SD = (papel: string, nota: string): Analisis => ({ funcion: 'SD', papel, nota });
const D = (papel: string, nota: string): Analisis => ({ funcion: 'D', papel, nota });

/** Acordes con un papel propio en cada modo (semitonos de la raíz sobre la tónica → familia → análisis). */
const TABLAS: Record<Modo, Tabla> = {
  mayor: {
    0: {
      maj: T('I', 'Tónica: el reposo.'),
      m: T('Im', 'Tónica menor, prestada del modo menor (intercambio modal).'),
      dom: T('I7', 'Tónica con b7, como en el blues.'),
    },
    1: { dom: D('subV7', 'Sustituto tritonal del V7: comparte su 3 y su 7.'), maj: SD('bII', 'Napolitano, prestado del frigio.') },
    2: { m: SD('IIm', 'Subdominante: prepara el V.'), semi: SD('IIø', 'Subdominante menor (intercambio modal): prepara un V7b9.') },
    3: { maj: T('bIII', 'Prestado del modo menor (intercambio modal).'), dim: D('bIII°7', 'Disminuido de paso entre IIm y IIIm.') },
    4: {
      m: T('IIIm', 'Sustituto de la tónica: comparte tres notas con Imaj7.'),
      maj: T('III', 'Tónica de otro centro a una 3ª mayor: el ciclo de terceras de los cambios de Coltrane.'),
    },
    5: { maj: SD('IV', 'Subdominante: se aleja del reposo sin tensión.'), m: SD('IVm', 'Subdominante menor (intercambio modal): sonido melancólico.'), dom: SD('IV7', 'Subdominante con b7, típico del blues.') },
    6: { dim: D('#IV°7', 'Disminuido de paso entre IV y I/5 (o V).'), semi: T('#IVø', 'Sustituto de la tónica en la cadena #IVø–VII7–IIIm.') },
    7: { dom: D('V7', 'Dominante: la tensión que pide volver al I (tritono entre su 3 y su 7).'), maj: D('V', 'Dominante (tríada).'), m: SD('Vm7', 'IIm7 del IV: prepara un I7 → IV.') },
    8: { maj: SD('bVI', 'Subdominante menor prestada (intercambio modal).'), dom: D('bVI7', 'Sustituto tritonal del V7/V.') },
    9: { m: T('VIm', 'Sustituto de la tónica (relativo menor).') },
    10: { dom: SD('bVII7', 'Dominante "por la puerta de atrás" (backdoor): subdominante menor que resuelve al I.'), maj: SD('bVII', 'Prestado del mixolidio o del menor.') },
    11: { semi: D('VIIø', 'Dominante sin raíz: es un V9 sin la fundamental.'), dim: D('VII°7', 'Dominante sin raíz (V7b9).') },
  },
  menor: {
    0: { m: T('Im', 'Tónica menor.'), maj: T('I', 'Tónica mayor al final (tercera de picardía).') },
    1: { dom: D('subV7', 'Sustituto tritonal del V7.'), maj: SD('bII', 'Napolitano: subdominante con la b2 del frigio.') },
    2: { semi: SD('IIø', 'Subdominante del menor: prepara el V7.'), m: SD('IIm7', 'Subdominante del menor dórico.') },
    3: { maj: T('bIII', 'Relativo mayor: sustituto de la tónica.') },
    5: { m: SD('IVm', 'Subdominante menor.'), maj: SD('IV', 'Subdominante del menor melódico o dórico (con la 6 mayor).'), dom: SD('IV7', 'Subdominante del dórico (con la 6 mayor).') },
    7: { dom: D('V7', 'Dominante del menor (con la 7 de la menor armónica).'), maj: D('V', 'Dominante (tríada).'), m: D('Vm', 'Dominante débil del menor natural, sin sensible.') },
    8: { maj: SD('bVI', 'Subdominante del menor.'), dom: D('bVI7', 'Sustituto tritonal del V7/V.') },
    10: { dom: SD('bVII7', 'Subtónica: dominante del bIII o vuelta al Im.'), maj: SD('bVII', 'Subtónica del menor natural.') },
    11: { dim: D('VII°7', 'Dominante sin raíz (V7b9 de la menor armónica).') },
  },
};

/** Función de un acorde (escrito en grados romanos) en una tonalidad mayor o menor. */
export function analizar(a: AcordeGrado, modo: Modo): Analisis {
  const s = ((semitonosGrado(a.grado) % 12) + 12) % 12;
  const f = familia(a);
  const propio = TABLAS[modo][s]?.[f];
  // Con inversión, se indica qué nota del acorde va en el bajo (/3, /5, /7).
  if (propio) return { ...propio, papel: propio.papel + (a.bajo ? `/${a.bajo.replace(/^[b#]+/, '')}` : '') };
  if (f === 'dom') {
    // Dominante secundario: resuelve una quinta por debajo (una cuarta por encima).
    const destino = ROMANO_MAYOR[(s + 5) % 12];
    return D(`V7/${destino}`, `Dominante secundario: lleva al ${destino}.`);
  }
  if (f === 'dim') return D(`${ROMANO_MAYOR[s]}°7`, 'Disminuido de paso: un dominante sin raíz hacia el acorde de medio tono por encima.');
  if (f === 'semi') return SD(`${ROMANO_MAYOR[s]}ø`, `IIø de un ii–V secundario hacia el ${ROMANO_MAYOR[(s + 10) % 12]}.`);
  if (f === 'm') {
    // Un m7 que va a un dominante una cuarta por encima es el II de un ii–V secundario.
    return SD(`${ROMANO_MAYOR[s]}m`, `IIm de un ii–V secundario hacia el ${ROMANO_MAYOR[(s + 10) % 12]}.`);
  }
  return { funcion: '?', papel: ROMANO_MAYOR[s], nota: 'Fuera de la tonalidad.' };
}

const raizDe = (a: AcordeGrado) => ((semitonosGrado(a.grado) % 12) + 12) % 12;

/**
 * Análisis de una progresión, mirando lo que viene después:
 * - un acorde de séptima dominante que resuelve una quinta por debajo es un
 *   dominante secundario aunque en la tabla tenga otro papel (el I7 que va al IV
 *   es V7/IV; si no, tónica de blues);
 * - uno que baja medio tono es un sustituto tritonal secundario (bVI7 → V: subV7/V);
 * - un m7 o m7b5 seguido de un dominante una cuarta por encima es el II de un
 *   ii–V secundario (VIIø – III7 → VIm), también si ese dominante es un subV
 *   (bVIm7 – bII7 → I);
 * - un ii–V que va a parar a otro m7 medio tono por debajo es un ii–V cromático
 *   (IIIm7 VI7 | bIIIm7 bVI7 | IIm7 del Bird blues).
 */
export function analizarSecuencia(acordes: readonly AcordeGrado[], modo: Modo): Analisis[] {
  return acordes.map((a, i) => {
    const base = analizar(a, modo);
    const siguiente = acordes[i + 1];
    if (!siguiente) return base;
    const s = raizDe(a);
    const t = raizDe(siguiente);
    const f = familia(a);
    const anterior = acordes[i - 1];
    // ii–V cromático: el II de este dominante va justo antes y lo que sigue es un m7 medio tono por debajo de ese II.
    const p = anterior ? raizDe(anterior) : -1;
    if (f === 'dom' && anterior && familia(anterior) === 'm' && p === (s + 7) % 12 && familia(siguiente) === 'm' && t === (p + 11) % 12) {
      const destino = ROMANO_MAYOR[(s + 5) % 12];
      return D(`V7/${destino}`, `Dominante de un ii–V hacia el ${destino} que no resuelve: el ii–V baja medio tono (ii–V cromáticos).`);
    }
    if (f === 'dom') {
      if (s === 7 || base.papel.startsWith('subV7')) return base;
      if (t === (s + 5) % 12 && base.funcion !== 'D') {
        const destino = ROMANO_MAYOR[t];
        return D(`V7/${destino}`, `Dominante secundario: lleva al ${destino}.`);
      }
      if (t === (s + 11) % 12 && t !== 0) {
        const destino = ROMANO_MAYOR[t];
        return D(`subV7/${destino}`, `Sustituto tritonal del V7/${destino}: resuelve medio tono por debajo, al ${destino}.`);
      }
      return base;
    }
    if ((f === 'm' || f === 'semi') && familia(siguiente) === 'dom' && t === (s + 5) % 12 && ![2, 5, 7].includes(s)) {
      // (Salvo el IIm–V del tono, el IVm–bVII7 de la puerta de atrás y el Vm7–I7 hacia el IV, que ya tienen su papel.)
      // Adónde va el ii–V: una quinta por debajo del dominante o, si es un subV, medio tono por debajo.
      const despues = acordes[i + 2];
      const papel = `${ROMANO_MAYOR[s]}${f === 'semi' ? 'ø' : 'm'}`;
      if (despues && familia(despues) === 'm' && raizDe(despues) === (s + 11) % 12) {
        return SD(papel, `IIm de un ii–V hacia el ${ROMANO_MAYOR[(t + 5) % 12]} que no resuelve: medio tono por encima del ${ROMANO_MAYOR[(s + 11) % 12]}m que sigue (ii–V cromáticos).`);
      }
      const sub = despues && raizDe(despues) === (t + 11) % 12;
      const destino = ROMANO_MAYOR[sub ? (t + 11) % 12 : (t + 5) % 12];
      return SD(
        papel,
        sub
          ? `IIm del ii–V sustituto hacia el ${destino}: el ii–V a un tritono, que resuelve por medio tono.`
          : `IIm de un ii–V secundario hacia el ${destino}.`,
      );
    }
    return base;
  });
}

/** Acordes diatónicos de cada modo agrupados por función (en grados romanos, para progresiones.ts). */
export const DIATONICOS: Record<Modo, Record<Exclude<Funcion, '?'>, string[]>> = {
  mayor: { T: ['Imaj7', 'IIIm7', 'VIm7'], SD: ['IIm7', 'IVmaj7'], D: ['V7', 'VIIm7b5'] },
  menor: { T: ['Im7', 'bIIImaj7'], SD: ['IIm7b5', 'IVm7', 'bVImaj7', 'bVII7'], D: ['V7', 'VII°7'] },
};

/** Modo más probable de una progresión: menor si empieza o acaba en un I menor. */
export function modoProbable(acordes: readonly AcordeGrado[]): Modo {
  const tonicas = [acordes[0], acordes.at(-1)].filter((a) => a && ((semitonosGrado(a.grado) % 12) + 12) % 12 === 0);
  return tonicas.some((a) => familia(a!) === 'm') ? 'menor' : 'mayor';
}
