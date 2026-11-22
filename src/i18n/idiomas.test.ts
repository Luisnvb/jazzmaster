import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conPrefijo, formatear, idiomaDeDireccion, idiomaSugerido, idiomaValido, plural, textos } from './idiomas.ts';

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

test('idioma sugerido según el navegador y lo elegido', () => {
  // Sin elección: el del navegador.
  assert.equal(idiomaSugerido(['en-US', 'en'], 'es', null), 'en');
  assert.equal(idiomaSugerido(['es-MX'], 'es', null), null);
  assert.equal(idiomaSugerido(['es-ES'], 'en', undefined), 'es');
  assert.equal(idiomaSugerido(['en-GB'], 'en', null), null);
  // El primero que tenga la web; si ninguno, inglés.
  assert.equal(idiomaSugerido(['fr-FR', 'es', 'en'], 'en', null), 'es');
  assert.equal(idiomaSugerido(['fr-FR', 'de'], 'es', null), 'en');
  assert.equal(idiomaSugerido(['fr-FR'], 'en', null), null);
  assert.equal(idiomaSugerido([], 'es', null), null);
  // Con elección, manda la elección.
  assert.equal(idiomaSugerido(['en-US'], 'es', 'es'), null);
  assert.equal(idiomaSugerido(['es'], 'es', 'en'), 'en');
  assert.equal(idiomaSugerido(['es'], 'en', 'en'), null);
  assert.equal(idiomaSugerido(['en'], 'es', 'xx'), 'en');
});
