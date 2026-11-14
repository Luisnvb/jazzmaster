// Modos: las escalas que salen de empezar una escala madre (mayor, menor melódica,
// menor armónica) en cada uno de sus grados. Se pueden ver como paralelos (todos
// sobre la misma tónica, para comparar su color) o relativos (todos con las mismas
// notas). Funciones puras, sin DOM.
import type { Evento } from './secuencias.ts';
import { formatNota, notaDeGrado, pitchClass, semitonosGrado } from './teoria.ts';

export interface Modo {
  nombre: string;
  /** Grados del modo sobre su propia tónica. */
  formula: string[];
  /** Cuatriada típica del modo (el acorde sobre el que se usa). */
  acorde: string;
  /** Grados que lo distinguen del modo más parecido. */
  caracteristicas: string[];
  /** Con qué se compara para sacar las características. */
  frente: string;
  sonido: string;
}

export interface Madre {
  id: 'mayor' | 'melodica' | 'armonica';
  nombre: string;
  /** Grados de la escala madre (para la tónica de cada modo en la vista relativa). */
  formula: string[];
  modos: Modo[];
}

export const MADRES: Madre[] = [
  {
    id: 'mayor',
    nombre: 'Escala mayor',
    formula: ['1', '2', '3', '4', '5', '6', '7'],
    modos: [
      { nombre: 'Jónico', formula: ['1', '2', '3', '4', '5', '6', '7'], acorde: 'maj7', caracteristicas: ['4'], frente: 'lidio', sonido: 'La escala mayor: estable, con la 4 como nota a evitar sobre el acorde.' },
      { nombre: 'Dórico', formula: ['1', '2', 'b3', '4', '5', '6', 'b7'], acorde: 'm7', caracteristicas: ['6'], frente: 'eólico', sonido: 'Menor luminoso: la 6 mayor le quita dramatismo. El modo del jazz modal.' },
      { nombre: 'Frigio', formula: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], acorde: 'm7', caracteristicas: ['b2'], frente: 'eólico', sonido: 'Menor oscuro y español, por la b2.' },
      { nombre: 'Lidio', formula: ['1', '2', '3', '#4', '5', '6', '7'], acorde: 'maj7#11', caracteristicas: ['#4'], frente: 'jónico', sonido: 'Mayor flotante y luminoso: la #4 no pide resolver.' },
      { nombre: 'Mixolidio', formula: ['1', '2', '3', '4', '5', '6', 'b7'], acorde: '7', caracteristicas: ['b7'], frente: 'jónico', sonido: 'Mayor con la b7: el sonido del dominante, del blues y del rock.' },
      { nombre: 'Eólico', formula: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], acorde: 'm7', caracteristicas: ['b6'], frente: 'dórico', sonido: 'La menor natural: triste, por la b6.' },
      { nombre: 'Locrio', formula: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], acorde: 'm7b5', caracteristicas: ['b5'], frente: 'frigio', sonido: 'Inestable: la b5 hace que la tónica no descanse. Sobre el m7b5.' },
    ],
  },
  {
    id: 'melodica',
    nombre: 'Menor melódica',
    formula: ['1', '2', 'b3', '4', '5', '6', '7'],
    modos: [
      { nombre: 'Menor melódica', formula: ['1', '2', 'b3', '4', '5', '6', '7'], acorde: 'mMaj7', caracteristicas: ['7'], frente: 'dórico', sonido: 'Menor con 6 y 7 mayores: sofisticado, el menor del jazz.' },
      { nombre: 'Dórico b2', formula: ['1', 'b2', 'b3', '4', '5', '6', 'b7'], acorde: 'm7 (o 7sus4b9)', caracteristicas: ['b2'], frente: 'dórico', sonido: 'Dórico con la b2 del frigio: muy usado sobre sus4b9.' },
      { nombre: 'Lidio aumentado', formula: ['1', '2', '3', '#4', '#5', '6', '7'], acorde: 'maj7#5', caracteristicas: ['#5'], frente: 'lidio', sonido: 'Lidio con la 5 aumentada: brillante y suspendido.' },
      { nombre: 'Lidio dominante', formula: ['1', '2', '3', '#4', '5', '6', 'b7'], acorde: '7#11', caracteristicas: ['#4'], frente: 'mixolidio', sonido: 'Dominante con #11: el sonido del bII7 y de los dominantes que no resuelven.' },
      { nombre: 'Mixolidio b6', formula: ['1', '2', '3', '4', '5', 'b6', 'b7'], acorde: '7b13', caracteristicas: ['b6'], frente: 'mixolidio', sonido: 'Dominante que mira hacia el menor, por la b13.' },
      { nombre: 'Locrio #2', formula: ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'], acorde: 'm7b5', caracteristicas: ['2'], frente: 'locrio', sonido: 'Locrio con la 9 natural: el m7b5 más usado en jazz.' },
      { nombre: 'Superlocrio (alterada)', formula: ['1', 'b2', '#2', '3', 'b5', '#5', 'b7'], acorde: '7alt', caracteristicas: ['b2', '#2', 'b5', '#5'], frente: 'mixolidio', sonido: 'Dominante con todas las tensiones alteradas: máxima tensión antes de resolver.' },
    ],
  },
  {
    id: 'armonica',
    nombre: 'Menor armónica',
    formula: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    modos: [
      { nombre: 'Menor armónica', formula: ['1', '2', 'b3', '4', '5', 'b6', '7'], acorde: 'mMaj7', caracteristicas: ['7'], frente: 'eólico', sonido: 'Eólico con la 7 mayor: el salto b6–7 le da su aire oriental.' },
      { nombre: 'Locrio 6', formula: ['1', 'b2', 'b3', '4', 'b5', '6', 'b7'], acorde: 'm7b5', caracteristicas: ['6'], frente: 'locrio', sonido: 'Locrio con la 6 mayor.' },
      { nombre: 'Jónico aumentado', formula: ['1', '2', '3', '4', '#5', '6', '7'], acorde: 'maj7#5', caracteristicas: ['#5'], frente: 'jónico', sonido: 'Jónico con la 5 aumentada.' },
      { nombre: 'Dórico #4', formula: ['1', '2', 'b3', '#4', '5', '6', 'b7'], acorde: 'm7', caracteristicas: ['#4'], frente: 'dórico', sonido: 'Dórico con la #4: menor con aire de Europa del Este.' },
      { nombre: 'Frigio dominante', formula: ['1', 'b2', '3', '4', '5', 'b6', 'b7'], acorde: '7b9', caracteristicas: ['3'], frente: 'frigio', sonido: 'El dominante del menor (V7b9): flamenco y música de Oriente Próximo.' },
      { nombre: 'Lidio #2', formula: ['1', '#2', '3', '#4', '5', '6', '7'], acorde: 'maj7#11', caracteristicas: ['#2'], frente: 'lidio', sonido: 'Lidio con la #2: exótico y brillante.' },
      { nombre: 'Ultralocrio', formula: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'bb7'], acorde: '°7', caracteristicas: ['b4', 'bb7'], frente: 'locrio', sonido: 'Escala del acorde disminuido que sale del V7b9.' },
    ],
  },
];

