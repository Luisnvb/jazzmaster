// Apuntes: notas propias (título y texto plano) y documentos del equipo (partituras,
// libros…), guardados en este navegador. Cada nota tiene su página
// (/apuntes/nota/?id=…). Notas y documentos se pueden marcar como favoritos: salen
// los primeros.
//
// Un documento puede tener una ruta del equipo (C:\…\partitura.pdf), que se copia
// para pegarla en el explorador (desde una web https el navegador no abre file://),
// y/o un archivo adjunto, que se guarda en el navegador (IndexedDB) y se abre con un clic.
// Las notas y los datos de los documentos van en localStorage; los archivos, en IndexedDB.
import { borrar, esc, guardarJSON, leerJSON } from './almacen.ts';

export interface Nota {
  id: string;
  titulo: string;
  texto: string;
  favorita: boolean;
  /** Fechas en milisegundos. */
  creada: number;
  editada: number;
}

export interface ArchivoAdjunto {
  nombre: string;
  tipo: string;
  tamano: number;
}

export interface Documento {
  id: string;
  titulo: string;
  /** Ruta en el equipo ('' si no se indicó). */
  ruta: string;
  /** Archivo guardado en el navegador (el contenido va en IndexedDB con el id del documento). */
  archivo?: ArchivoAdjunto;
  favorita: boolean;
  creada: number;
  editada: number;
}

const CLAVE_NOTAS = 'apuntes:notas';
const CLAVE_DOCUMENTOS = 'apuntes:documentos';

/** Id corto y único: 'n-lq3k9x-4f2a'. */
export const nuevoId = (prefijo: string) => `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Favoritos primero; dentro de cada grupo, lo editado más recientemente arriba. */
export function ordenar<T extends { favorita: boolean; editada: number }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => Number(b.favorita) - Number(a.favorita) || b.editada - a.editada);
}

/** Título que se enseña: el escrito o, si está vacío, el principio del texto. */
export function tituloDe(nota: Pick<Nota, 'titulo' | 'texto'>): string {
  const t = nota.titulo.trim();
  if (t) return t;
  const linea = nota.texto.trim().split('\n')[0] ?? '';
  return linea ? (linea.length > 40 ? `${linea.slice(0, 40)}…` : linea) : 'Sin título';
}

/** Tamaño legible: 2,4 MB. */
export function tamanoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} GB`;
}

/** Nombre del archivo de una ruta del equipo (C:\a\b.pdf o /a/b.pdf → b.pdf). */
export const nombreDeRuta = (ruta: string) => ruta.trim().replace(/^["']|["']$/g, '').split(/[\\/]/).pop() ?? '';

/** Quita las comillas que pone Windows al «Copiar como ruta de acceso». */
export const limpiarRuta = (ruta: string) => ruta.trim().replace(/^"(.*)"$/, '$1');

// --- Notas y documentos (localStorage) --------------------------------------------

export const leerNotas = (): Nota[] => leerJSON<Nota[]>(CLAVE_NOTAS) ?? [];
export const leerDocumentos = (): Documento[] => leerJSON<Documento[]>(CLAVE_DOCUMENTOS) ?? [];

const guardarLista = (clave: string, lista: unknown[]) => (lista.length ? guardarJSON(clave, lista) : (borrar(clave), true));
export const guardarNotas = (notas: Nota[]) => guardarLista(CLAVE_NOTAS, notas);
export const guardarDocumentos = (docs: Documento[]) => guardarLista(CLAVE_DOCUMENTOS, docs);

/** Cambia una nota (por id) y la guarda; devuelve la nota cambiada. */
export function cambiarNota(id: string, cambios: Partial<Omit<Nota, 'id'>>): Nota | undefined {
  const notas = leerNotas();
  const n = notas.find((x) => x.id === id);
  if (!n) return undefined;
  Object.assign(n, cambios);
  if (!('favorita' in cambios) || Object.keys(cambios).length > 1) n.editada = Date.now();
  guardarNotas(notas);
  return n;
}

// --- Índice de notas: enlaces a la página de cada una -----------------------------

/** Id del elemento de la lista de documentos, para enlazarlo con #… */
export const anclaDocumento = (id: string) => `documento-${id}`;

/**
 * Enlaces para la parte de arriba de las páginas de Apuntes: las notas favoritas, los
 * documentos favoritos (llevan a su tarjeta en la lista) y el resto de las notas.
 */
export function htmlIndiceNotas(
  notas: readonly Nota[],
  hrefNota: (id: string) => string,
  actual?: string,
  documentos: readonly Documento[] = [],
  hrefDocumento: (id: string) => string = (id) => `#${anclaDocumento(id)}`,
): string {
  const enlace = (clase: string, href: string, titulo: string, favorita: boolean, extra = '') =>
    `<a class="${clase}${favorita ? ' favorita' : ''}" href="${esc(href)}"${extra}>${favorita ? '★ ' : ''}${esc(titulo)}</a>`;
  const nota = (n: Nota) =>
    enlace('enlace-nota', hrefNota(n.id), tituloDe(n), n.favorita, `${n.id === actual ? ' aria-current="page"' : ''} data-enlace-nota="${esc(n.id)}"`);
  const doc = (d: Documento) =>
    enlace('enlace-nota enlace-documento', hrefDocumento(d.id), d.titulo, true, ` data-enlace-documento="${esc(d.id)}"`);
  const notasOrdenadas = ordenar(notas);
  return [
    ...notasOrdenadas.filter((n) => n.favorita).map(nota),
    ...ordenar(documentos.filter((d) => d.favorita)).map(doc),
    ...notasOrdenadas.filter((n) => !n.favorita).map(nota),
  ].join('');
}

// --- Archivos adjuntos (IndexedDB) ------------------------------------------------

const BD = 'jazzmaster-apuntes';
const ALMACEN = 'archivos';

function abrirBD(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(BD, 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(ALMACEN);
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error);
  });
}

