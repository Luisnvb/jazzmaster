import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ETAPAS, PASOS, siguientePaso, hechosDeEtapa } from './ruta.ts';

test('cada página sale una sola vez en la ruta y los pasos van numerados', () => {
  const direcciones = PASOS.map((p) => p.direccion);
  assert.equal(new Set(direcciones).size, direcciones.length);
  assert.deepEqual(PASOS.map((p) => p.numero), direcciones.map((_, i) => i + 1));
  assert.ok(ETAPAS.every((e) => e.pasos.length > 0));
});

test('siguiente paso: el primero sin hacer, o el siguiente a uno dado', () => {
  const hechos = new Set([PASOS[0].direccion, PASOS[2].direccion]);
  assert.equal(siguientePaso(hechos)?.direccion, PASOS[1].direccion);
  assert.equal(siguientePaso(hechos, PASOS[1].direccion)?.direccion, PASOS[3].direccion);
  // Si no queda nada detrás, vuelve al primero pendiente.
  assert.equal(siguientePaso(hechos, PASOS.at(-1)!.direccion)?.direccion, PASOS[1].direccion);
  assert.equal(siguientePaso(new Set(PASOS.map((p) => p.direccion))), undefined);
  assert.equal(hechosDeEtapa(ETAPAS[0], hechos), 2);
});
