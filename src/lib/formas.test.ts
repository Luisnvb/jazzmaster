import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogoFormas, gradoSuperior, gradosDeTrastes, notasSuperiores, trastesDeGrados } from './formas.ts';

test('trastes a partir de los grados de cada cuerda (formas de How Insensitive)', () => {
  assert.deepEqual(trastesDeGrados('D', [null, '1', '4', 'b7', 'b3', null]), ['x', 5, 5, 5, 6, 'x']);
  assert.deepEqual(trastesDeGrados('C#', [null, '1', 'b5', 'bb7', 'b3', null]), ['x', 4, 5, 3, 5, 'x']);
  assert.deepEqual(trastesDeGrados('G', ['1', null, 'b7', '3', 'b7', null]), [3, 'x', 3, 4, 6, 'x']);
  assert.deepEqual(trastesDeGrados('Eb', [null, '1', '2', '5', '7', null]), ['x', 6, 3, 3, 3, 'x']);
  assert.deepEqual(trastesDeGrados('A', ['1', null, 'b7', 'b2', '3', null]), [5, 'x', 5, 3, 2, 'x']);
});

test('la posición 1 sube la forma una octava', () => {
  assert.deepEqual(trastesDeGrados('D', [null, '1', '4', 'b7', 'b3', null], 1), ['x', 17, 17, 17, 18, 'x']);
});

test('grados a partir de trastes, con la ortografía preferida', () => {
  assert.deepEqual(gradosDeTrastes('C', ['x', 3, 5, 4, 5, 'x']), ['', '1', '5', '7', '3', '']);
  assert.deepEqual(gradosDeTrastes('C', ['x', 'x', 10, 11, 10, 11], ['1', 'b3', 'b5', 'bb7']), ['', '', '1', 'b5', 'bb7', 'b3']);
});

test('nota superior y catálogo de formas', () => {
  assert.equal(gradoSuperior([null, '1', '4', 'b7', 'b3', null]), 'b3');
  const menores = catalogoFormas('Minor');
  assert.ok(menores.length > 10);
  assert.ok(menores.every((f) => f.grados.find(Boolean) === '1'), 'raíz en el bajo');
  assert.ok(notasSuperiores(menores).includes('b3'));
  // Las personales van primero y no se repiten.
  const personal = { grados: [null, '1', '5', 'b7', 'b3', null], personal: true };
  const conPersonal = catalogoFormas('Minor', [personal]);
  assert.equal(conPersonal[0], personal);
  assert.equal(conPersonal.filter((f) => f.grados.join() === personal.grados.join()).length, 1);
});
