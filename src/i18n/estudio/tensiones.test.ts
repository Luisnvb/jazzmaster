import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTEXTOS, notasSobre } from '../../lib/tensiones.ts';
import { TENSIONES, notaTension } from './tensiones.ts';

test('cada explicación de Tensiones tiene traducción al inglés', () => {
  const sinTraducir = CONTEXTOS.flatMap((c) => notasSobre(c).map((n) => n.nota)).filter((nota) => notaTension(nota, 'en') === nota);
  assert.deepEqual([...new Set(sinTraducir)], []);
});

test('las traducciones no dejan nombres de escala en español', () => {
  for (const c of CONTEXTOS) for (const n of notasSobre(c)) assert.ok(!notaTension(n.nota, 'en').includes(c.escala.nombre) || c.escala.nombre === TENSIONES.en.contextos[c.id].escala, n.nota);
});
