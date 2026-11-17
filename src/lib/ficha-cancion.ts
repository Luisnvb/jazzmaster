// Ficha de canción en el navegador: vista, edición del cifrado (formato
// .cmb.json) y de la ficha, guardado local, exportación e importación.
import { aplicarCambios, type Cambios, type Voicing } from './acordes-datos.ts';
import { borrar, descargar, elegirArchivo, esc, guardarJSON, leerJSON } from './almacen.ts';
import { eliminar } from './eliminados.ts';
import { cancionACmb, claveCancion as clave, cmbACancion, nombreArchivo, type Cancion } from './cancion.ts';
import { analizarCelda, htmlCifrado, secuenciaAcorde, secuenciaCifrado, tiemposCifrado } from './cifrado-vista.ts';
import { conectarAudio } from './cliente.ts';
import { favoritos } from './favoritos.ts';
import { INSTRUMENTOS, SOSTENIDOS, type Instrumento } from './audio.ts';
import {
  clonar,
  cmbNuevo,
  compasDeTexto,
  compasVacio,
  lineas,
  mismaNota,
  NOMBRE_TIPO,
  nuevoId,
  preferidosDeTipo,
  raices,
  raizCmb,
  raizWeb,
  TIPO_DE_GRUPO,
  TIPOS,
  gradoCmb,
  type CeldaCmb,
  type Cmb,
} from './cmb.ts';
import { diagramaSVG } from './diagrama.ts';
import { editorTrastes } from './editor-trastes.ts';
import { catalogoFormas, gradoSuperior, gradosDeTrastes, notasSuperiores, trastesDeGrados, type Forma, type GradosCuerdas } from './formas.ts';
import { ruta } from './rutas.ts';
import { DESDE_GRUPO, enlaceArpegios, enlaceCapas } from './enlaces.ts';

interface Datos {
  cancion: Cancion | null;
  grupos: Record<string, string>;
  voicings: Voicing[];
}

const COMPASES = ['', '2/4', '3/4', '4/4', '5/4', '6/4', '3/8', '6/8', '7/8', '9/8', '12/8'];
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

