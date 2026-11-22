// Textos comunes de la interfaz (cabecera, menús, portada) y de las herramientas
// (botones de audio, sonido…), en los dos idiomas.
import { textos } from './idiomas.ts';

export const INTERFAZ = textos(
  {
    inicio: 'Inicio',
    menu: 'Menú',
    menuSecciones: 'Menú de secciones',
    secciones: 'Secciones',
    favorita: 'Página favorita: {nombre}',
    marcarFavorita: 'Marcar como favorita: sale la primera en el menú de su sección y en la portada',
    quitarFavorita: 'Quitar de favoritas',
    soloEspanol: 'Solo en español',
    cambiarIdioma: 'English',
    cambiarIdiomaTitulo: 'Read this page in English',
    otroIdioma: 'en',
    // Portada
    registrar: '▶ Registrar práctica',
    actividad: 'Actividad: {actividad}',
    cambiarActividad: 'Cambiar la actividad en el Registro de práctica',
    pausar: '❚❚ Pausar',
    seguir: '▶ Seguir',
    terminar: '■ Terminar',
    guardada: 'Guardada: {duracion}.',
    noGuardada: 'No se ha podido guardar.',
    muyCorta: 'Menos de 5 s: no se guarda.',
    registroPractica: 'Registro de práctica',
    otra: 'Otra',
    // Comunes de las herramientas
    sonido: 'Sonido',
    detener: '■ Detener',
    copiado: 'Copiado.',
    noCopiado: 'No se ha podido copiar: selecciona el texto a mano.',
    noGuardado: 'No se ha podido guardar (¿almacenamiento lleno o modo privado?).',
    seguro: '¿Seguro? Pulsa otra vez',
  },
  {
    inicio: 'Home',
    menu: 'Menu',
    menuSecciones: 'Sections menu',
    secciones: 'Sections',
    favorita: 'Favourite page: {nombre}',
    marcarFavorita: 'Mark as favourite: it comes first in its section menu and on the home page',
    quitarFavorita: 'Remove from favourites',
    soloEspanol: 'Spanish only',
    cambiarIdioma: 'Español',
    cambiarIdiomaTitulo: 'Leer esta página en español',
    otroIdioma: 'es',
    registrar: '▶ Log practice',
    actividad: 'Activity: {actividad}',
    cambiarActividad: 'Change the activity in the Practice log',
    pausar: '❚❚ Pause',
    seguir: '▶ Resume',
    terminar: '■ Finish',
    guardada: 'Saved: {duracion}.',
    noGuardada: 'Could not save.',
    muyCorta: 'Under 5 s: not saved.',
    registroPractica: 'Practice log',
    otra: 'Other',
    sonido: 'Sound',
    detener: '■ Stop',
    copiado: 'Copied.',
    noCopiado: 'Could not copy: select the text by hand.',
    noGuardado: 'Could not save (storage full or private mode?).',
    seguro: 'Sure? Press again',
  },
);

/** Nombres de los sonidos (lib/audio.ts INSTRUMENTOS) en inglés. */
export const INSTRUMENTOS_EN: Record<string, string> = {
  guitarra: 'Jazz guitar',
  piano: 'Electric piano',
  organo: 'Soft organ',
  'organo-jazz': 'Jazz organ',
  armonio: 'Harmonium',
  cuerdas: 'Strings',
  coro: 'Choir',
  flauta: 'Flute',
  pad: 'Pad',
  'pad-calido': 'Warm pad',
};

/** Nombre de un sonido de lib/audio.ts en un idioma. */
export const nombreSonido = (i: { id: string; nombre: string }, idioma: 'es' | 'en') => (idioma === 'en' ? (INSTRUMENTOS_EN[i.id] ?? i.nombre) : i.nombre);
