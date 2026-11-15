// Formas de los standards (Estudio · Formas): AABA, ABAC, blues, rhythm changes
// y otras formas del Repertorio, con sus secciones y los acordes en grados para
// poder tocarlos en cualquier tonalidad. Los temas del Repertorio salen de su
// cifrado (.cmb.json) con `compasesDeCifrado`. Funciones puras.
import { formaDeCelda, raizWeb, simboloCelda, type Cmb } from './cmb.ts';
import { LETRAS, parseNota, pitchClass } from './teoria.ts';
import { parseAcordeGrado } from './progresiones.ts';

export interface Seccion {
  /** Letra de la sección (A, B, C…); las que se repiten llevan la misma letra. */
  letra: string;
  compases: number;
  /** Qué hace la sección en la forma. */
  papel: string;
}

export interface Ejemplo {
  id: string;
  nombre: string;
  /** Id de la canción del Repertorio, si el ejemplo es un tema de allí. */
  cancion?: string;
  /** Tónica original (la de la canción; C en los modelos). */
  tonica: string;
  /** Pulsos por compás (4 si no se dice). */
  pulsos?: number;
  secciones: Seccion[];
  /** Acordes en grados, un texto por compás (en los temas del Repertorio, se rellena al compilar). */
  compases?: string[];
  nota: string;
}

export interface Forma {
  id: string;
  nombre: string;
  /** Las letras, en una línea: AABA, 12 compases… */
  esquema: string;
  descripcion: string;
  ejemplos: Ejemplo[];
  /** Standards conocidos con esta forma (para buscar grabaciones). */
  standards: string[];
}

// --- Modelos (sin canción del Repertorio) ------------------------------------

