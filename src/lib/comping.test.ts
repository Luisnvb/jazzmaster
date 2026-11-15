import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarProgresion } from './progresiones.ts';
import { CELULAS, generarComping, secuenciaComping } from './comping.ts';

const PROG = {
  iiVI: analizarProgresion(['IIm7', 'V7', 'Imaj7', 'Imaj7']),
  corto: analizarProgresion(['IIm7 V7', 'Imaj7']),
  blues: analizarProgresion(['I7', 'IV7', 'I7', 'Vm7 I7', 'IV7', '#IV°7', 'I7', 'VI7alt', 'IIm7', 'V7', 'I7 VI7', 'IIm7 V7']),
};

test('células: golpes dentro del compás y ordenados', () => {
  for (const c of CELULAS) {
    assert.ok(c.golpes.length > 0);
    assert.ok(c.golpes.every((g, i) => g.corchea >= 0 && g.corchea <= 7 && g.dur > 0 && (i === 0 || g.corchea > c.golpes[i - 1].corchea)));
  }
});

test('anticipación: el golpe del «y» del 4 toca el acorde del compás siguiente', () => {
  const c = generarComping('C', PROG.iiVI, { celula: 'anticipacion', variacion: 'fijo', registro: 'medio', voicing: 'drop2' });
  const [g0, g1] = c.compases[0].golpes;
  assert.equal(g0.acorde, 0);
  assert.equal(g1.corchea, 7);
  assert.equal(g1.anticipa, true);
  assert.equal(g1.acorde, 1); // G7 adelantado
  // En el último compás no hay acorde siguiente: no anticipa.
  const ultimo = c.compases[3].golpes[1];
  assert.equal(ultimo.anticipa, false);
  assert.equal(ultimo.acorde, 3);
});

test('dos acordes por compás: cada golpe con el que suena', () => {
  const c = generarComping('C', PROG.corto, { celula: 'negras', variacion: 'fijo', registro: 'agudo', voicing: 'drop2' });
  assert.deepEqual(c.compases[0].golpes.map((g) => g.acorde), [0, 0, 1, 1]);
  assert.deepEqual(c.compases[0].acordes, [0, 1]);
  // Charlestón: el «y» del 2 cae justo antes de G7 (que entra en el 3), así que lo anticipa.
  const ch = generarComping('C', PROG.corto, { celula: 'charleston', variacion: 'fijo', registro: 'agudo', voicing: 'drop2' });
  assert.deepEqual(ch.compases[0].golpes.map((g) => [g.acorde, g.anticipa]), [[0, false], [1, true]]);
});

test('redonda con dos acordes por compás: el segundo también suena; ningún golpe pisa el cambio', () => {
  const c = generarComping('C', PROG.corto, { celula: 'redonda', variacion: 'fijo', registro: 'medio', voicing: 'drop2' });
  assert.deepEqual(c.compases[0].golpes.map((g) => [g.corchea, g.acorde]), [[0, 0], [4, 1]]);
  assert.equal(c.compases[0].golpes[0].dur, 4);
  for (const semilla of [1, 4, 8]) {
    const v = generarComping('C', PROG.blues, { celula: 'redonda', variacion: 'variado', registro: 'medio', voicing: 'drop2', semilla });
    const todos = v.compases.flatMap((x) => x.golpes);
    todos.forEach((g, j) => {
      if (todos[j + 1]) assert.ok(g.corchea + g.dur <= todos[j + 1].corchea + 1e-9, 'no se pisan');
      const cambio = v.inicioAcorde[g.acorde + 1];
      if (cambio !== undefined) assert.ok(g.corchea + g.dur <= cambio + 1e-9, 'no pasa del cambio de acorde');
    });
    v.compases.forEach((x) => x.acordes.forEach((k) => assert.ok(x.golpes.some((g) => g.acorde === k) || v.compases.some((y) => y.golpes.some((g) => g.acorde === k)))));
  }
});

test('variado: no repite célula en compases seguidos y anticipa al final de cada frase', () => {
  for (const semilla of [1, 2, 3, 9, 27]) {
    const c = generarComping('F', PROG.blues, { celula: 'charleston', variacion: 'variado', registro: 'alternar', voicing: 'drop2', semilla });
    c.compases.forEach((x, i) => {
      if (i > 0 && i % 4 !== 0) assert.notEqual(x.celula.id, c.compases[i - 1].celula.id, `compás ${i + 1}`);
      if (i % 4 === 3 && i < c.compases.length - 1) assert.ok(x.golpes.some((g) => g.anticipa), `compás ${i + 1}: anticipa`);
    });
    // Registro alternando cada cuatro compases: medio, agudo, medio.
    assert.deepEqual([0, 4, 8].map((i) => c.compases[i].registro), ['medio', 'agudo', 'medio']);
    assert.equal(c.voces.medio.length, 15);
  }
});

test('audio: un golpe por golpe, bajo a dos y charles; los shells también', () => {
  const c = generarComping('C', PROG.iiVI, { celula: 'charleston', variacion: 'fijo', registro: 'medio', voicing: 'shells' });
  const { eventos, golpes, duracion } = secuenciaComping('C', PROG.iiVI, c, 120, { bajo: true, charles: true, swing: 0.62 });
  assert.equal(duracion, 8);
  assert.equal(golpes.length, 8);
  assert.equal(eventos.filter((e) => e.clic).length, 8);
  // Bajo: dos notas por compás.
  const graves = eventos.filter((e) => !e.clic && e.midi < 52 && e.duracion > 0.9);
  assert.equal(graves.length, 8);
  // Shells: tres notas por golpe.
  assert.equal(eventos.filter((e) => !e.clic).length - graves.length, 8 * 3);
});
