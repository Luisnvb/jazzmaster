import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conPrefijo, formatear, idiomaDeDireccion, idiomaValido, plural, textos } from './idiomas.ts';

test('idioma de una dirección, con y sin base', () => {
  assert.equal(idiomaDeDireccion('/en/tools/metronome/'), 'en');
  assert.equal(idiomaDeDireccion('/en/'), 'en');
  assert.equal(idiomaDeDireccion('/en'), 'en');
  assert.equal(idiomaDeDireccion('/estudio/drop2/'), 'es');
  assert.equal(idiomaDeDireccion('/entrenador/'), 'es');
  assert.equal(idiomaDeDireccion('/jazzmaster/en/tools/', '/jazzmaster/'), 'en');
  assert.equal(idiomaDeDireccion('/jazzmaster/acordes/', '/jazzmaster/'), 'es');
  assert.equal(idiomaValido('en'), 'en');
  assert.equal(idiomaValido('fr'), 'es');
});

test('prefijo, plantillas y plurales', () => {
  assert.equal(conPrefijo('en', '/tools/metronome/'), 'en/tools/metronome');
  assert.equal(conPrefijo('es', 'herramientas/metronomo'), 'herramientas/metronomo');
  assert.equal(conPrefijo('en', ''), 'en');
  assert.equal(formatear('Compás {n} · {bpm} BPM', { n: 3, bpm: 120 }), 'Compás 3 · 120 BPM');
  assert.equal(formatear('Hola {nombre}', {}), 'Hola {nombre}');
  assert.equal(plural(1, 'día', 'días'), 'día');
  assert.equal(plural(0, 'day', 'days'), 'days');
});

test('textos: los dos idiomas con las mismas claves', () => {
  const t = textos({ hola: 'Hola', n: 2 }, { hola: 'Hello', n: 2 });
  assert.equal(t.en.hola, 'Hello');
  assert.deepEqual(Object.keys(t.es), Object.keys(t.en));
});