/** Orden de los modos de la escala mayor de más luminoso a más oscuro (índices en `modos`). */
export const BRILLO_MAYOR = [3, 0, 4, 1, 5, 2, 6];

export interface ModoEn extends Modo {
  /** Grado de la escala madre en el que empieza (0 = I). */
  grado: number;
  tonica: string;
  notas: string[];
}

/**
 * Los siete modos de una escala madre. `vista` paralela: todos sobre `tonica`;
 * relativa: `tonica` es la de la escala madre y cada modo empieza en su grado.
 */
export function modosEn(madre: Madre, tonica: string, vista: 'paralela' | 'relativa'): ModoEn[] {
  const orden = madre.id === 'mayor' && vista === 'paralela' ? BRILLO_MAYOR : [0, 1, 2, 3, 4, 5, 6];
  return orden.map((k) => {
    const m = madre.modos[k];
    const raiz = vista === 'paralela' ? tonica : formatNota(notaDeGrado(tonica, madre.formula[k]));
    return { ...m, grado: k, tonica: raiz, notas: m.formula.map((g) => formatNota(notaDeGrado(raiz, g))) };
  });
}

/**
 * Audio de un modo: la escala subiendo una octava y bajando, en corcheas, con
 * la tónica como pedal en el grave (entre E2 y D#3). `inicio` desplaza en el tiempo.
 */
export function eventosModo(m: ModoEn, bpm: number, inicio = 0): { eventos: Evento[]; duracion: number } {
  const corchea = 30 / bpm;
  const pc = pitchClass(notaDeGrado(m.tonica, '1'));
  const base = 52 + ((pc - 4 + 12) % 12); // tónica de la escala entre E3 y D#4
  const sube = [...m.formula.map((g) => base + semitonosGrado(g)), base + 12];
  const linea = [...sube, ...sube.slice(0, -1).reverse()];
  const eventos: Evento[] = linea.map((midi, i) => ({ midi, inicio: inicio + i * corchea, duracion: i === linea.length - 1 ? corchea * 3 : corchea * 0.95 }));
  const duracion = linea.length * corchea + corchea * 3;
  eventos.push({ midi: base - 12, inicio, duracion });
  return { eventos, duracion };
}
