import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import {
  analizarProgresion,
  aplicarCambiosProgresiones,
  compasesDeTexto,
  parseAcordeGrado,
  progresionesAYaml,
  secuenciaProgresion,
  simboloEn,
  textoDeCompases,
  type Progresion,
} from './progresiones.ts';

test('grados romanos con alteraciones y calidades', () => {
  const a = parseAcordeGrado('bVII7');
  assert.equal(a.grado, 'b7');
  assert.equal(a.grupo, 'dom7');
  assert.equal(simboloEn('C', a), 'Bb7');
  assert.equal(simboloEn('F', parseAcordeGrado('#IV°7')), 'B°7');
  assert.equal(simboloEn('Bb', parseAcordeGrado('IIm7b5')), 'Cm7b5');
  assert.equal(simboloEn('Eb', parseAcordeGrado('V7alt')), 'Bb7alt');
  assert.equal(parseAcordeGrado('ii').sufijo, 'm');
  assert.equal(parseAcordeGrado('IIø').sufijo, 'ø7');
  assert.equal(parseAcordeGrado('V7sus4').grupo, 'sus');
  assert.throws(() => parseAcordeGrado('H7'), /no válido/);
  assert.throws(() => parseAcordeGrado('V7xx'), /Calidad no reconocida/);
});

test('texto editable ↔ compases', () => {
  const compases = compasesDeTexto(' IIm7   V7 | Imaj7 |  ');
  assert.deepEqual(compases, ['IIm7 V7', 'Imaj7']);
  assert.equal(textoDeCompases(compases), 'IIm7 V7 | Imaj7');
  assert.throws(() => analizarProgresion([]), /no tiene compases/);
});

test('secuencia: un tramo por acorde y el compás repartido', () => {
  const { eventos, tramos } = secuenciaProgresion('C', analizarProgresion(['IIm7 V7', 'Imaj7']), 120);
  assert.equal(tramos.length, 3);
  assert.deepEqual(
    tramos.map((t) => [t.compas, t.acorde, t.inicio, t.fin]),
    [
      [0, 0, 0, 1],
      [0, 1, 1, 2],
      [1, 0, 2, 4],
    ],
  );
  // Bajo de Dm7 = D3 (50), dentro de G2–F#3.
  assert.equal(eventos[0].midi, 50);
  assert.ok(eventos.every((e) => e.midi >= 40 && e.midi <= 88));
});

test('metrónomo, acordes sostenidos ligados y duración', () => {
  const compases = analizarProgresion(['IIm7', 'IIm7', 'V7']);
  const normal = secuenciaProgresion('C', compases, 120);
  assert.equal(normal.duracion, 6);
  assert.equal(normal.eventos.filter((e) => e.clic).length, 0);
  const clics = secuenciaProgresion('C', compases, 120, 4, { metronomo: true }).eventos.filter((e) => e.clic);
  assert.equal(clics.length, 12);
  assert.deepEqual(
    [clics[0].clic, clics[1].clic, clics[4].clic],
    ['fuerte', 'debil', 'fuerte'],
  );
  // Sostenido: los dos compases de Dm7 se ligan en notas de 4 s.
  const sost = secuenciaProgresion('C', compases, 120, 4, { sostenido: true }).eventos;
  assert.ok(sost.length < normal.eventos.length);
  assert.ok(sost.some((e) => e.midi === 50 && e.duracion === 4));
});

test('las progresiones del repositorio se entienden y la exportación se relee igual', () => {
  const datos = parse(readFileSync(new URL('../data/progresiones.yaml', import.meta.url), 'utf8')) as Progresion[];
  assert.ok(datos.length >= 10);
  for (const p of datos) assert.doesNotThrow(() => analizarProgresion(p.compases), p.id);
  assert.deepEqual(parse(progresionesAYaml(datos)), datos);
});

test('cambios locales sobre las del repositorio', () => {
  const base: Progresion[] = [
    { id: 'a', nombre: 'A', compases: ['I'] },
    { id: 'b', nombre: 'B', compases: ['V7'] },
  ];
  const lista = aplicarCambiosProgresiones(base, { a: null, c: { id: 'c', nombre: 'C', compases: ['IIm7'] } });
  assert.deepEqual(
    lista.map((p) => p.id),
    ['b', 'c'],
  );
});
