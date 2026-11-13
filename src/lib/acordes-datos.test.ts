import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { aplicarCambios, aVoicing, erroresVoicing, nuevoIdVoicing, voicingsAYaml, type Voicing } from './acordes-datos.ts';

const v = (id: string, extra: Partial<Voicing> = {}): Voicing => ({
  id,
  grupo: 'm7',
  nombre: 'Shell',
  tonica: 'C',
  trastes: ['x', 3, 5, 3, 4, 'x'],
  grados: ['', '1', '5', 'b7', 'b3', ''],
  ...extra,
});

test('aplicar cambios: editar, borrar y añadir', () => {
  const base = [v('a'), v('b'), v('c')];
  const lista = aplicarCambios(base, { b: null, a: v('a', { nombre: 'Otro' }), nuevo: v('nuevo') });
  assert.deepEqual(
    lista.map((x) => [x.id, x.nombre]),
    [
      ['a', 'Otro'],
      ['c', 'Shell'],
      ['nuevo', 'Shell'],
    ],
  );
});

test('errores de un voicing', () => {
  assert.deepEqual(erroresVoicing(v('a'), ['m7']), []);
  assert.match(erroresVoicing(v('a', { grados: ['', '1', '5', 'b7', '3', ''] }), ['m7']).join(), /2ª cuerda.*b3.*no 3/);
  assert.match(
    erroresVoicing(v('a', { trastes: ['x', 'x', 'x', 'x', 'x', 'x'], grados: ['', '', '', '', '', ''] }), ['m7']).join(),
    /al menos una/,
  );
  // bb7 y 6 son la misma nota: vale cualquiera de las dos ortografías.
  const dim = v('d', { grupo: 'dim7', trastes: ['x', 'x', 10, 11, 10, 11], grados: ['', '', '1', 'b5', 'bb7', 'b3'] });
  assert.deepEqual(erroresVoicing(dim, ['dim7']), []);
});

test('exportar a YAML y volver a leerlo', () => {
  const lista = [
    v('a', { notas: "Con 'comillas'" }),
    v('b', { trastes: [8, 'x', 8, 9, 8, 'x'], grados: ['1', '', 'b7', '3', '5', ''], grupo: 'dom7' }),
  ];
  const leido = (parse(voicingsAYaml(lista)) as unknown[]).map(aVoicing);
  assert.deepEqual(leido, lista);
});

test('id nuevo sin repetir', () => {
  assert.equal(nuevoIdVoicing({ grupo: 'm7', nombre: 'Drop 2' }, []), 'm7-drop-2');
  assert.equal(nuevoIdVoicing({ grupo: 'm7', nombre: 'Drop 2' }, ['m7-drop-2']), 'm7-drop-2-2');
});

test('cambiar de sitio dentro del grupo y reordenar por ids', async () => {
  const { moverEnGrupo, ordenarPorIds } = await import('./acordes-datos.ts');
  const lista = [
    { id: 'a', grupo: 'm7' },
    { id: 'b', grupo: 'dom7' },
    { id: 'c', grupo: 'm7' },
  ];
  assert.deepEqual(moverEnGrupo(lista, 'c', -1).map((v) => v.id), ['c', 'b', 'a']);
  assert.deepEqual(moverEnGrupo(lista, 'a', -1).map((v) => v.id), ['a', 'b', 'c']);
  assert.deepEqual(ordenarPorIds([...lista, { id: 'd', grupo: 'm7' }], ['c', 'b', 'a']).map((v) => v.id), ['c', 'b', 'a', 'd']);
});
