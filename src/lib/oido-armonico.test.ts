import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CUALIDADES,
  GRADOS_DIATONICOS,
  GRADOS_EXTRA,
  corregirCadena,
  eventosCadena,
  eventosCualidad,
  nuevaCadena,
  nuevaCualidad,
  nuevaProgresion,
  sumar,
} from './oido-armonico.ts';
import { parseAcordeGrado } from './progresiones.ts';

/** Azar repetible. */
const semilla = (s = 1) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

test('todas las cualidades y grados se entienden', () => {
  for (const c of CUALIDADES) assert.doesNotThrow(() => parseAcordeGrado(`I${c.sufijo}`), c.sufijo);
  for (const g of [...GRADOS_DIATONICOS, ...GRADOS_EXTRA]) assert.doesNotThrow(() => parseAcordeGrado(g), g);
});

test('cualidad: no repite la anterior y suena en bloque y arpegiada', () => {
  const azar = semilla(7);
  let p = nuevaCualidad(['maj7', 'm7'], ['C'], undefined, azar);
  for (let i = 0; i < 20; i++) {
    const q = nuevaCualidad(['maj7', 'm7'], ['C'], p, azar);
    assert.ok(q.modo === 'cualidad' && p.modo === 'cualidad' && q.sufijo !== p.sufijo);
    p = q;
  }
  const { eventos } = eventosCualidad('C', 'm7', 120);
  // Bajo + 4 notas en bloque + 4 arpegiadas.
  assert.equal(eventos.length, 9);
  assert.deepEqual(eventos.slice(5).map((e) => e.midi % 12), [0, 3, 7, 10]);
});

test('cadena: empieza en el I, sin repeticiones seguidas, y se corrige por acorde', () => {
  const azar = semilla(3);
  for (let i = 0; i < 30; i++) {
    const p = nuevaCadena(GRADOS_DIATONICOS, 4, ['C', 'F'], azar);
    assert.ok(p.modo === 'cadena');
    assert.equal(p.acordes.length, 4);
    assert.equal(p.acordes[0], 'Imaj7');
    assert.ok(p.acordes.every((a, k) => k === 0 || a !== p.acordes[k - 1]));
  }
  const p = { modo: 'cadena' as const, tonica: 'C', acordes: ['Imaj7', 'VIm7', 'IIm7', 'V7'] };
  assert.deepEqual(corregirCadena(p, ['VIm7', 'IVmaj7', 'V7']), [true, false, true]);
  const { tramos } = eventosCadena('C', p.acordes, 120);
  assert.equal(tramos.length, 4);
  assert.deepEqual(sumar({ aciertos: 1, intentos: 1 }, false), { aciertos: 1, intentos: 2 });
});

test('progresión: no repite la anterior', () => {
  const azar = semilla(11);
  const a = nuevaProgresion(['x', 'y'], ['C'], undefined, azar);
  const b = nuevaProgresion(['x', 'y'], ['C'], a, azar);
  assert.ok(a.modo === 'progresion' && b.modo === 'progresion' && a.id !== b.id);
});
