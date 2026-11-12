import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevaPregunta, pista, responder } from './entrenador.ts';

/** Generador con una secuencia fija de valores en [0, 1). */
const secuencia = (...valores: number[]) => {
  let i = 0;
  return () => valores[i++ % valores.length];
};

test('elige dentro de lo permitido', () => {
  for (let i = 0; i < 200; i++) {
    const p = nuevaPregunta(['tercera-menor', 'quinta-justa'], ['ascendente', 'armonico'], ['C', 'Eb']);
    assert.ok(['tercera-menor', 'quinta-justa'].includes(p.intervalo));
    assert.ok(['ascendente', 'armonico'].includes(p.modo));
    assert.ok(['C', 'Eb'].includes(p.tonica));
  }
});

test('no repite la pregunta anterior si hay alternativa', () => {
  const anterior = { intervalo: 'a', modo: 'ascendente' as const, tonica: 'C' };
  // Primero sale "a" ascendente (repetida), después "b".
  const p = nuevaPregunta(['a', 'b'], ['ascendente'], ['C'], anterior, secuencia(0, 0, 0, 0.9, 0, 0));
  assert.equal(p.intervalo, 'b');
  // Con una sola opción, se repite sin bloquearse.
  assert.equal(nuevaPregunta(['a'], ['ascendente'], ['C'], anterior).intervalo, 'a');
});

test('exige opciones', () => {
  assert.throws(() => nuevaPregunta([], ['ascendente'], ['C']));
});

test('marcador y pista', () => {
  const p = { intervalo: 'a', modo: 'descendente' as const, tonica: 'C' };
  const r1 = responder({ aciertos: 0, intentos: 0 }, p, 'a');
  assert.deepEqual(r1, { acierto: true, marcador: { aciertos: 1, intentos: 1 } });
  const r2 = responder(r1.marcador, p, 'b');
  assert.deepEqual(r2, { acierto: false, marcador: { aciertos: 1, intentos: 2 } });
  const refs = { ascendente: ['Arriba'], descendente: ['Abajo'] };
  assert.deepEqual(pista(refs, 'descendente'), ['Abajo']);
  assert.deepEqual(pista(refs, 'armonico'), ['Arriba']);
});
