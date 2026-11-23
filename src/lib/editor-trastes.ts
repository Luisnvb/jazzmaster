// Editor de trastes por cuerda con vista previa del diagrama. Lo usan el editor
// de voicings (Acordes) y el de formas a mano del cifrado (Repertorio).
import { esc } from './almacen.ts';
import { diagramaSVG } from './diagrama.ts';
import { CUERDAS, type Traste } from './voicings.ts';

export interface OpcionesEditorTrastes {
  trastes: Traste[];
  grados: string[];
  /** Si se pueden escribir los grados a mano (si no, solo se muestran). */
  gradosEditables: boolean;
  /** Grados que corresponden a unos trastes (se rellenan al cambiar un traste). */
  calcularGrados: (trastes: Traste[]) => string[];
  alCambiar?: (trastes: Traste[], grados: string[]) => void;
  /** Idioma de las etiquetas (por defecto, español). */
  idioma?: 'es' | 'en';
}

const TEXTOS = {
  es: { cuerda: (c: number) => `${c}ª`, traste: (n: string) => `Traste de la ${n} cuerda`, grado: (n: string) => `Grado de la ${n} cuerda`, elige: 'Elige trastes' },
  en: {
    cuerda: (c: number) => `${c}${['', 'st', 'nd', 'rd'][c] ?? 'th'}`,
    traste: (n: string) => `Fret on the ${n} string`,
    grado: (n: string) => `Degree on the ${n} string`,
    elige: 'Choose frets',
  },
};

export interface EditorTrastes {
  valor(): { trastes: Traste[]; grados: string[] };
  /** Recalcula todos los grados (p. ej. al cambiar la tónica). */
  recalcular(): void;
}

const TRASTES: Traste[] = ['x', ...Array.from({ length: 21 }, (_, i) => i)];

export function editorTrastes(contenedor: HTMLElement, op: OpcionesEditorTrastes): EditorTrastes {
  let trastes = [...op.trastes];
  let grados = [...op.grados];
  const T = TEXTOS[op.idioma ?? 'es'];

  contenedor.innerHTML = `
    <div class="et">
      <div class="et-diagrama" data-et-diagrama></div>
      <div class="et-cuerdas">
        ${CUERDAS.map((_, c) => T.cuerda(6 - c)).map(
          (nombre, c) => `
          <label class="et-cuerda">
            <span>${nombre}</span>
            <select data-et-traste="${c}" aria-label="${T.traste(nombre)}">
              ${TRASTES.map((t) => `<option value="${t}">${t === 'x' ? '×' : t}</option>`).join('')}
            </select>
            <input data-et-grado="${c}" aria-label="${T.grado(nombre)}" autocomplete="off" spellcheck="false" ${op.gradosEditables ? '' : 'readonly tabindex="-1"'} />
          </label>`,
        ).join('')}
      </div>
    </div>`;

  const selects = [...contenedor.querySelectorAll<HTMLSelectElement>('[data-et-traste]')];
  const entradas = [...contenedor.querySelectorAll<HTMLInputElement>('[data-et-grado]')];
  const diagrama = contenedor.querySelector<HTMLElement>('[data-et-diagrama]')!;

  const pintar = () => {
    selects.forEach((s, c) => (s.value = String(trastes[c])));
    entradas.forEach((e, c) => {
      e.value = grados[c] ?? '';
      e.disabled = trastes[c] === 'x';
    });
    diagrama.innerHTML = trastes.some((t) => t !== 'x') ? diagramaSVG({ trastes, grados }) : `<p class="suave">${esc(T.elige)}</p>`;
  };
  const avisar = () => op.alCambiar?.([...trastes], [...grados]);

  contenedor.addEventListener('change', (e) => {
    const el = e.target as HTMLElement;
    if (el instanceof HTMLSelectElement && el.dataset.etTraste) {
      const c = Number(el.dataset.etTraste);
      trastes[c] = el.value === 'x' ? 'x' : Number(el.value);
      const calculados = op.calcularGrados(trastes);
      grados[c] = calculados[c];
      if (!op.gradosEditables) grados = calculados;
      pintar();
      avisar();
    }
  });
  contenedor.addEventListener('input', (e) => {
    const el = e.target as HTMLElement;
    if (el instanceof HTMLInputElement && el.dataset.etGrado) {
      grados[Number(el.dataset.etGrado)] = el.value.trim();
      diagrama.innerHTML = diagramaSVG({ trastes, grados });
      avisar();
    }
  });

  pintar();
  return {
    valor: () => ({ trastes: [...trastes], grados: [...grados] }),
    recalcular() {
      grados = op.calcularGrados(trastes);
      pintar();
      avisar();
    },
  };
}
