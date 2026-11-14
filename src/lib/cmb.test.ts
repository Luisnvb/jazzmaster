import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cmbACancion, cancionACmb } from './cancion.ts';
import { cmbNuevo, formaDeCelda, grupoDeCelda, lineas, raizWeb, simboloCelda, validarCmb, type CeldaCmb } from './cmb.ts';

const ejemplo = JSON.parse(readFileSync(new URL('../content/repertorio/how-insensitive.cmb.json', import.meta.url), 'utf8'));

const celda = (root: string, type: string, v: (string | null)[]): CeldaCmb => ({ id: 1, root, type, vf: { v, p: 0 } });
const simbolo = (c: CeldaCmb) => simboloCelda(c, formaDeCelda(c)?.grados ?? []);

test('lee el ejemplo de How Insensitive', () => {
  const cmb = validarCmb(ejemplo);
  assert.equal(cmb.title, 'How Insensitive');
  assert.equal(cmb.bars.length, ejemplo.bars.length);
  assert.equal(raizWeb(cmb.bars[2].cells[0].root), 'C#');
  // Saltos de línea explícitos: líneas de 4 compases.
  assert.deepEqual(lineas(cmb).slice(0, 2).map((l) => l.length), [4, 4]);
  // Todas las celdas tienen forma.
  for (const b of cmb.bars) for (const c of b.cells) assert.ok(formaDeCelda(c), `${c.root} ${c.type}`);
});

test('trastes puestos a mano (editFrets)', () => {
  const c: CeldaCmb = { id: 1, root: 'C', type: 'Minor', editFrets: [null, 3, 5, 5, 4, null] };
  assert.deepEqual(formaDeCelda(c), { trastes: ['x', 3, 5, 5, 4, 'x'], grados: ['', '1', '5', '1', 'b3', ''] });
});

test('cifrado de cada celda según la calidad y la forma', () => {
  assert.equal(simbolo(celda('D', 'Minor', [null, '1', '4', 'b7', 'b3', null])), 'Dm11');
  assert.equal(simbolo(celda('C', 'Minor', [null, '1', '5', '6', 'b3', null])), 'Cm6');
  assert.equal(simbolo(celda('C♯', 'Diminished', [null, '1', 'b5', '°7', 'b3', null])), 'C#°7');
  assert.equal(simbolo(celda('B♭', 'Major', ['1', null, '7', '3', '5', null])), 'Bbmaj7');
  assert.equal(simbolo(celda('E♭', 'Major', [null, '1', '2', '5', '7', null])), 'Ebmaj9');
  assert.equal(simbolo(celda('A', 'Dominant', ['1', null, 'b7', 'b2', '3', null])), 'A7b9');
  assert.equal(simbolo(celda('G', 'Dominant', ['1', null, 'b7', '3', 'b7', null])), 'G7');
  assert.equal(simbolo(celda('E', 'Half-Diminished', [null, '1', 'b3', 'b5', 'b7', null])), 'Eø7');
});

test('grupo de acordes de cada celda (para los enlaces)', () => {
  const g = (c: CeldaCmb) => grupoDeCelda(c, formaDeCelda(c)?.grados ?? []);
  assert.equal(g(celda('A', 'Dominant', ['1', null, 'b7', 'b2', '3', null])), 'alt7');
  assert.equal(g(celda('G', 'Dominant', ['1', null, 'b7', '3', 'b7', null])), 'dom7');
  assert.equal(g(celda('C', 'Minor', [null, '1', '5', '7', 'b3', null])), 'mmaj7');
  assert.equal(g(celda('E', 'Half-Diminished', [null, '1', 'b3', 'b5', 'b7', null])), 'm7b5');
  assert.equal(g(celda('C', 'Dominant', ['1', null, 'b7', '4', '5', null])), 'sus');
  assert.equal(g(celda('C', 'Major', [null, '1', '3', '#5', '1', null])), 'aug');
  assert.equal(simbolo(celda('C', 'Major', [null, '1', '3', '#5', '1', null])), 'C+');
  assert.equal(simbolo(celda('C', 'Dominant', ['1', null, 'b7', '4', '5', null])), 'C7sus4');
});

