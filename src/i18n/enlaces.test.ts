import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localizarEnlaces } from './enlaces.ts';

const MAPA: Record<string, string> = {
  '/jm/estudio/notas-guia/': '/jm/en/study/guide-tones/',
  '/jm/herramientas/metronomo/': '/jm/en/tools/metronome/',
};
const aIngles = (r: string) => MAPA[r];
const local = (html: string) => localizarEnlaces(html, '/jm/estudio/drop2/', aIngles);

test('los relativos van a la página inglesa si existe', () => {
  assert.equal(local('<a href="../notas-guia/">guide tones</a>'), '<a href="/jm/en/study/guide-tones/">guide tones</a>');
  assert.equal(local('<a href="../../herramientas/metronomo/">x</a>'), '<a href="/jm/en/tools/metronome/">x</a>');
  // Sin barra final y con ancla.
  assert.equal(local('<a href="../notas-guia#linea">x</a>'), '<a href="/jm/en/study/guide-tones/#linea">x</a>');
});

test('si no hay inglesa, a la española marcada como tal', () => {
  assert.equal(local('<a href="../../progresiones/">x</a>'), '<a href="/jm/progresiones/" hreflang="es">x</a>');
  assert.equal(local('<a class="c" href="../shells/" title="t">x</a>'), '<a class="c" href="/jm/estudio/shells/" hreflang="es" title="t">x</a>');
});

test('no toca los absolutos, las anclas ni los externos', () => {
  for (const html of ['<a href="/jm/en/">x</a>', '<a href="#arriba">x</a>', '<a href="https://example.com/">x</a>', '<a href="mailto:a@b.c">x</a>', '<a href="?q=1">x</a>']) {
    assert.equal(local(html), html);
  }
});
