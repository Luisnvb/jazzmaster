import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NIVELES, TONICAS_GENERADOR, anteriores, generarProgresion, tonicaAlAzar, type Nivel } from './generador-progresiones.ts';
import { analizarProgresion, simboloEn } from './progresiones.ts';
import type { Modo } from './circulo.ts';

/** Azar repetible (generador congruencial). */
function semilla(n: number) {
  let s = n;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

const DIATONICOS: Record<Modo, string[]> = {
  mayor: ['Imaj7', 'IIm7', 'IIIm7', 'IVmaj7', 'V7', 'VIm7', 'VIIm7b5'],
  menor: ['Im7', 'IIm7b5', 'bIIImaj7', 'IVm7', 'V7b9', 'bVImaj7', 'bVII7'],
};

test('todas las progresiones se pueden leer y acaban en la tónica', () => {
  for (const modo of ['mayor', 'menor'] as const) {
    for (const { id: nivel } of NIVELES) {
      for (let i = 0; i < 40; i++) {
        const p = generarProgresion({ modo, nivel, compases: 8, dosPorCompas: 0.5 }, semilla(i * 7 + 1));
        assert.equal(p.length, 8);
        assert.doesNotThrow(() => analizarProgresion(p), p.join(' | '));
        assert.equal(p[7], modo === 'mayor' ? 'Imaj7' : 'Im7');
      }
    }
  }
});

test('cada acorde es uno de los que pueden ir antes del siguiente', () => {
  for (const modo of ['mayor', 'menor'] as const) {
    for (let i = 0; i < 30; i++) {
      const nivel: Nivel = 'sustituciones';
      const acordes = generarProgresion({ modo, nivel, compases: 12, dosPorCompas: 0.4 }, semilla(i + 100)).flatMap((c) => c.split(' '));
      for (let k = 0; k < acordes.length - 1; k++) {
        assert.ok(
          anteriores(acordes[k + 1], modo, nivel).some(([a]) => a === acordes[k]),
          `${acordes[k]} → ${acordes[k + 1]}`,
        );
      }
    }
  }
});

test('el nivel diatónico solo usa acordes de la tonalidad', () => {
  for (const modo of ['mayor', 'menor'] as const) {
    for (let i = 0; i < 30; i++) {
      const acordes = generarProgresion({ modo, nivel: 'diatonico', compases: 16, dosPorCompas: 0.5 }, semilla(i + 300)).flatMap((c) => c.split(' '));
      for (const a of acordes) assert.ok(DIATONICOS[modo].includes(a), a);
    }
  }
});

test('un acorde por compás sin dos por compás; el número de compases se acota', () => {
  const p = generarProgresion({ modo: 'mayor', nivel: 'secundarios', compases: 4, dosPorCompas: 0 }, semilla(5));
  assert.ok(p.every((c) => !c.includes(' ')));
  assert.equal(generarProgresion({ modo: 'mayor', nivel: 'diatonico', compases: 100, dosPorCompas: 0 }, semilla(1)).length, 32);
});

test('se escribe en cualquier tónica del generador', () => {
  const p = analizarProgresion(['IIm7 V7', 'Imaj7']);
  assert.equal(simboloEn('Db', p[0][1]), 'Ab7');
  assert.equal(TONICAS_GENERADOR.menor.length, 12);
  assert.equal(tonicaAlAzar('mayor', () => 0.99), 'B');
});