test('validación con mensajes claros', () => {
  assert.throws(() => validarCmb({}), /bars/);
  assert.throws(() => validarCmb({ bars: [{ cells: [{ root: 'H', type: 'Major' }] }] }), /raíz no válida/);
  assert.throws(
    () => validarCmb({ bars: [{ cells: [{ root: 'C', type: 'Major', vf: { v: ['1', 'z', null, null, null, null], p: 0 } }] }] }),
    /grado no válido/,
  );
});

test('canción ↔ .cmb.json: ida y vuelta', () => {
  const cancion = cmbACancion(ejemplo, 'how-insensitive');
  assert.equal(cancion.titulo, 'How Insensitive');
  assert.equal(cancion.tempo, 140);
  assert.equal(cancion.estilo, 'Bossa Nova');
  const editada = { ...cancion, tonalidad: 'Dm', letra: 'Primera estrofa', notas: 'Ojo al C#°7' };
  const exportado = cancionACmb(editada, cmbNuevo());
  assert.equal(exportado.practica?.tonalidad, 'Dm');
  // Los campos que esta web no usa se conservan.
  assert.equal(exportado.globalGridScale, 1);
  const vuelta = cmbACancion(JSON.parse(JSON.stringify(exportado)), 'how-insensitive');
  assert.deepEqual({ ...vuelta, cifrado: null }, { ...editada, cifrado: null });
  assert.deepEqual(vuelta.cifrado?.bars, cancion.cifrado?.bars);
});

test('cifrado nuevo', () => {
  const cmb = cmbNuevo('Prueba');
  assert.equal(cmb.bars.length, 4);
  assert.equal(new Set(cmb.bars.flatMap((b) => [b.id, ...b.cells.map((c) => c.id)])).size, 8, 'ids distintos');
  assert.equal(simbolo(cmb.bars[0].cells[0]), 'Cmaj7');
});

test('los tiempos de cada acorde cuadran con la secuencia del cifrado', async () => {
  const { tiemposCifrado } = await import('./cifrado-vista.ts');
  const cmb = validarCmb(ejemplo);
  const tramos = tiemposCifrado(cmb, 120);
  assert.equal(tramos.length, cmb.bars.reduce((n, b) => n + b.cells.length, 0));
  assert.equal(tramos[0].inicio, 0);
  for (let k = 1; k < tramos.length; k++) assert.ok(Math.abs(tramos[k].inicio - tramos[k - 1].fin) < 1e-9);
  // A 120 BPM un compás de 4/4 dura 2 s.
  const primerCompas = tramos.filter((t) => t.compas === 0);
  assert.ok(Math.abs(primerCompas.at(-1)!.fin - 2) < 1e-9);
});

test('cifrado sostenido y con metrónomo', async () => {
  const { secuenciaCifrado } = await import('./cifrado-vista.ts');
  const cmb = validarCmb(ejemplo);
  const normal = secuenciaCifrado(cmb, 120, {});
  const sostenido = secuenciaCifrado(cmb, 120, {}, 0, { sostenido: true });
  // Ligadas las repeticiones, hay menos notas y ninguna empieza con retardo de rasgueo.
  assert.ok(sostenido.length < normal.length);
  const conClic = secuenciaCifrado(cmb, 120, {}, 0, { metronomo: true });
  const clics = conClic.filter((e) => e.clic);
  assert.equal(clics.length, cmb.bars.length * 4);
  assert.equal(clics[0].clic, 'fuerte');
  assert.equal(clics[1].clic, 'debil');
  assert.equal(clics[1].inicio, 0.5);
});

test('tríadas sin 3 y bajo distinto de la raíz', () => {
  assert.equal(simbolo(celda('E', 'Major', ['1', '5', '1', null, null, null])), 'E5');
  assert.equal(simbolo(celda('B', 'Major', [null, '1', '5', '1', '4', '5'])), 'Bsus4');
  assert.equal(simbolo(celda('B', 'Major', [null, '1', '5', '1', '2', '5'])), 'Bsus2');
  const conBajo = (c: CeldaCmb) => ({ ...c, showBass: true });
  assert.equal(simbolo(conBajo(celda('D', 'Major', [null, '5', '1', '5', '1', '3']))), 'D/A');
  assert.equal(simbolo(conBajo(celda('E', 'Dominant', ['3', null, 'b7', '3', '5', '9']))), 'E9/G#');
  // Sin showBass, el bajo no se escribe (los voicings de jazz llevan a menudo la 3 o la 7 abajo).
  assert.equal(simbolo(celda('D', 'Major', [null, '5', '1', '5', '1', '3'])), 'D');
});