// Rhythm changes, como en progresiones.yaml (rhythm-changes-a y -b; lo comprueban los tests).
export const RHYTHM_A = ['Imaj7 VIm7', 'IIm7 V7', 'Imaj7 VIm7', 'IIm7 V7', 'Imaj7 I7', 'IVmaj7 #IV°7', 'IIIm7 VI7', 'IIm7 V7'];
export const RHYTHM_B = ['III7', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'];
/** La A que cierra: los dos últimos compases se quedan en la tónica (2ª casilla). */
const RHYTHM_A_FINAL = [...RHYTHM_A.slice(0, 6), 'IIm7 V7', 'Imaj7'];

// AABA de 32 compases con la armonía típica de los standards de Broadway.
const AABA_A1 = ['Imaj7', 'VIm7', 'IIm7', 'V7', 'IIIm7 VI7', 'IIm7 V7', 'Imaj7 VIm7', 'IIm7 V7'];
const AABA_A2 = [...AABA_A1.slice(0, 6), 'Imaj7', 'Imaj7'];
const AABA_B = ['Vm7', 'I7', 'IVmaj7', 'IVmaj7', 'IIIm7', 'VI7', 'IIm7', 'V7'];

const A = (papel: string, compases = 8): Seccion => ({ letra: 'A', compases, papel });

export const FORMAS: Forma[] = [
  {
    id: 'aaba',
    nombre: 'AABA',
    esquema: 'A A B A · 32 compases',
    descripcion:
      'La forma de canción de Broadway: una idea de ocho compases que se repite, un puente que contrasta y la idea otra vez. La más común en los standards de los años 20 a 50.',
    ejemplos: [
      {
        id: 'aaba-modelo',
        nombre: 'Modelo AABA',
        tonica: 'C',
        secciones: [
          A('Presenta la melodía. Acaba en un turnaround (IIm7–V7) que vuelve a empezar.'),
          A('La misma melodía; el final cambia y cierra en la tónica (2ª casilla).'),
          { letra: 'B', compases: 8, papel: 'Puente: otra zona armónica (aquí el IV, con su ii–V) y un dominante que devuelve a la A.' },
          A('La última A, como la segunda: cierra el coro en la tónica.'),
        ],
        compases: [...AABA_A1, ...AABA_A2, ...AABA_B, ...AABA_A2],
        nota: 'Armonía de ejemplo, no de un tema concreto: tónica, turnarounds y un puente que va al IV. En el Repertorio aún no hay ningún tema AABA.',
      },
    ],
    standards: ['Satin Doll', 'Take the A Train', 'Honeysuckle Rose', 'Misty', 'Body and Soul', "Ain't Misbehavin'", "'Round Midnight", 'Have You Met Miss Jones', 'In a Sentimental Mood', 'Lullaby of Birdland'],
  },
  {
    id: 'abac',
    nombre: 'ABAC',
    esquema: 'A B A C · 32 compases',
    descripcion:
      'Dos mitades de 16 compases que empiezan igual (A) y acaban distinto: la primera queda abierta (B) y la segunda cierra (C). Se oye como «pregunta y respuesta» a gran escala.',
    ejemplos: [
      {
        id: 'days-of-wine-and-roses',
        nombre: 'Days of Wine and Roses',
        cancion: 'days-of-wine-and-roses',
        tonica: 'F',
        secciones: [
          A('Fmaj7 – Eb7 y una cadena de ii–V que baja hasta el Gm7.'),
          { letra: 'B', compases: 8, papel: 'Primer final: pasa por Dm (el VIm), con su ii–V, y se queda abierto en C7, el dominante.' },
          A('Igual que la primera A: el oyente reconoce que empieza la segunda mitad.'),
          { letra: 'C', compases: 8, papel: 'Segundo final: Bø7–E7 hacia Am y una cadena de ii–V que cierra en Fmaj7 (con el turnaround para volver).' },
        ],
        nota: 'Henry Mancini (1962). El cifrado del Repertorio simplifica algún compás (Eb7 entero en el 7, sin el Bbm7).',
      },
    ],
    standards: ['All of Me', 'But Not for Me', 'On Green Dolphin Street', 'There Will Never Be Another You', 'Out of Nowhere', "I'll See You in My Dreams", 'Embraceable You', 'Fly Me to the Moon'],
  },
  {
    id: 'blues',
    nombre: 'Blues',
    esquema: 'A A B · 12 compases',
    descripcion:
      'Tres frases de cuatro compases: tónica, subdominante y dominante con turnaround. Las letras del blues siguen el mismo esquema: un verso, el mismo verso otra vez y la respuesta.',
    ejemplos: [
      {
        id: 'turnaround',
        nombre: 'Turnaround',
        cancion: 'turnaround',
        tonica: 'C',
        secciones: [
          A('Tónica: C7 con un paso por el F7 en el compás 2 («quick change»).', 4),
          A('Subdominante: F7 y Fm7, y vuelta al C7. El verso «se repite» sobre otro acorde.', 4),
          { letra: 'B', compases: 4, papel: 'Respuesta: en lugar del V7, una bajada de m7 paralelos (Cm7 C#m7 – Bm7 Am7) y el turnaround C7 – G7.' },
        ],
        nota: 'Ornette Coleman (1959): un blues en C con una bajada cromática de acordes menores en los compases 9 y 10.',
      },
      {
        id: 'footprints',
        nombre: 'Footprints (blues menor)',
        cancion: 'footprints',
        tonica: 'C',
        pulsos: 3,
        secciones: [
          A('Ocho compases de 3/4 (cuatro de 6/4) en Cm7: la tónica, sin prisa.'),
          A('Fm7 (el IVm) y vuelta a Cm7.'),
          { letra: 'B', compases: 8, papel: 'F#ø7 – F7 – E7 – A7: dominantes que bajan por medio tono en lugar del V7, y Cm7 otra vez.' },
        ],
        nota: 'Wayne Shorter (1966). Blues menor de 24 compases de 3/4: el mismo esquema de 12 compases, con cada compás de 6/4 partido en dos.',
      },
    ],
    standards: ["Now's the Time", "Billie's Bounce", 'Blue Monk', 'Straight, No Chaser', 'Tenor Madness', 'Blues for Alice', 'C Jam Blues', 'Mr. P.C. (menor)', 'Equinox (menor)'],
  },
  {
    id: 'rhythm-changes',
    nombre: 'Rhythm changes',
    esquema: 'A A B A · 32 compases',
    descripcion:
      'Los acordes de I Got Rhythm (Gershwin, 1930), sobre los que se escribieron decenas de temas bebop. Una AABA en la que las A son turnarounds rápidos I–VI–II–V y el puente, dominantes por quintas de dos compases cada uno.',
    ejemplos: [
      {
        id: 'rhythm-modelo',
        nombre: 'Rhythm changes',
        tonica: 'Bb',
        secciones: [
          A('Turnarounds I–VI–II–V; en el compás 5, I7 hacia el IV y disminuido de paso.'),
          A('La misma A, pero con la 2ª casilla: los dos últimos compases cierran en la tónica.'),
          { letra: 'B', compases: 8, papel: 'Puente: III7 – VI7 – II7 – V7, dos compases cada uno, por el ciclo de quintas hasta el dominante.' },
          A('Última A, como la segunda.'),
        ],
        compases: [...RHYTHM_A, ...RHYTHM_A_FINAL, ...RHYTHM_B, ...RHYTHM_A_FINAL],
        nota: 'En Bb, la tonalidad de casi todos los temas bebop sobre estos acordes. Los compases son los de Progresiones (Rhythm changes A y puente).',
      },
    ],
    standards: ['I Got Rhythm', 'Oleo', 'Anthropology', 'Moose the Mooche', 'Rhythm-a-ning', 'Cotton Tail', 'Lester Leaps In', 'Dexterity', 'The Theme'],
  },
  {
    id: 'otras',
    nombre: 'Otras formas',
    esquema: 'AB, ABCD, 16 compases…',
    descripcion:
      'No todos los temas encajan en los moldes. Muchos standards modernos tienen formas de 16 compases, dos mitades casi iguales (AA′) o ninguna repetición (forma libre). Tres ejemplos del Repertorio.',
    ejemplos: [
      {
        id: 'cantaloupe-island',
        nombre: 'Cantaloupe Island',
        cancion: 'cantaloupe-island',
        tonica: 'F',
        secciones: [
          A('Fm7 durante cuatro compases: un vamp modal (dórico).', 4),
          { letra: 'B', compases: 4, papel: 'Db7: medio tono por debajo… o una 3ª mayor por debajo de la tónica.' },
          { letra: 'C', compases: 4, papel: 'Dm7: el cambio más sorprendente, a una 3ª menor por debajo.' },
          A('Fm7 otra vez: cierra el ciclo de 16.', 4),
        ],
        nota: 'Herbie Hancock (1964). 16 compases, cuatro acordes de cuatro compases: la forma es lo que da sentido a un tema casi sin cambios.',
      },
      {
        id: 'esp',
        nombre: 'E.S.P.',
        cancion: 'esp',
        tonica: 'F',
        secciones: [
          A('E7 – Fmaj7 y E7 – Ebmaj7; dominantes que resuelven medio tono abajo.', 16),
          { letra: 'A′', compases: 16, papel: 'Los primeros 12 compases son iguales; los cuatro últimos cambian para cerrar en Fmaj7.' },
        ],
        nota: 'Wayne Shorter (1965). Forma AA′: dos mitades de 16 que solo se distinguen al final, como ABAC pero con la parte central repetida.',
      },
      {
        id: 'stella-by-starlight',
        nombre: 'Stella by Starlight',
        cancion: 'stella-by-starlight',
        tonica: 'Bb',
        secciones: [
          A('Eø7 – A7 y una cadena de ii–V que no se asienta: la tonalidad se descubre poco a poco.', 16),
          { letra: 'B', compases: 8, papel: 'G7 hacia Cm7 y Ab7 hacia Bb: el momento más estable.' },
          { letra: 'C', compases: 8, papel: 'ii–V descendentes que acaban, por fin, en Bbmaj7.' },
        ],
        nota: 'Victor Young (1944). 32 compases sin ninguna sección repetida («forma libre»): hay que aprenderla entera, sin atajos.',
      },
    ],
    standards: ['Autumn Leaves (AABC)', 'Blue Bossa (16, AB)', 'Solar (12, no es blues)', 'Infant Eyes (27)', 'Footprints', 'Dolphin Dance (forma libre)'],
  },
];

// --- Secciones y posición ------------------------------------------------------

export const totalCompases = (secciones: readonly Seccion[]) => secciones.reduce((n, s) => n + s.compases, 0);

/** Primer compás (desde 0) de cada sección. */
export function inicios(secciones: readonly Seccion[]): number[] {
  let n = 0;
  return secciones.map((s) => ((n += s.compases), n - s.compases));
}

/** Dónde cae un compás (desde 0): índice de la sección y compás dentro de ella (desde 0). */
export function ubicar(secciones: readonly Seccion[], compas: number): { seccion: number; enSeccion: number } {
  const ini = inicios(secciones);
  for (let i = secciones.length - 1; i >= 0; i--) {
    if (compas >= ini[i]) return { seccion: i, enSeccion: compas - ini[i] };
  }
  return { seccion: 0, enSeccion: compas };
}

/**
 * Nombre de cada sección contando las repeticiones: A A B A → A1 A2 B A3.
 * Las letras que solo salen una vez quedan sin número.
 */
export function nombresSecciones(secciones: readonly Seccion[]): string[] {
  const total = new Map<string, number>();
  for (const s of secciones) total.set(s.letra, (total.get(s.letra) ?? 0) + 1);
  const vistas = new Map<string, number>();
  return secciones.map((s) => {
    const n = (vistas.get(s.letra) ?? 0) + 1;
    vistas.set(s.letra, n);
    return total.get(s.letra)! > 1 ? `${s.letra}${n}` : s.letra;
  });
}

/** Clase de color de una letra: la A siempre igual, la B otra… (A′ cuenta como A). */
export const indiceLetra = (letra: string) => Math.max(0, 'ABCD'.indexOf(letra[0]));

// --- De un cifrado del Repertorio a grados ---------------------------------------

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const SEMITONOS_MAYOR = [0, 2, 4, 5, 7, 9, 11];

/** Grado romano de una nota respecto a una tónica, con la grafía de la nota: (F, Eb) → bVII; (C, F#) → #IV. */
export function gradoRomano(tonica: string, nota: string): string {
  const t = parseNota(tonica);
  const n = parseNota(nota);
  const paso = (LETRAS.indexOf(n.letra) - LETRAS.indexOf(t.letra) + 7) % 7;
  let alteracion = (pitchClass(n) - pitchClass(t) - SEMITONOS_MAYOR[paso] + 24) % 12;
  if (alteracion > 6) alteracion -= 12;
  return (alteracion < 0 ? 'b'.repeat(-alteracion) : '#'.repeat(alteracion)) + ROMANOS[paso];
}

/** Calidad de reserva si el cifrado de la celda no está entre las de Progresiones. */
const RESERVA: Record<string, string> = { Major: 'maj7', Minor: 'm7', Dominant: '7', 'Half-Diminished': 'm7b5', Diminished: '°7' };

/**
 * Compases de un cifrado como acordes en grados respecto a `tonica`
 * (Eb7 en F → bVII7). La calidad sale de la forma de la celda (Fmaj7, Cm6, D7b9);
 * si Progresiones no la conoce (Eb7#11), se queda en la básica de su tipo (bVII7).
 */
export function compasesDeCifrado(cmb: Cmb, tonica: string): string[] {
  return cmb.bars.map((bar) =>
    bar.cells
      .filter((c) => !c.placeholder)
      .map((celda) => {
        const raiz = raizWeb(celda.root);
        const grado = gradoRomano(tonica, raiz);
        const forma = formaDeCelda(celda);
        const calidad = simboloCelda({ ...celda, showBass: false }, forma?.grados ?? []).slice(raiz.length);
        for (const sufijo of [calidad, RESERVA[celda.type] ?? 'maj7']) {
          try {
            return parseAcordeGrado(grado + sufijo).texto;
          } catch {
            // Se prueba la siguiente.
          }
        }
        return grado + 'maj7';
      })
      .join(' '),
  );
}
