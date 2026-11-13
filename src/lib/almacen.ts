// Guardado en el navegador (localStorage) y archivos que entran o salen.
// Las ediciones hechas en la web viven en este navegador; para llevarlas al
// repositorio (o a otro dispositivo) se exportan como archivo.

export function leerJSON<T>(clave: string): T | null {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? null : (JSON.parse(texto) as T);
  } catch {
    return null;
  }
}

/** Devuelve false si no se pudo guardar (modo privado, almacenamiento lleno…). */
export function guardarJSON(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function borrar(clave: string) {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Nada que borrar.
  }
}

/** Claves guardadas que empiezan por un prefijo. */
export function claves(prefijo: string): string[] {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(prefijo));
  } catch {
    return [];
  }
}

/** Ofrece un archivo para descargar. */
export function descargar(nombre: string, contenido: string, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Abre el selector de archivos y devuelve el texto del elegido (null si se cancela). */
export function elegirArchivo(aceptar: string): Promise<{ nombre: string; texto: string } | null> {
  return new Promise((resolver) => {
    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = aceptar;
    entrada.addEventListener('change', async () => {
      const archivo = entrada.files?.[0];
      resolver(archivo ? { nombre: archivo.name, texto: await archivo.text() } : null);
    });
    entrada.addEventListener('cancel', () => resolver(null));
    entrada.click();
  });
}

/** Escapa texto para meterlo en HTML. */
export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
