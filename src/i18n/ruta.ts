// Textos de la Ruta de aprendizaje (components/paginas/ruta.astro). Las etapas y los pasos
// están en lib/ruta.ts.
import { textos } from './idiomas.ts';

export const RUTA = textos(
  {
    titulo: 'Ruta de aprendizaje',
    lema: 'Un orden para recorrer la web: {etapas} etapas y {pasos} pasos, de los cimientos al sonido moderno. Cada paso te lleva a una página y dice cuándo darlo por bueno. Márcalo como hecho aquí; el progreso se guarda en este navegador.',
    siguientePaso: 'Siguiente paso',
    etapas: 'Etapas',
    hecho: 'Hecho',
    loTienes: 'Lo tienes cuando:',
    empezarDeCero: 'Empezar de cero',
    seguro: '¿Seguro? Pulsa otra vez para borrar el progreso',
    progreso: '{n} de {total} pasos hechos',
    completa: 'Ruta completa. Vuelve a cualquier etapa para repasar, o empieza de cero.',
    pasoEtapa: 'Paso {paso} · Etapa {etapa}: {nombre}',
    irPagina: 'Ir a la página',
    marcarHecho: 'Marcar como hecho',
    verEnRuta: 'Ver en la ruta',
  },
  {
    titulo: 'Learning path',
    lema: 'An order to work through the site: {etapas} stages and {pasos} steps, from the foundations to the modern sound. Each step takes you to a page and says when you can call it done. Tick it off here; your progress is saved in this browser.',
    siguientePaso: 'Next step',
    etapas: 'Stages',
    hecho: 'Done',
    loTienes: 'You’ve got it when:',
    empezarDeCero: 'Start over',
    seguro: 'Sure? Press again to clear your progress',
    progreso: '{n} of {total} steps done',
    completa: 'Path complete. Go back to any stage to review, or start over.',
    pasoEtapa: 'Step {paso} · Stage {etapa}: {nombre}',
    irPagina: 'Go to the page',
    marcarHecho: 'Mark as done',
    verEnRuta: 'See it in the path',
  },
);
