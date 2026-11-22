import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OPCIONES_INICIALES,
  bpmDeToques,
  cambiarPulsos,
  compasEnSilencio,
  eventosCompas,
  opcionesValidas,
  pulsoEn,
  siguienteAcento,
  tempoEnCompas,
  type OpcionesMetronomo,
} from './metronomo.ts';

const con = (cambios: Partial<OpcionesMetronomo>): OpcionesMetronomo => ({ ...OPCIONES_INICIALES, ...cambios });

test('acentos: el ciclo y el cambio de pulsos conserva lo marcado', () => {
  assert.equal(siguienteAcento('fuerte'), 'debil');
  assert.equal(siguienteAcento('debil'), 'mudo');
  assert.equal(siguienteAcento('mudo'), 'fuerte');
  assert.deepEqual(cambiarPulsos(['fuerte', 'mudo', 'debil'], 5), ['fuerte', 'mudo', 'debil', 'debil', 'debil']);
  assert.deepEqual(cambiarPulsos(['fuerte', 'mudo', 'debil'], 2), ['fuerte', 'mudo']);
  assert.equal(cambiarPulsos([], 40).length, 12);
});

test('un compás de 4 a 60 BPM: un clic por segundo, el primero fuerte', () => {
  const { eventos, duracion, pulsos } = eventosCompas(OPCIONES_INICIALES, 60);
  assert.equal(duracion, 4);
  assert.deepEqual(pulsos, [0, 1, 2, 3]);
  assert.deepEqual(
    eventos.map((e) => [e.inicio, e.clic]),
    [
      [0, 'fuerte'],
      [1, 'debil'],
      [2, 'debil'],
      [3, 'debil'],
    ],
  );
});

test('pulsos mudos, subdivisiones y swing', () => {
  const mudo = eventosCompas(con({ acentos: ['fuerte', 'mudo', 'debil', 'mudo'] }), 60);
  assert.deepEqual(mudo.eventos.map((e) => e.inicio), [0, 2]);
  const tresillos = eventosCompas(con({ acentos: ['fuerte'], subdivision: 3 }), 60);
  assert.deepEqual(tresillos.eventos.map((e) => +e.inicio.toFixed(3)), [0, 0.333, 0.667]);
  assert.ok(tresillos.eventos.slice(1).every((e) => e.volumen! < 1));
  const swing = eventosCompas(con({ acentos: ['fuerte', 'debil'], subdivision: 2, swing: 67 }), 60);
  assert.deepEqual(swing.eventos.map((e) => e.inicio), [0, 0.67, 1, 1.67]);
});

test('compás callado: los mismos clics, sin volumen', () => {
  const { eventos } = eventosCompas(OPCIONES_INICIALES, 100, true);
  assert.equal(eventos.length, 4);
  assert.ok(eventos.every((e) => e.volumen === 0));
});

test('subida de tempo por compases, con tope', () => {
  const op = con({ bpm: 100, subida: { activa: true, paso: 5, cada: 4, hasta: 110 } });
  assert.deepEqual([0, 3, 4, 7, 8, 12, 40].map((c) => tempoEnCompas(op, c)), [100, 100, 105, 105, 110, 110, 110]);
  assert.equal(tempoEnCompas(con({ subida: { activa: false, paso: 5, cada: 1, hasta: 200 } }), 10), 100);
});

test('compases en silencio: suenan 2, callan 1', () => {
  const op = con({ silencio: { activo: true, suenan: 2, callan: 1 } });
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((c) => compasEnSilencio(op, c)), [false, false, true, false, false, true]);
});

test('pulso que suena', () => {
  assert.equal(pulsoEn([0, 0.5, 1, 1.5], 0.7), 1);
  assert.equal(pulsoEn([0, 0.5, 1, 1.5], 2), 3);
});

test('tap tempo: media de los intervalos y reinicio tras una pausa', () => {
  assert.equal(bpmDeToques([0]), null);
  assert.equal(bpmDeToques([0, 500, 1000, 1500]), 120);
  assert.equal(bpmDeToques([0, 1000, 5000, 5600, 6200]), 100);
});

test('opciones guardadas: se completan y se sanean', () => {
  const o = opcionesValidas({ bpm: 1000, acentos: ['fuerte', 'raro'], subdivision: 7, subida: { activa: true } });
  assert.equal(o.bpm, 300);
  assert.deepEqual(o.acentos, ['fuerte', 'debil']);
  assert.equal(o.subdivision, 1);
  assert.deepEqual(o.subida, { activa: true, paso: 5, cada: 4, hasta: 160 });
  assert.deepEqual(opcionesValidas(null), OPCIONES_INICIALES);
});