export function iniciarFicha() {
  const datos: Datos = JSON.parse($('#datos-ficha').textContent!);
  const base = datos.cancion;
  const id = base?.id ?? new URLSearchParams(location.search).get('id') ?? '';
  const guardada = leerJSON<Cancion>(clave(id));

  if (!base && !guardada) {
    $('[data-cabecera]').innerHTML = '<h1>Canción no encontrada</h1><p class="suave">No está guardada en este navegador.</p>';
    return;
  }

  let cancion: Cancion = guardada ?? clonar(base!);
  let editando = false;
  let seleccion: { compas: number; celda: number } | null = null;
  let manual = false; // editor de trastes a mano abierto
  const historial: string[] = [];
  let ultimo = JSON.stringify(cancion);
  let diagramas = leerJSON<boolean>('repertorio:diagramas') ?? true;

  // Voicings personales (con las ediciones de la sección Acordes) como formas para el cifrado.
  const voicings = aplicarCambios(datos.voicings, leerJSON<Cambios>('acordes:cambios') ?? {});
  const personales: Record<string, Forma[]> = {};
  for (const v of voicings) {
    const tipo = TIPO_DE_GRUPO[v.grupo];
    if (!tipo || v.trastes.includes(0)) continue;
    (personales[tipo] ??= []).push({ grados: v.grados.map((g) => g || null), personal: true, nombre: v.nombre });
  }
  // El enlace va a Voicings, donde no salen los de cuerdas al aire (tienen su propia página).
  const gruposConVoicings = new Set(voicings.filter((v) => !v.trastes.includes(0)).map((v) => v.grupo));

  const cabecera = $('[data-cabecera]');
  const barra = $('[data-barra]');
  const aviso = $('[data-aviso]');
  const meta = $<HTMLFormElement>('[data-meta]');
  const zonaCifrado = $('[data-cifrado]');
  const panel = $('[data-panel]');
  const resto = $('[data-resto]');
  const fichaAbajo = $('[data-ficha-abajo]');
  const zonaImpro = $('[data-improvisacion]');

  // --- Controles de audio del cifrado -------------------------------------------
  // Sonido y metrónomo se recuerdan en este navegador; el tempo elegido vale para
  // esta visita (por defecto, el de la ficha) y no cambia la canción.
  const controlesAudio = $('[data-controles-audio]');
  const selInstrumento = $<HTMLSelectElement>('[data-instrumento]');
  const casillaMetronomo = $<HTMLInputElement>('[data-metronomo]');
  const controlTempo = $<HTMLInputElement>('[data-tempo-ficha]');
  const valorTempo = $('[data-tempo-ficha-valor]');
  const botonTempoOriginal = $<HTMLButtonElement>('[data-tempo-original]');
  const botonBucle = $<HTMLButtonElement>('[data-bucle]');
  const enBucle = () => botonBucle.getAttribute('aria-pressed') === 'true';
  botonBucle.addEventListener('click', () => botonBucle.setAttribute('aria-pressed', String(!enBucle())));
  const sonido = leerJSON<{ instrumento?: Instrumento; metronomo?: boolean }>('repertorio:sonido') ?? {};
  if (INSTRUMENTOS.some((i) => i.id === sonido.instrumento)) selInstrumento.value = sonido.instrumento!;
  casillaMetronomo.checked = sonido.metronomo === true;
  const instrumento = () => selInstrumento.value as Instrumento;
  const guardarSonido = () => guardarJSON('repertorio:sonido', { instrumento: instrumento(), metronomo: casillaMetronomo.checked });
  selInstrumento.addEventListener('change', guardarSonido);
  casillaMetronomo.addEventListener('change', guardarSonido);

  let tempoElegido: number | null = null;
  const favs = favoritos('repertorio');
  const tempoFicha = () => cancion.tempo ?? cmb()?.tempoBpm ?? 100;
  const tempoActual = () => tempoElegido ?? tempoFicha();
  function mostrarTempo() {
    controlTempo.value = String(tempoActual());
    valorTempo.textContent = String(tempoActual());
    botonTempoOriginal.hidden = tempoElegido === null || tempoElegido === tempoFicha();
  }
  controlTempo.addEventListener('input', () => {
    tempoElegido = Number(controlTempo.value);
    mostrarTempo();
  });
  botonTempoOriginal.addEventListener('click', () => {
    tempoElegido = null;
    mostrarTempo();
  });

  // --- Guardado e historial ---------------------------------------------------

  /** Guarda en este navegador (si es del repositorio y no difiere, borra la copia). */
  function persistir() {
    if (base && JSON.stringify(cancion) === JSON.stringify(base)) borrar(clave(id));
    else if (!guardarJSON(clave(id), cancion)) {
      aviso.hidden = false;
      aviso.textContent = 'No se ha podido guardar en este navegador (¿modo privado?). Exporta para no perder los cambios.';
    }
  }

  /** Aplica un cambio: guarda el estado anterior para deshacer, guarda y repinta. */
  function cambiar(fn: () => void, repintarMeta = false) {
    fn();
    const ahora = JSON.stringify(cancion);
    if (ahora === ultimo) return pintar();
    historial.push(ultimo);
    if (historial.length > 100) historial.shift();
    ultimo = ahora;
    persistir();
    if (repintarMeta) pintarMeta();
    pintar();
  }

  function deshacer() {
    const anterior = historial.pop();
    if (!anterior) return;
    cancion = JSON.parse(anterior);
    ultimo = anterior;
    persistir();
    if (seleccion && !celdaSel()) seleccion = null;
    pintarMeta();
    pintar();
  }

  // --- Acceso al cifrado ------------------------------------------------------

  const cmb = () => cancion.cifrado;
  const compasSel = () => (seleccion ? cmb()?.bars[seleccion.compas] : undefined);
  const celdaSel = () => (seleccion ? compasSel()?.cells[seleccion.celda] : undefined);
  const catalogo = (tipo: string) => catalogoFormas(tipo, personales[tipo] ?? []);
  const claveForma = (g: GradosCuerdas) => g.map((x) => x ?? '-').join(' ');

  /** Pone una forma (por grados) en una celda y quita los trastes a mano. */
  function fijarForma(celda: CeldaCmb, grados: GradosCuerdas, indice: number, posicion = 0) {
    delete celda.editFrets;
    const arriba = gradoSuperior(grados);
    celda.vf = { v: grados.map((g) => (g ? gradoCmb(g) : null)), p: posicion };
    celda.interval = arriba ? gradoCmb(arriba) : null;
    celda.comboIndex = indice;
    celda.placeholder = false;
  }

  /** Grados actuales de una celda (de 6ª a 1ª, null = apagada). */
  function gradosCelda(celda: CeldaCmb): GradosCuerdas {
    const forma = analizarCelda(celda, cmb()!, personales).forma;
    return forma ? forma.grados.map((g) => g || null) : [null, null, null, null, null, null];
  }

  /** Celda nueva igual que otra (mismo acorde y forma), con id propio. */
  function copiaCelda(c: CeldaCmb): CeldaCmb {
    return { ...clonar(c), id: nuevoId(cmb()!) };
  }

  // --- Pintado ----------------------------------------------------------------

  function pintarCabecera() {
    const ficha = [
      ['Tonalidad', cancion.tonalidad],
      ['Tempo', cancion.tempo && `${cancion.tempo} BPM`],
      ['Compás', cancion.compas],
      ['Estructura', cancion.estructura],
      ['Estilo', cancion.estilo],
    ].filter((p) => p[1]);
    const lista = ficha.map(([n, v]) => `<div><dt>${n}</dt><dd>${esc(v)}</dd></div>`).join('');
    document.title = `${cancion.titulo} · JazzMaster`;
    cabecera.innerHTML = `
      <h1>${esc(cancion.titulo)}</h1>
      <p class="autor suave">${esc(cancion.autor)}${cancion.instrumental ? ' · Instrumental' : ''}</p>
      ${ficha.length ? `<dl class="ficha ficha-arriba">${lista}</dl>` : ''}`;
    // En el móvil, la ficha va al final para que el cifrado quede arriba.
    fichaAbajo.innerHTML = ficha.length ? `<dl class="ficha">${lista}</dl>` : '';
  }

  function pintarBarra() {
    controlesAudio.hidden = editando || !cmb()?.bars.length;
    mostrarTempo();
    const local = !base;
    const modificada = base && JSON.stringify(cancion) !== JSON.stringify(base);
    barra.innerHTML = editando
      ? `<button type="button" class="boton principal" data-accion="terminar">Terminar</button>
         <button type="button" class="boton" data-accion="deshacer" ${historial.length ? '' : 'disabled'}>Deshacer</button>
         <button type="button" class="boton" data-accion="exportar">Exportar .cmb.json</button>
         <button type="button" class="boton" data-accion="importar">Importar</button>
         ${modificada ? '<button type="button" class="boton peligro" data-accion="restaurar">Descartar cambios</button>' : ''}
         ${local ? '<button type="button" class="boton peligro" data-accion="eliminar">Borrar canción</button>' : ''}`
      : `<button type="button" class="boton" data-accion="favorito" aria-pressed="${favs.tiene(id)}" title="Las favoritas salen primero en el Repertorio">${favs.tiene(id) ? '★' : '☆'} Favorita</button>
         <button type="button" class="boton" data-accion="editar">Editar</button>
         ${cmb()?.bars.length ? `<button type="button" class="boton" data-audio="cifrado" aria-pressed="false">▶ Tocar</button>
            <button type="button" class="boton detener" data-detener>■ Detener</button>` : ''}
         ${cmb()?.bars.length ? `<button type="button" class="boton" data-accion="diagramas" aria-pressed="${diagramas}">Diagramas</button>` : ''}
         <button type="button" class="boton peligro" data-accion="${local ? 'eliminar' : 'eliminar-repositorio'}">Eliminar</button>`;
    aviso.hidden = !(local || modificada);
    aviso.textContent = local
      ? 'Canción guardada solo en este navegador. Expórtala para llevarla al repositorio u otro dispositivo.'
      : 'Con cambios guardados en este navegador. Para llevarlos al repositorio, exporta el cifrado como ' +
        `src/content/repertorio/${id}.cmb.json (y la ficha y la letra al .md, o déjalas dentro del .cmb.json).`;
  }

  function pintarCifrado() {
    const c = cmb();
    if (!c || c.bars.length === 0) {
      zonaCifrado.innerHTML = editando
        ? '<p class="suave">Sin cifrado todavía.</p><button type="button" class="boton principal" data-accion="crear-cifrado">Crear cifrado</button>'
        : '<p class="suave">Sin cifrado todavía.</p>';
      return;
    }
    zonaCifrado.innerHTML = htmlCifrado(c, { diagramas: diagramas || editando, editando, seleccion, personales });
  }

  function pintarResto() {
    const parrafos = cancion.letra.trim() ? cancion.letra.trim().split(/\n\s*\n/) : [];
    const partes: string[] = [];
    if (!cancion.instrumental && parrafos.length) {
      partes.push(`<h2>Letra</h2><div class="letra">${parrafos.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`);
    }
    const { grabacion, partitura } = cancion.enlaces;
    if (grabacion || partitura) {
      partes.push(
        `<h2>Enlaces</h2><ul class="enlaces">${grabacion ? `<li><a href="${esc(grabacion)}" target="_blank" rel="noopener noreferrer">Grabación de referencia</a></li>` : ''}${
          partitura ? `<li><a href="${esc(partitura)}" target="_blank" rel="noopener noreferrer">Partitura / tablatura</a></li>` : ''
        }</ul>`,
      );
    }
    if (cancion.notas) partes.push(`<h2>Notas de práctica</h2><p class="notas">${esc(cancion.notas)}</p>`);
    resto.innerHTML = partes.join('');
    // Sin letra, el cifrado se centra y lo demás (enlaces, notas) va debajo.
    resto.parentElement!.classList.toggle('sin-letra', cancion.instrumental || parrafos.length === 0);
  }

  /** Texto escapado con **negrita** permitida. */
  const conNegrita = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  /** Ayudas para improvisar. No se editan en el navegador: si la copia guardada no las trae, valen las del repositorio. */
  function pintarImprovisacion() {
    const impro = cancion.improvisacion ?? base?.improvisacion ?? null;
    zonaImpro.hidden = !impro;
    if (!impro) return;
    const enlaceEscala = (e: { tonica: string; grupo: string }) =>
      `${ruta('escalas')}?tonica=${encodeURIComponent(e.tonica)}#grupo-${e.grupo}`;
    const tramos = impro.tramos
      .map(
        (t) => `<li class="impro-tramo">
          <div class="impro-cabeza"><span class="impro-acorde">${esc(t.acorde)}</span><span class="impro-compases">${esc(t.compases)}</span></div>
          ${
            t.escalas.length
              ? `<ul class="impro-escalas">${t.escalas
                  .map(
                    (e) =>
                      `<li><a href="${esc(enlaceEscala(e))}">${esc(e.tonica)} ${esc(e.nombre.toLowerCase())}</a><span class="impro-notas">${e.notas.map(esc).join(' ')}</span></li>`,
                  )
                  .join('')}</ul>`
              : ''
          }
          ${t.guia ? `<p class="impro-guia"><span>Notas guía</span>${conNegrita(t.guia)}</p>` : ''}
          ${t.consejo ? `<p class="impro-consejo">${conNegrita(t.consejo)}</p>` : ''}
        </li>`,
      )
      .join('');
    zonaImpro.innerHTML = `<h2>Improvisación</h2>
      ${impro.enfoque ? `<p class="impro-enfoque">${conNegrita(impro.enfoque)}</p>` : ''}
      ${tramos ? `<h3>Acorde a acorde</h3><ul class="impro-tramos">${tramos}</ul>` : ''}
      ${
        impro.estrategias.length
          ? `<h3>Estrategias</h3><ul class="impro-estrategias">${impro.estrategias
              .map((e) => `<li class="impro-estrategia"><h4>${esc(e.titulo)}</h4><p>${conNegrita(e.texto)}</p></li>`)
              .join('')}</ul>`
          : ''
      }
      ${
        impro.ejercicios.length
          ? `<h3>Para practicar</h3><ol class="impro-ejercicios">${impro.ejercicios.map((x) => `<li>${conNegrita(x)}</li>`).join('')}</ol>`
          : ''
      }
      ${
        impro.estudio?.length
          ? `<h3>Para profundizar</h3><ul class="impro-estudio">${impro.estudio
              .map((p) => `<li><a href="${esc(p.href)}">${esc(p.nombre)}</a> <span class="suave">${esc(p.lema)}</span></li>`)
              .join('')}</ul>`
          : ''
      }`;
  }

  function pintarPanel() {
    const celda = celdaSel();
    const compas = compasSel();
    if (!editando || !celda || !compas || !seleccion) {
      panel.hidden = true;
      return;
    }
    const c = cmb()!;
    const { compas: i, celda: j } = seleccion;
    const { forma, simbolo } = analizarCelda(celda, c, personales);
    const grados = gradosCelda(celda);
    const formas = catalogo(celda.type);
    const arriba = gradoSuperior(grados);
    const conNota = formas.filter((f) => gradoSuperior(f.grados) === arriba);
    const pos = conNota.findIndex((f) => claveForma(f.grados) === claveForma(grados));
    const aMano = Boolean(celda.editFrets);
    // Las doce raíces, respetando cómo está escrita la del acorde (C# aunque el cifrado prefiera bemoles).
    const raizActual = raizWeb(celda.root);
    const listaRaices = raices(c.spellingPreference).map((r) => (mismaNota(r, raizActual) ? raizActual : r));
    const total = c.bars.length;

    panel.hidden = false;
    panel.innerHTML = `
      <div class="cabeza">
        <button type="button" class="boton" data-accion="anterior" aria-label="Acorde anterior" ${i === 0 && j === 0 ? 'disabled' : ''}>◀</button>
        <h3>Compás ${i + 1} de ${total}${compas.cells.length > 1 ? ` · acorde ${j + 1}` : ''}</h3>
        <button type="button" class="boton" data-accion="siguiente" aria-label="Acorde siguiente" ${i === total - 1 && j === compas.cells.length - 1 ? 'disabled' : ''}>▶</button>
        <button type="button" class="boton" data-accion="cerrar" aria-label="Cerrar">✕</button>
      </div>
      <div class="vista">
        <div>${forma ? diagramaSVG({ trastes: forma.trastes, grados: forma.grados }) : ''}</div>
        <div>
          <p class="simbolo-grande">${esc(simbolo)}</p>
          <div class="fila">
            <label>Raíz <select data-campo="raiz">${listaRaices
              .map((r) => `<option ${r === raizActual ? 'selected' : ''}>${r}</option>`)
              .join('')}</select></label>
            <label>Calidad <select data-campo="tipo">${TIPOS.map(
              (t) => `<option value="${t}" ${t === celda.type ? 'selected' : ''}>${NOMBRE_TIPO[t]}</option>`,
            ).join('')}</select></label>
          </div>
          <div class="fila">
            <span class="paso" title="Nota de la melodía (la más aguda)">Melodía
              <button type="button" class="boton" data-accion="melodia-bajar" aria-label="Bajar nota de la melodía">▼</button>
              <output>${esc(arriba ?? '–')}</output>
              <button type="button" class="boton" data-accion="melodia-subir" aria-label="Subir nota de la melodía">▲</button>
            </span>
            <span class="paso">Forma
              <button type="button" class="boton" data-accion="forma-ant" aria-label="Forma anterior" ${conNota.length < 2 ? 'disabled' : ''}>◀</button>
              <output>${aMano ? 'a mano' : pos >= 0 ? `${pos + 1}/${conNota.length}` : `–/${conNota.length}`}</output>
              <button type="button" class="boton" data-accion="forma-sig" aria-label="Forma siguiente" ${conNota.length < 2 && pos >= 0 ? 'disabled' : ''}>▶</button>
            </span>
          </div>
          <div class="fila">
            <button type="button" class="boton" data-audio="celda" aria-pressed="false">Escuchar</button>
            ${aMano ? '' : `<button type="button" class="boton" data-accion="octava">Octava ${(celda.vf?.p ?? 0) > 0 ? '↓' : '↑'}</button>`}
            <button type="button" class="boton" data-accion="a-mano" aria-pressed="${manual}">Trastes a mano</button>
            ${aMano ? '<button type="button" class="boton" data-accion="quitar-mano">Volver al catálogo</button>' : ''}
          </div>
        </div>
      </div>
      <div data-editor-mano ${manual ? '' : 'hidden'}></div>
      <fieldset>
        <legend>Acorde</legend>
        <div class="fila">
          <button type="button" class="boton" data-accion="celda-mas">+ Acorde en el compás</button>
          <button type="button" class="boton peligro" data-accion="celda-menos" ${compas.cells.length < 2 ? 'disabled' : ''}>Quitar acorde</button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Compás</legend>
        <div class="fila">
          <button type="button" class="boton" data-accion="compas-mas">+ Compás después</button>
          <button type="button" class="boton" data-accion="compas-antes">+ Compás antes</button>
          <button type="button" class="boton" data-accion="compas-duplicar">Duplicar</button>
          <button type="button" class="boton peligro" data-accion="compas-menos" ${total < 2 ? 'disabled' : ''}>Quitar compás</button>
        </div>
        <div class="fila">
          <label>Sección <input data-campo="seccion" value="${esc(compas.section ?? '')}" placeholder="A, B, Coda…" maxlength="12" /></label>
          <label>Final <select data-campo="final">${['', '1', '2', '3']
            .map((f) => `<option value="${f}" ${String(compas.ending ?? '') === f ? 'selected' : ''}>${f ? `${f}.` : '—'}</option>`)
            .join('')}</select></label>
          <label>Cambio de compás <select data-campo="metrica">${COMPASES.map(
            (m) => `<option value="${m}" ${(compas.timeSig?.label ?? '') === m ? 'selected' : ''}>${m || '—'}</option>`,
          ).join('')}</select></label>
        </div>
        <div class="fila">
          <label class="casilla"><input type="checkbox" data-campo="rep-ini" ${compas.repeatStart ? 'checked' : ''} /> Inicio de repetición</label>
          <label class="casilla"><input type="checkbox" data-campo="rep-fin" ${compas.repeatEnd ? 'checked' : ''} /> Fin de repetición</label>
          <label class="casilla"><input type="checkbox" data-campo="salto" ${esInicioDeLinea(i) ? 'checked' : ''} ${i === 0 ? 'disabled' : ''} /> Empieza línea</label>
        </div>
      </fieldset>`;

    if (manual) {
      const raiz = raizWeb(celda.root);
      const ed = editorTrastes(panel.querySelector('[data-editor-mano]')!, {
        trastes: forma?.trastes ?? ['x', 'x', 'x', 'x', 'x', 'x'],
        grados: forma?.grados ?? ['', '', '', '', '', ''],
        gradosEditables: false,
        calcularGrados: (t) => gradosDeTrastes(raiz, t, preferidosDeTipo(celda.type)),
        alCambiar: (trastes, g) =>
          cambiar(() => {
            const cel = celdaSel()!;
            cel.editFrets = trastes.map((t) => (t === 'x' ? null : t));
            const sup = gradoSuperior(g.map((x) => x || null));
            cel.interval = sup ? gradoCmb(sup) : null;
          }),
      });
      void ed;
    }
  }

  function esInicioDeLinea(i: number): boolean {
    return lineas(cmb()!).some((l) => l[0] === cmb()!.bars[i]);
  }

  function pintarMeta() {
    meta.hidden = !editando;
    if (!editando) return;
    const c = cmb();
    const campo = (nombre: string, etiqueta: string, valor: unknown, extra = '') =>
      `<label>${etiqueta} <input data-meta-campo="${nombre}" value="${esc(valor ?? '')}" ${extra} /></label>`;
    meta.innerHTML = `
      <div class="campos">
        ${campo('titulo', 'Título', cancion.titulo, 'required')}
        ${campo('autor', 'Autor', cancion.autor)}
        ${campo('tonalidad', 'Tonalidad', cancion.tonalidad, 'placeholder="F, Dm…"')}
        ${campo('tempo', 'Tempo (BPM)', cancion.tempo, 'type="number" min="20" max="400" inputmode="numeric"')}
        ${campo('compas', 'Compás', cancion.compas, 'placeholder="4/4"')}
        ${campo('estructura', 'Estructura', cancion.estructura, 'placeholder="AABA, 32 compases"')}
        ${campo('estilo', 'Estilo', cancion.estilo, 'placeholder="Bossa Nova"')}
      </div>
      <div class="casillas">
        <label class="casilla"><input type="checkbox" data-meta-campo="instrumental" ${cancion.instrumental ? 'checked' : ''} /> Instrumental</label>
      </div>
      ${
        c
          ? `<details><summary>Presentación del cifrado</summary>
        <div class="campos">
          <label>Compases por línea <input type="number" min="1" max="8" data-meta-campo="por-linea" value="${c.barsPerLine ?? 4}" /></label>
          <label>Semidisminuido <select data-meta-campo="semidisminuido">
            <option value="o" ${c.halfDimSymbol === 'o' ? 'selected' : ''}>Cø7</option>
            <option value="m7b5" ${c.halfDimSymbol !== 'o' ? 'selected' : ''}>Cm7(b5)</option></select></label>
          <label>Alteraciones <select data-meta-campo="ortografia">
            <option value="flat" ${c.spellingPreference !== 'sharp' ? 'selected' : ''}>Bemoles (Bb)</option>
            <option value="sharp" ${c.spellingPreference === 'sharp' ? 'selected' : ''}>Sostenidos (A#)</option></select></label>
        </div>
        <div class="casillas">
          <label class="casilla"><input type="checkbox" data-meta-campo="saltos" ${c.lineBreaksExplicit ? 'checked' : ''} /> Saltos de línea a mano</label>
          <label class="casilla"><input type="checkbox" data-meta-campo="grados" ${c.showDegrees !== false ? 'checked' : ''} /> Grados en los diagramas</label>
        </div>
      </details>`
          : ''
      }
      <details><summary>Letra, enlaces y notas</summary>
        <label class="bloque">Letra (estrofas separadas por una línea en blanco)<textarea data-meta-campo="letra" rows="8">${esc(cancion.letra)}</textarea></label>
        <div class="campos">
          ${campo('grabacion', 'Grabación (URL)', cancion.enlaces.grabacion, 'type="url"')}
          ${campo('partitura', 'Partitura (URL)', cancion.enlaces.partitura, 'type="url"')}
        </div>
        <label class="bloque">Notas de práctica<textarea data-meta-campo="notas" rows="3">${esc(cancion.notas ?? '')}</textarea></label>
      </details>`;
  }

  function pintar() {
    pintarCabecera();
    pintarBarra();
    pintarCifrado();
    pintarPanel();
    pintarResto();
    pintarImprovisacion();
  }

  // --- Ficha (formulario) -------------------------------------------------------

  /** Aplica el valor de un campo de la ficha a la canción. */
  function aplicarMeta(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
    const v = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
    const t = typeof v === 'string' ? v.trim() : '';
    const c = cmb();
    switch (el.dataset.metaCampo) {
      case 'titulo':
        cancion.titulo = t || 'Sin título';
        break;
      case 'autor':
        cancion.autor = t;
        break;
      case 'tonalidad':
        cancion.tonalidad = t || null;
        break;
      case 'tempo':
        cancion.tempo = Number(t) > 0 ? Math.round(Number(t)) : null;
        if (c && cancion.tempo) c.tempoBpm = cancion.tempo;
        break;
      case 'compas':
        cancion.compas = t || null;
        if (c && compasDeTexto(t)) c.timeSigLabel = t;
        break;
      case 'estructura':
        cancion.estructura = t || null;
        break;
      case 'estilo':
        cancion.estilo = t || null;
        if (c) c.style = t;
        break;
      case 'instrumental':
        cancion.instrumental = v as boolean;
        break;
      case 'letra':
        cancion.letra = String(v);
        break;
      case 'notas':
        cancion.notas = t ? String(v) : null;
        break;
      case 'grabacion':
      case 'partitura':
        cancion.enlaces = { ...cancion.enlaces, [el.dataset.metaCampo]: t || undefined };
        if (!t) delete cancion.enlaces[el.dataset.metaCampo as 'grabacion' | 'partitura'];
        break;
      case 'por-linea':
        if (c && Number(t) >= 1) c.barsPerLine = Math.min(8, Math.round(Number(t)));
        break;
      case 'semidisminuido':
        if (c) c.halfDimSymbol = t;
        break;
      case 'ortografia':
        if (c) c.spellingPreference = t;
        break;
      case 'saltos':
        if (c) {
          if (v) marcarSaltos(c);
          c.lineBreaksExplicit = v as boolean;
        }
        break;
      case 'grados':
        if (c) c.showDegrees = v as boolean;
        break;
    }
  }

  /** Antes de pasar a saltos a mano, marca dónde empiezan ahora las líneas para no cambiar nada. */
  function marcarSaltos(c: Cmb) {
    const inicios = new Set(lineas(c).map((l) => l[0]));
    c.bars.forEach((b, i) => (b.lineBreakBefore = i > 0 && inicios.has(b)));
  }

  // Al escribir se guarda y se repinta (sin entrada en el historial); al salir del campo, sí.
  meta.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (!el.dataset.metaCampo || el.type === 'checkbox' || el.tagName === 'SELECT') return;
    aplicarMeta(el);
    persistir();
    pintar();
  });
  meta.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.metaCampo) cambiar(() => aplicarMeta(el));
  });

  // --- Panel del acorde -------------------------------------------------------

  panel.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    const campo = el.dataset.campo;
    if (!campo) return;
    cambiar(() => {
      const celda = celdaSel()!;
      const compas = compasSel()!;
      switch (campo) {
        case 'raiz': {
          // La forma (en grados) se mantiene; los trastes a mano se mueven con la raíz.
          const g = gradosCelda(celda);
          celda.root = raizCmb(el.value);
          if (celda.editFrets) fijarForma(celda, g, celda.comboIndex ?? 0);
          break;
        }
        case 'tipo': {
          const arriba = gradoSuperior(gradosCelda(celda));
          celda.type = el.value;
          const formas = catalogo(el.value);
          const i = Math.max(0, formas.findIndex((f) => gradoSuperior(f.grados) === arriba));
          if (formas[i]) fijarForma(celda, formas[i].grados, 0);
          break;
        }
        case 'seccion':
          compas.section = el.value.trim() || null;
          break;
        case 'final':
          compas.ending = el.value ? Number(el.value) : null;
          break;
        case 'metrica':
          compas.timeSig = compasDeTexto(el.value);
          break;
        case 'rep-ini':
          compas.repeatStart = (el as HTMLInputElement).checked;
          break;
        case 'rep-fin':
          compas.repeatEnd = (el as HTMLInputElement).checked;
          break;
        case 'salto': {
          const c = cmb()!;
          if (!c.lineBreaksExplicit) marcarSaltos(c);
          c.lineBreaksExplicit = true;
          compas.lineBreakBefore = (el as HTMLInputElement).checked;
          break;
        }
      }
    }, campo === 'salto');
  });

  function accionPanel(accion: string) {
    const c = cmb()!;
    const sel = seleccion!;
    const celda = celdaSel()!;
    const compas = compasSel()!;
    const formas = catalogo(celda.type);
    const grados = gradosCelda(celda);
    const arriba = gradoSuperior(grados);

    switch (accion) {
      case 'anterior':
      case 'siguiente': {
        const todas = c.bars.flatMap((b, i) => b.cells.map((_, j) => ({ compas: i, celda: j })));
        const k = todas.findIndex((x) => x.compas === sel.compas && x.celda === sel.celda) + (accion === 'anterior' ? -1 : 1);
        if (todas[k]) seleccion = todas[k];
        manual = false;
        return pintar();
      }
      case 'cerrar':
        seleccion = null;
        manual = false;
        return pintar();
      case 'melodia-subir':
      case 'melodia-bajar': {
        const notas = notasSuperiores(formas);
        if (!notas.length) return;
        const k = notas.indexOf(arriba ?? '');
        const nueva = notas[k < 0 ? 0 : (k + (accion === 'melodia-subir' ? 1 : notas.length - 1)) % notas.length];
        const forma = formas.find((f) => gradoSuperior(f.grados) === nueva)!;
        return cambiar(() => fijarForma(celda, forma.grados, 0));
      }
      case 'forma-ant':
      case 'forma-sig': {
        const conNota = formas.filter((f) => gradoSuperior(f.grados) === arriba);
        const lista = conNota.length ? conNota : formas;
        const k = lista.findIndex((f) => claveForma(f.grados) === claveForma(grados));
        const n = k < 0 ? 0 : (k + (accion === 'forma-sig' ? 1 : lista.length - 1)) % lista.length;
        return cambiar(() => fijarForma(celda, lista[n].grados, n));
      }
      case 'octava': {
        const p = (celda.vf?.p ?? 0) > 0 ? 0 : 1;
        const sube = trastesDeGrados(raizWeb(celda.root), grados, p);
        const actual = trastesDeGrados(raizWeb(celda.root), grados, celda.vf?.p ?? 0);
        if (!sube || JSON.stringify(sube) === JSON.stringify(actual)) return;
        return cambiar(() => (celda.vf = { v: celda.vf!.v, p }));
      }
      case 'a-mano':
        manual = !manual;
        return pintar();
      case 'quitar-mano':
        manual = false;
        return cambiar(() => {
          const lista = formas.filter((f) => gradoSuperior(f.grados) === arriba);
          fijarForma(celda, (lista[0] ?? formas[0]).grados, 0);
        });
      case 'celda-mas':
        return cambiar(() => {
          compas.cells.splice(sel.celda + 1, 0, copiaCelda(celda));
          seleccion = { compas: sel.compas, celda: sel.celda + 1 };
        });
      case 'celda-menos':
        return cambiar(() => {
          compas.cells.splice(sel.celda, 1);
          seleccion = { compas: sel.compas, celda: Math.max(0, sel.celda - 1) };
        });
      case 'compas-mas':
      case 'compas-antes': {
        return cambiar(() => {
          const ultima = compas.cells[compas.cells.length - 1];
          const nuevo = compasVacio(c, [copiaCelda(ultima)]);
          const pos = accion === 'compas-mas' ? sel.compas + 1 : sel.compas;
          c.bars.splice(pos, 0, nuevo);
          seleccion = { compas: pos, celda: 0 };
        });
      }
      case 'compas-duplicar':
        return cambiar(() => {
          const copia = { ...clonar(compas), id: nuevoId(c), cells: compas.cells.map(copiaCelda), section: null, repeatStart: false };
          c.bars.splice(sel.compas + 1, 0, copia);
          seleccion = { compas: sel.compas + 1, celda: 0 };
        });
      case 'compas-menos':
        return cambiar(() => {
          c.bars.splice(sel.compas, 1);
          seleccion = c.bars.length ? { compas: Math.min(sel.compas, c.bars.length - 1), celda: 0 } : null;
        });
    }
  }

  // --- Acciones generales -----------------------------------------------------

  async function accionGeneral(accion: string) {
    switch (accion) {
      case 'editar':
        editando = true;
        pintarMeta();
        return pintar();
      case 'terminar':
        editando = false;
        seleccion = null;
        manual = false;
        pintarMeta();
        return pintar();
      case 'favorito':
        favs.alternar(id);
        return pintarBarra();
      case 'diagramas':
        diagramas = !diagramas;
        guardarJSON('repertorio:diagramas', diagramas);
        return pintar();
      case 'deshacer':
        return deshacer();
      case 'crear-cifrado':
        return cambiar(() => {
          const nuevo = cmbNuevo(cancion.titulo, cancion.autor);
          if (cancion.tempo) nuevo.tempoBpm = cancion.tempo;
          if (cancion.compas && compasDeTexto(cancion.compas)) {
            nuevo.timeSigLabel = cancion.compas;
            nuevo.bars[0].timeSig = compasDeTexto(cancion.compas);
          }
          cancion.cifrado = nuevo;
          seleccion = { compas: 0, celda: 0 };
        }, true);
      case 'exportar': {
        const vacio = { ...cmbNuevo(cancion.titulo, cancion.autor), bars: [] };
        return descargar(nombreArchivo(cancion), `${JSON.stringify(cancionACmb(cancion, vacio), null, 2)}\n`);
      }
      case 'importar': {
        const archivo = await elegirArchivo('.json,application/json');
        if (!archivo) return;
        try {
          const nueva = cmbACancion(JSON.parse(archivo.texto), id, cancion);
          if (!confirm(`Se sustituirá el cifrado por el de "${archivo.nombre}" (${nueva.cifrado!.bars.length} compases). ¿Seguir?`)) return;
          seleccion = null;
          cambiar(() => (cancion = nueva), true);
        } catch (error) {
          alert(`No se pudo importar: ${(error as Error).message}`);
        }
        return;
      }
      case 'restaurar':
        if (!base || !confirm('¿Descartar los cambios hechos en este navegador y volver a la versión del repositorio?')) return;
        seleccion = null;
        return cambiar(() => (cancion = clonar(base)), true);
      case 'eliminar-repositorio':
        if (!confirm(`¿Eliminar «${cancion.titulo}»? Se oculta del repertorio en este navegador; se puede restaurar desde la lista.`)) return;
        eliminar('repertorio', id);
        location.href = ruta('repertorio');
        return;
      case 'eliminar':
        if (!confirm(`¿Borrar "${cancion.titulo}" de este navegador? No se puede deshacer.`)) return;
        borrar(clave(id));
        location.href = ruta('repertorio');
        return;
    }
  }

  document.addEventListener('click', (e) => {
    const el = e.target as Element;
    const boton = el.closest<HTMLButtonElement>('button[data-accion]');
    if (boton) {
      const accion = boton.dataset.accion!;
      if (panel.contains(boton)) accionPanel(accion);
      else void accionGeneral(accion);
      return;
    }
    const celda = el.closest<HTMLElement>('.celda');
    if (!celda) return;
    const pos = { compas: Number(celda.dataset.compas), celda: Number(celda.dataset.celda) };
    if (editando) {
      seleccion = pos;
      manual = false;
      pintar();
    } else {
      menuDe(celda, pos);
    }
  });

  // --- Menú de un acorde (vista) y audio ----------------------------------------

  const menu = $('#menu-acorde');
  let acordeMenu: { compas: number; celda: number } | null = null;

  /** El clic llega antes de que se abra el popover: aquí se rellena con el acorde pulsado. */
  function menuDe(boton: HTMLElement, pos: { compas: number; celda: number }) {
    acordeMenu = pos;
    const { tonica, grupo, simbolo } = boton.dataset as { tonica: string; grupo: string; simbolo: string };
    const destino = (pagina: string) => `${ruta(pagina)}?tonica=${encodeURIComponent(tonica)}#grupo-${grupo}`;
    const voicingsEnlace = menu.querySelector<HTMLAnchorElement>('[data-menu-voicings]')!;
    const escalas = menu.querySelector<HTMLAnchorElement>('[data-menu-escalas]')!;
    menu.querySelector('[data-menu-titulo]')!.textContent = `${simbolo} · ${datos.grupos[grupo] ?? ''}`;
    voicingsEnlace.href = destino('acordes');
    voicingsEnlace.textContent = `Voicings ${datos.grupos[grupo]} en ${tonica}`;
    voicingsEnlace.hidden = !gruposConVoicings.has(grupo);
    escalas.href = destino('escalas');
    escalas.textContent = `Escalas para ${datos.grupos[grupo]} en ${tonica}`;
    // Mástil por capas y Arpegios, con el acorde ya elegido (lib/enlaces.ts).
    const equivalente = DESDE_GRUPO[grupo];
    const capas = menu.querySelector<HTMLAnchorElement>('[data-menu-capas]')!;
    const arpegio = menu.querySelector<HTMLAnchorElement>('[data-menu-arpegio]')!;
    capas.hidden = !equivalente;
    arpegio.hidden = !equivalente?.arpegio;
    if (equivalente) {
      capas.href = enlaceCapas(capas.dataset.base!, tonica, equivalente.capas);
      capas.textContent = `Mástil por capas: ${datos.grupos[grupo]} en ${tonica}`;
    }
    if (equivalente?.arpegio) {
      arpegio.href = enlaceArpegios(arpegio.dataset.base!, tonica, equivalente.arpegio);
      arpegio.textContent = `Arpegio ${datos.grupos[grupo]} en ${tonica}`;
    }
  }

  conectarAudio((boton) => {
    const c = cmb()!;
    const forma = (pos: { compas: number; celda: number } | null) =>
      pos ? analizarCelda(c.bars[pos.compas].cells[pos.celda], c, personales).forma : null;
    if (boton.dataset.audio === 'acorde') return { eventos: secuenciaAcorde(forma(acordeMenu)), instrumento: instrumento() };
    if (boton.dataset.audio === 'celda') return { eventos: secuenciaAcorde(forma(seleccion)), instrumento: instrumento() };
    const bpm = tempoActual();
    // Marca el acorde que suena (sin desplazar la página).
    const tramos = tiemposCifrado(c, bpm);
    let marcado = -1;
    const marcar = (k: number) => {
      if (k === marcado) return;
      marcado = k;
      zonaCifrado.querySelector('.celda.sonando-ahora')?.classList.remove('sonando-ahora');
      const tramo = tramos[k];
      if (tramo) zonaCifrado.querySelector(`.celda[data-compas="${tramo.compas}"][data-celda="${tramo.celda}"]`)?.classList.add('sonando-ahora');
    };
    return {
      eventos: secuenciaCifrado(c, bpm, personales, 0, { sostenido: SOSTENIDOS.includes(instrumento()), metronomo: casillaMetronomo.checked }),
      instrumento: instrumento(),
      bucle: enBucle,
      duracion: tramos.at(-1)?.fin ?? 0,
      alProgresar: (t) => marcar(tramos.findIndex((x) => t >= x.inicio && t < x.fin)),
      alTerminar: () => marcar(-1),
    };
  });

  // Si no hay nada que editar ni mostrar, se entra directamente a editar una canción recién creada.
  if (!base && !cancion.cifrado && new URLSearchParams(location.search).has('nueva')) editando = true;
  pintarMeta();
  pintar();
}
