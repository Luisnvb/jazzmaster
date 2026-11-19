import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlIndiceNotas, juntarPorId, limpiarRuta, nombreDeRuta, ordenar, tamanoLegible, tituloDe, validarCopia, type Documento, type Nota } from './apuntes.ts';

const nota = (id: string, favorita: boolean, editada: number, titulo = id, texto = ''): Nota => ({ id, titulo, texto, favorita, creada: 0, editada });

test('favoritas primero; dentro de cada grupo, lo más reciente arriba', () => {
  const l = [nota('a', false, 3), nota('b', true, 1), nota('c', false, 5), nota('d', true, 2)];
  assert.deepEqual(ordenar(l).map((n) => n.id), ['d', 'b', 'c', 'a']);
});

test('título: el escrito o el principio del texto', () => {
  assert.equal(tituloDe({ titulo: ' Voicings ', texto: '' }), 'Voicings');
  assert.equal(tituloDe({ titulo: '', texto: '\nPrimera línea\nsegunda' }), 'Primera línea');
  assert.equal(tituloDe({ titulo: '', texto: '' }), 'Sin título');
});

test('índice de notas: enlaces escapados, favoritas primero y la actual marcada', () => {
  const html = htmlIndiceNotas([nota('a', false, 2, '<b>'), nota('b', true, 1, 'Fav')], (id) => `/apuntes/nota/?id=${id}`, 'a');
  assert.ok(html.indexOf('Fav') < html.indexOf('&lt;b&gt;'));
  assert.match(html, /href="\/apuntes\/nota\/\?id=a" aria-current="page"/);
  assert.equal(htmlIndiceNotas([], (id) => id), '');
});

test('índice: los documentos favoritos van detrás de las notas favoritas y enlazan a su tarjeta', () => {
  const doc = (id: string, favorita: boolean, titulo: string): Documento => ({ id, titulo, ruta: '', favorita, creada: 0, editada: 0 });
  const html = htmlIndiceNotas([nota('a', false, 2, 'Normal'), nota('b', true, 1, 'NotaFav')], (id) => id, undefined, [
    doc('d1', true, 'DocFav'),
    doc('d2', false, 'DocNormal'),
  ]);
  assert.ok(html.indexOf('NotaFav') < html.indexOf('DocFav') && html.indexOf('DocFav') < html.indexOf('Normal'));
  assert.match(html, /href="#documento-d1"/);
  assert.ok(!html.includes('DocNormal'));
  assert.match(htmlIndiceNotas([], (id) => id, undefined, [doc('d1', true, 'Solo')]), /Solo/);
});

test('rutas del equipo y tamaños', () => {
  assert.equal(limpiarRuta('"C:\\Partituras\\Stella.pdf"'), 'C:\\Partituras\\Stella.pdf');
  assert.equal(nombreDeRuta('C:\\Partituras\\Stella.pdf'), 'Stella.pdf');
  assert.equal(nombreDeRuta('/home/yo/libro.pdf'), 'libro.pdf');
  assert.equal(tamanoLegible(500), '500 B');
  assert.equal(tamanoLegible(2048), '2 KB');
  assert.equal(tamanoLegible(2.5 * 1024 ** 2), '2,5 MB');
  assert.equal(tamanoLegible(10 * 1024 ** 3), '10,0 GB');
});

test('copia de seguridad: valida el formato y junta por id', () => {
  assert.throws(() => validarCopia({ formato: 'otro' }), /no es una copia/);
  assert.throws(() => validarCopia({ formato: 'jazzmaster-apuntes', notas: [{}], documentos: [] }), /sin id/);
  const c = validarCopia({ formato: 'jazzmaster-apuntes', version: 1, notas: [nota('a', false, 1)], documentos: [] });
  assert.deepEqual(c.archivos, {});
  const juntas = juntarPorId([nota('a', false, 1, 'vieja'), nota('b', false, 1)], [nota('a', false, 2, 'nueva')]);
  assert.deepEqual(juntas.map((n) => n.titulo), ['b', 'nueva']);
});
