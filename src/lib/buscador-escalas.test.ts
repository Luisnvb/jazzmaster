import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { buscarEscalas, claveNotas, leerEntrada, type EscalaDatos } from './buscador-escalas.ts';

// El diccionario real, para que las pruebas sigan a los datos.
const ESCALAS = parse(readFileSync(new URL('../data/escalas.yaml', import.meta.url), 'utf8')) as EscalaDatos[];
const nombres = (texto: string, soloRaiz = false) => buscarEscalas(leerEntrada(texto), ESCALAS, soloRaiz).map((c) => `${c.tonica} ${c.escala.id}`);

test('lee notas, acordes o una mezcla', () => {
  assert.deepEqual(leerEntrada('C E G'), { notas: ['C', 'E', 'G'], raiz: null, acordes: [], errores: [] });
  const ii = leerEntrada('Dm7 G7');
  assert.deepEqual(ii.acordes, ['Dm7', 'G7']);
  assert.equal(ii.raiz, 'D');
  assert.deepEqual(ii.notas, ['D', 'F', 'A', 'C', 'G', 'B']);
  // Con un acorde «de verdad», C y F también son acordes.
  assert.deepEqual(leerEntrada('C F G7').notas, ['C', 'E', 'G', 'F', 'A', 'B', 'D']);
  assert.deepEqual(leerEntrada('C7 zzz').errores, ['zzz']);
});

test('sobre un acorde, primero las escalas de su raíz', () => {
  const r = nombres('Dm7');
  assert.equal(r[0], 'D dorico');
  assert.ok(r.slice(0, 6).includes('D eolico'));
  assert.ok(r.includes('F jonico'));
  assert.ok(nombres('G7alt', true).includes('G superlocrio'));
  assert.equal(nombres('Cmaj7#11', true)[0], 'C lidio');
});

test('un II–V–I: la escala madre que vale para todos', () => {
  const r = nombres('Dm7 G7 Cmaj7');
  assert.ok(r.includes('C jonico'));
  assert.ok(r.includes('D dorico'));
  assert.ok(!r.includes('D eolico'), 'el eólico de D tiene Bb, que choca con G7');
});

test('fuera de la raíz, por notas añadidas; agrupables por notas', () => {
  const r = buscarEscalas(leerEntrada('C E G'), ESCALAS).filter((c) => !c.enLaRaiz);
  for (let i = 1; i < r.length; i++) assert.ok(r[i].extra >= r[i - 1].extra);
  assert.equal(buscarEscalas(leerEntrada('C E G'), ESCALAS)[0].escala.id, 'jonico');
  const [jonico] = buscarEscalas({ notas: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], raiz: 'C' }, ESCALAS, true);
  const [dorico] = buscarEscalas({ notas: ['D', 'E', 'F', 'G', 'A', 'B', 'C'], raiz: 'D' }, ESCALAS, true);
  assert.equal(claveNotas(jonico), claveNotas(dorico));
});

test('con menos de dos notas no hay búsqueda', () => {
  assert.deepEqual(buscarEscalas(leerEntrada('C'), ESCALAS), []);
});
