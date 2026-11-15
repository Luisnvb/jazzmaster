// Ficha de canción tal como la maneja la web, y su paso al formato .cmb.json.
// En el repositorio una canción es un .md (ficha y letra) y, opcionalmente,
// un .cmb.json con el mismo nombre (el cifrado). Al exportar se junta todo en
// un .cmb.json: la ficha va en los campos del Builder (title, composer, tempoBpm,
// style) y lo demás en "practica", que el Builder ignora.
import { guardarJSON, leerJSON } from './almacen.ts';
import { clonar, compasDeTexto, validarCmb, type Cmb } from './cmb.ts';

export interface Cancion {
  id: string;
  titulo: string;
  autor: string;
  instrumental: boolean;
  tonalidad: string | null;
  tempo: number | null;
  compas: string | null;
  estructura: string | null;
  estilo: string | null;
  enlaces: { grabacion?: string; partitura?: string };
  notas: string | null;
  letra: string;
  cifrado: Cmb | null;
  /** Ayudas para improvisar (solo se escriben en el .md; en el navegador se ven, no se editan). */
  improvisacion?: Improvisacion | null;
}

/** Escala sugerida para un tramo, ya resuelta (nombre, notas y grupo de arpegio para el enlace). */
export interface EscalaImpro {
  tonica: string;
  nombre: string;
  grupo: string;
  notas: string[];
}

export interface TramoImpro {
  compases: string;
  acorde: string;
  escalas: EscalaImpro[];
  guia: string | null;
  consejo: string | null;
}

export interface Improvisacion {
  enfoque: string | null;
  tramos: TramoImpro[];
  estrategias: { titulo: string; texto: string }[];
  ejercicios: string[];
  /** Páginas de Estudio relacionadas. */
  estudio?: { nombre: string; href: string; lema: string }[];
}

export function cancionVacia(id: string, titulo = 'Canción nueva'): Cancion {
  return {
    id,
    titulo,
    autor: '',
    instrumental: false,
    tonalidad: null,
    tempo: null,
    compas: null,
    estructura: null,
    estilo: null,
    enlaces: {},
    notas: null,
    letra: '',
    cifrado: null,
  };
}

const texto = (x: unknown) => (typeof x === 'string' && x.trim() ? x : null);

/** Junta ficha y cifrado en un .cmb.json para exportar. */
export function cancionACmb(c: Cancion, base: Cmb): Cmb {
  const cmb = clonar(c.cifrado ?? base);
  cmb.title = c.titulo;
  cmb.composer = c.autor;
  if (c.tempo) cmb.tempoBpm = c.tempo;
  if (c.estilo !== null) cmb.style = c.estilo;
  if (c.compas && compasDeTexto(c.compas)) cmb.timeSigLabel = c.compas;
  cmb.practica = {
    tonalidad: c.tonalidad,
    compas: c.compas,
    estructura: c.estructura,
    instrumental: c.instrumental,
    letra: c.letra,
    notas: c.notas,
    enlaces: c.enlaces,
    ...(c.improvisacion ? { improvisacion: c.improvisacion } : {}),
  };
  return cmb;
}

/**
 * Lee un .cmb.json. Si `anterior` existe (se importa sobre una canción que ya
 * está en la web), se conserva su ficha en lo que el archivo no traiga.
 */
export function cmbACancion(datos: unknown, id: string, anterior?: Cancion): Cancion {
  const cmb = validarCmb(datos);
  const extra = cmb.practica ?? {};
  const previa = anterior ?? cancionVacia(id, '');
  const { practica: _, ...cifrado } = cmb;
  return {
    ...previa,
    id,
    titulo: texto(cmb.title) ?? (previa.titulo || 'Sin título'),
    autor: texto(cmb.composer) ?? previa.autor,
    tempo: typeof cmb.tempoBpm === 'number' && cmb.tempoBpm > 0 ? cmb.tempoBpm : previa.tempo,
    estilo: texto(cmb.style) ?? previa.estilo,
    tonalidad: extra.tonalidad !== undefined ? extra.tonalidad : previa.tonalidad,
    compas: extra.compas !== undefined ? extra.compas : (texto(cmb.timeSigLabel) ?? previa.compas),
    estructura: extra.estructura !== undefined ? extra.estructura : previa.estructura,
    instrumental: extra.instrumental ?? previa.instrumental,
    letra: extra.letra ?? previa.letra,
    notas: extra.notas !== undefined ? extra.notas : previa.notas,
    enlaces: extra.enlaces ?? previa.enlaces,
    improvisacion: extra.improvisacion ?? previa.improvisacion ?? null,
    cifrado: cifrado as Cmb,
  };
}

/** Nombre de archivo para exportar: "How Insensitive" → "how-insensitive.cmb.json". */
export function nombreArchivo(c: Cancion): string {
  const base = c.titulo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || c.id}.cmb.json`;
}

// --- Guardado en este navegador ---------------------------------------------------

/** Clave de localStorage de una canción. */
export const claveCancion = (id: string) => `cancion:${id}`;

/** Crea una canción vacía en este navegador y devuelve su id. */
export function crearCancionLocal(cancion?: Cancion): string {
  const id = `local-${Date.now().toString(36)}`;
  guardarJSON(claveCancion(id), { ...(cancion ?? cancionVacia(id)), id });
  return id;
}

/** Canciones guardadas en este navegador (nuevas y modificadas). */
export function cancionesGuardadas(): Cancion[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith('cancion:'))
      .map((k) => leerJSON<Cancion>(k))
      .filter((c): c is Cancion => Boolean(c?.id));
  } catch {
    return [];
  }
}
