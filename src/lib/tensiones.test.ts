import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTEXTOS, notasSobre, tensiones, type Rol } from './tensiones.ts';

const ctx = (id: string) => CONTEXTOS.find((c) => c.id === id)!;
const con = (id: string, rol: Rol) =>
  notasSobre(ctx(id))
    .filter((n) => n.rol === rol)
    .map((n) => n.grado);

test('doce notas, y las del acorde en su sitio', () => {
  for (const c of CONTEXTOS) {
    const notas = notasSobre(c);
    assert.equal(notas.length, 12, c.id);
    assert.equal(notas.filter((n) => n.rol === 'acorde').length, c.acorde.length, c.id);
    assert.equal(notas[0].rol, 'acorde');
  }
});

test('avoid notes: medio tono por encima de una nota del acorde', () => {
  assert.deepEqual(con('maj7-jonico', 'evitar'), ['11']);
  assert.deepEqual(con('maj7-lidio', 'evitar'), []);
  assert.deepEqual(con('m7-dorico', 'evitar'), []);
  assert.deepEqual(con('m7-frigio', 'evitar'), ['b9', 'b13']);
  assert.deepEqual(con('m7-eolico', 'evitar'), ['b13']);
  assert.deepEqual(con('dom-mixolidio', 'evitar'), ['11']);
  assert.deepEqual(con('sus', 'evitar'), ['3']);
});

test('tensiones de cada acorde', () => {
  assert.deepEqual(tensiones(ctx('maj7-jonico')), ['9', '13']);
  assert.deepEqual(tensiones(ctx('maj7-lidio')), ['9', '#11', '13']);
  assert.deepEqual(tensiones(ctx('m7-dorico')), ['9', '11', '13']);
  assert.deepEqual(tensiones(ctx('dom-mixolidio')), ['b9', '9', '#9', '#11', 'b13', '13']);
  assert.deepEqual(con('dom-alterado', 'alterada'), ['b9', '#9', '#11', 'b13']);
  assert.deepEqual(con('dom-alterado', 'tension'), []);
  assert.deepEqual(tensiones(ctx('m7b5-locrio2')), ['9', '11', 'b13']);
  assert.deepEqual(tensiones(ctx('dim7')), ['9', '11', 'b13', '7']);
});
