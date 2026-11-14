import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { analizarProgresion } from './progresiones.ts';
import { AFINACION } from './secuencias.ts';
import { conTension, eventosShells, shellsProgresion } from './shells.ts';

const nombres = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notas = (t: (number | 'x')[]) => t.flatMap((f, c) => (f === 'x' ? [] : [nombres[(AFINACION[c] + f) % 12]]));

test('ii–V–I en Do: raíz, 3 y 7 de cada acorde, con la mano casi quieta', () => {
  const c = analizarProgresion(['IIm7', 'V7', 'Imaj7']);
  const s = shellsProgresion('C', c);
  assert.deepEqual(s.map((x) => x.simbolo), ['Dm7', 'G7', 'Cmaj7']);
  assert.deepEqual(notas(s[0].trastes).sort(), ['C', 'D', 'F']);
  assert.deepEqual(notas(s[1].trastes).sort(), ['B', 'F', 'G']);
  assert.deepEqual(notas(s[2].trastes).sort(), ['B', 'C', 'E']);
  // La raíz siempre en el bajo, en 6ª o 5ª.
  for (const x of s) assert.equal(x.grados.find(Boolean), '1');
  // La mano no salta más de 3 trastes entre acordes.
  const centro = (t: (number | 'x')[]) => {
    const p = t.filter((f): f is number => f !== 'x');
    return p.reduce((a, b) => a + b, 0) / p.length;
  };
  for (let i = 1; i < s.length; i++) assert.ok(Math.abs(centro(s[i].trastes) - centro(s[i - 1].trastes)) <= 3);
  for (const x of s) {
    const f = x.trastes.filter((v): v is number => v !== 'x');
    assert.ok(Math.max(...f) - Math.min(...f) <= 3, 'las cuatriadas sin estirar');
  }
});

test('todas las progresiones tienen shells en todas las tónicas', () => {
  const ps = parse(readFileSync(new URL('../data/progresiones.yaml', import.meta.url), 'utf8')) as { compases: string[] }[];
  for (const p of ps) {
    for (const t of ['C', 'Eb', 'F#', 'A']) {
      const s = shellsProgresion(t, analizarProgresion(p.compases));
      for (const x of s) {
        const f = x.trastes.filter((v): v is number => v !== 'x');
        assert.ok(Math.max(...f) - Math.min(...f) <= 4);
        assert.equal(f.length, 3);
      }
    }
  }
});

test('tensión encima y audio', () => {
  const c = analizarProgresion(['IIm7', 'V7', 'Imaj7']);
  const s = shellsProgresion('C', c).map((x, i) => conTension(x, c.flat()[i], 'C'));
  assert.ok(s.some((x) => x.grados.includes('13') || x.grados.includes('9')));
  const { tramos, duracion } = eventosShells(c, s, 120);
  assert.equal(tramos.length, 3);
  assert.equal(duracion, 6);
});