async function operar<T>(modo: IDBTransactionMode, hacer: (almacen: IDBObjectStore) => IDBRequest): Promise<T> {
  const bd = await abrirBD();
  try {
    return await new Promise<T>((resolver, rechazar) => {
      const tx = bd.transaction(ALMACEN, modo);
      const peticion = hacer(tx.objectStore(ALMACEN));
      tx.oncomplete = () => resolver(peticion.result as T);
      tx.onerror = tx.onabort = () => rechazar(tx.error ?? peticion.error);
    });
  } finally {
    bd.close();
  }
}

export const guardarArchivo = (id: string, archivo: Blob) => operar<IDBValidKey>('readwrite', (a) => a.put(archivo, id));
export const leerArchivo = (id: string) => operar<Blob | undefined>('readonly', (a) => a.get(id));
export const borrarArchivo = (id: string) => operar<undefined>('readwrite', (a) => a.delete(id));

/**
 * Pide al navegador que no borre lo guardado aunque falte espacio. Devuelve si el
 * almacenamiento queda como persistente (null si el navegador no lo permite).
 */
export async function pedirPersistencia(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null;
  return (await navigator.storage.persisted()) || navigator.storage.persist();
}

/** Espacio usado y disponible para esta web, en bytes (null si no se puede saber). */
export async function espacio(): Promise<{ usado: number; cuota: number; persistente: boolean } | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usado: usage, cuota: quota, persistente: (await navigator.storage.persisted?.()) ?? false };
}

// --- Copia de seguridad -------------------------------------------------------------

export interface Copia {
  formato: 'jazzmaster-apuntes';
  version: 1;
  notas: Nota[];
  documentos: Documento[];
  /** Archivos adjuntos, por id de documento, como data: URL. */
  archivos: Record<string, string>;
}

const aDataURL = (blob: Blob) =>
  new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result as string);
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(blob);
  });

export async function crearCopia(): Promise<Copia> {
  const documentos = leerDocumentos();
  const archivos: Record<string, string> = {};
  for (const d of documentos) {
    if (!d.archivo) continue;
    const blob = await leerArchivo(d.id);
    if (blob) archivos[d.id] = await aDataURL(blob);
  }
  return { formato: 'jazzmaster-apuntes', version: 1, notas: leerNotas(), documentos, archivos };
}

/** Comprueba que un JSON es una copia de apuntes; lanza un error con el motivo si no. */
export function validarCopia(datos: unknown): Copia {
  const c = datos as Partial<Copia> | null;
  if (!c || c.formato !== 'jazzmaster-apuntes') throw new Error('El archivo no es una copia de los apuntes.');
  if (!Array.isArray(c.notas) || !Array.isArray(c.documentos)) throw new Error('A la copia le faltan las notas o los documentos.');
  const bien = (x: unknown) => typeof x === 'object' && x !== null && typeof (x as { id?: unknown }).id === 'string';
  if (!c.notas.every(bien) || !c.documentos.every(bien)) throw new Error('La copia tiene notas o documentos sin id.');
  return { formato: 'jazzmaster-apuntes', version: 1, notas: c.notas, documentos: c.documentos, archivos: c.archivos ?? {} };
}

/** Junta dos listas por id: lo de `entrantes` sustituye a lo que tenga el mismo id. */
export function juntarPorId<T extends { id: string }>(actuales: readonly T[], entrantes: readonly T[]): T[] {
  const ids = new Set(entrantes.map((x) => x.id));
  return [...actuales.filter((x) => !ids.has(x.id)), ...entrantes];
}

/** Recupera una copia: añade sus notas, documentos y archivos (los del mismo id se sustituyen). */
export async function recuperarCopia(copia: Copia): Promise<{ notas: number; documentos: number }> {
  for (const [id, url] of Object.entries(copia.archivos)) {
    await guardarArchivo(id, await (await fetch(url)).blob());
  }
  guardarNotas(juntarPorId(leerNotas(), copia.notas));
  guardarDocumentos(juntarPorId(leerDocumentos(), copia.documentos));
  return { notas: copia.notas.length, documentos: copia.documentos.length };
}

// --- Botones de borrar: piden una segunda pulsación ---------------------------------

/** El botón pide «¿Seguro?» la primera vez y ejecuta `accion` si se vuelve a pulsar en 4 s. */
export function conConfirmacion(boton: HTMLButtonElement, accion: () => void, pregunta = '¿Seguro? Pulsa otra vez') {
  const original = boton.textContent;
  let espera: number | undefined;
  boton.addEventListener('click', () => {
    if (espera === undefined) {
      boton.textContent = pregunta;
      espera = window.setTimeout(() => {
        boton.textContent = original;
        espera = undefined;
      }, 4000);
      return;
    }
    clearTimeout(espera);
    espera = undefined;
    boton.textContent = original;
    accion();
  });
}
