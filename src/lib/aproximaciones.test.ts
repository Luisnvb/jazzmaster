import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarProgresion, parseAcordeGrado } from './progresiones.ts';
import { PATRONES, notasAproximacion, objetivosAcorde, objetivosProgresion, secuenciaAproximacion } from './aproximaciones.ts';

const patron = (id: string) => PATRONES.find((p) => p.id === id)!;

test('notas de cada patrón hacia la 3 de Cmaj7 (E)', () => {
  const [, e] = objetivosAcorde('C', parseAcordeGrado('Imaj7'));
  assert.equal(e.nota, 'E');
  const nombres = (id: string) => notasAproximacion(e, patron(id)).map((n) => n.nota).join(' ');
  assert.equal(nombres('cromatica-abajo'), 'D# E');
  assert.equal(nombres('cromatica-arriba'), 'F E');
  assert.equal(nombres('escala-arriba'), 'F E');
  assert.equal(nombres('doble-abajo'), 'D D# E');
  assert.equal(nombres('encierro'), 'F D# E');
  assert.equal(nombres('encierro-largo'), 'F D D# E');
  assert.equal(nombres('triple-abajo'), 'C# D D# E');
  // Las alturas: el objetivo al final y cada cromática a su distancia.
  const n = notasAproximacion(e, patron('encierro-cromatico'));
  assert.deepEqual(n.map((x) => x.midi - e.midi), [1, -1, 0]);
  assert.deepEqual(n.map((x) => x.tipo), ['cromatica', 'cromatica', 'objetivo']);
});

test('la escala depende del acorde (dórica en m7, mixolidia en 7)', () => {
  const [d] = objetivosAcorde('C', parseAcordeGrado('IIm7'));
  assert.equal(notasAproximacion(d, patron('escala-arriba'))[0].nota, 'E');
  const b = objetivosAcorde('C', parseAcordeGrado('V7'))[1]; // B, la 3 de G7
  assert.equal(notasAproximacion(b, patron('escala-arriba'))[0].nota, 'C');
  assert.equal(notasAproximacion(b, patron('cromatica-abajo'))[0].nota, 'A#');
});

test('progresión: objetivos en la línea guía y aproximaciones al final de cada tramo', () => {
  const c = analizarProgresion(['IIm7', 'V7', 'Imaj7', 'Imaj7']);
  const obj = objetivosProgresion('C', c);
  assert.deepEqual(obj.map((o) => o.nota), ['C', 'B', 'B', 'B']);
  const { eventos, tramos, duracion } = secuenciaAproximacion(obj, [4, 4, 4, 4], patron('encierro'), 120, { acorde: true });
  assert.equal(duracion, 8);
  assert.equal(tramos.length, 4);
  // En el primer compás: el objetivo en el pulso 1 y las dos notas del encierro en las dos últimas corcheas.
  const melodia = eventos.filter((e) => e.inicio < 2 && e.midi > 62).sort((a, b) => a.inicio - b.inicio);
  assert.deepEqual(melodia.map((e) => e.inicio), [0, 1.5, 1.75]);
});
