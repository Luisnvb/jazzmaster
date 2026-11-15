import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alturasEnZona, corregir, escalon, escribir, nombreEscrito, nombreSonoro, nuevaNota, pentagramaSVG, posiciones } from './lectura.ts';

test('escritura una octava por encima: la 6ª al aire es E3 en el papel', () => {
  const e = escribir(40, '#');
  assert.equal(nombreEscrito(e), 'E3');
  assert.equal(nombreSonoro(e), 'E2');
  assert.equal(escalon(e), -7); // tres líneas adicionales por debajo
  assert.equal(escalon(escribir(64, '#')), 7); // 1ª al aire: E5, 4º espacio
  assert.equal(escalon(escribir(59, '#')), 4); // 2ª al aire: B4, 3ª línea
});

test('grafías y octavas con alteraciones', () => {
  assert.equal(nombreEscrito(escribir(54, '#')), 'F#4');
  assert.equal(nombreEscrito(escribir(54, 'b')), 'Gb4');
  // Bb y A# en la misma octava escrita.
  assert.equal(nombreEscrito(escribir(46, 'b')), 'Bb3');
  assert.equal(nombreEscrito(escribir(46, '#')), 'A#3');
  // C natural: cambia de octava en el C.
  assert.equal(nombreEscrito(escribir(48, '#')), 'C4');
  assert.equal(nombreEscrito(escribir(47, 'b')), 'B3');
});

test('posiciones de una altura', () => {
  // E4 (1ª al aire): no cabe en la 6ª ni en la 5ª (trastes 24 y 19).
  assert.deepEqual(posiciones(64), [
    { cuerda: 2, traste: 14 },
    { cuerda: 3, traste: 9 },
    { cuerda: 4, traste: 5 },
    { cuerda: 5, traste: 0 },
  ]);
});

test('notas nuevas: dentro de la zona, sin repetir y con las alteraciones pedidas', () => {
  const zona = { tipo: 'posicion' as const, desde: 5 };
  const validas = new Set(alturasEnZona(zona));
  let anterior = null;
  for (let i = 0; i < 300; i++) {
    const n = nuevaNota(zona, 'naturales', anterior);
    assert.ok(validas.has(n.midi));
    assert.equal(n.alteracion, '');
    assert.notEqual(n.midi, anterior?.midi);
    anterior = n;
  }
  for (let i = 0; i < 100; i++) assert.notEqual(nuevaNota({ tipo: 'cuerda', cuerda: 0 }, 'bemoles').alteracion, '#');
  for (let i = 0; i < 100; i++) assert.notEqual(nuevaNota({ tipo: 'cuerda', cuerda: 0 }, 'sostenidos').alteracion, 'b');
  // Una cuerda: solo las alturas de esa cuerda (E2 … G3).
  assert.deepEqual(alturasEnZona({ tipo: 'cuerda', cuerda: 0 }), Array.from({ length: 16 }, (_, i) => 40 + i));
});

test('corrección', () => {
  const n = escribir(57, '#'); // suena A3: 4ª en el 7, 3ª en el 2
  assert.equal(corregir(n, 2, 7), 'acierto');
  assert.equal(corregir(n, 3, 2), 'acierto');
  assert.equal(corregir(n, 0, 5), 'octava'); // A2
  assert.equal(corregir(n, 0, 6), 'fallo');
});

test('pentagrama', () => {
  const svg = pentagramaSVG(escribir(40, '#'));
  assert.equal((svg.match(/adicional/g) ?? []).length, 3);
  assert.equal((pentagramaSVG(escribir(79, '#')).match(/adicional/g) ?? []).length, 4); // G6 escrito
  assert.match(pentagramaSVG(escribir(42, 'b')), /♭/);
});
