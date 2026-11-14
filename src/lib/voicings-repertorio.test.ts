import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validarCmb } from './cmb.ts';
import { claveForma, encajaEnGrupo, voicingsDeCifrados } from './voicings-repertorio.ts';
import type { Voicing } from './acordes-datos.ts';

const cmb = validarCmb(JSON.parse(readFileSync(new URL('../content/repertorio/how-insensitive.cmb.json', import.meta.url), 'utf8')));
const GRUPOS = ['maj7', 'm7', 'mmaj7', 'dom7', 'sus', 'alt7', 'aug', 'm7b5', 'dim7'];

test('la misma forma en otra tónica es el mismo voicing', () => {
  const a = { grupo: 'm7', tonica: 'C', trastes: [8, 'x', 8, 8, 8, 'x'], grados: ['1', '', 'b7', 'b3', '5', ''] } as Voicing;
  const b = { ...a, tonica: 'D', trastes: [10, 'x', 10, 10, 10, 'x'] } as Voicing;
  assert.equal(claveForma(a), claveForma(b));
  assert.notEqual(claveForma(a), claveForma({ ...a, grupo: 'dom7' }));
});

test('voicings de un cifrado: sin repetidos, con ids únicos y la canción en las notas', () => {
  const nuevos = voicingsDeCifrados([{ titulo: 'How Insensitive', cmb }], [], GRUPOS);
  assert.ok(nuevos.length > 0);
  assert.equal(new Set(nuevos.map(claveForma)).size, nuevos.length);
  assert.equal(new Set(nuevos.map((v) => v.id)).size, nuevos.length);
  for (const v of nuevos) assert.match(v.notas!, /How Insensitive/);
  // Lo que ya existe no se vuelve a añadir.
  assert.deepEqual(voicingsDeCifrados([{ titulo: 'How Insensitive', cmb }], nuevos, GRUPOS), []);
});

test('qué formas incompletas encajan en cada grupo', () => {
  assert.ok(encajaEnGrupo('maj7', ['', '1', '3', '6', '9', ''])); // 6/9
  assert.ok(encajaEnGrupo('maj7', ['1', '5', '2', '3', '5', '1'])); // add9
  assert.ok(!encajaEnGrupo('maj7', ['', '1', '5', '1', '3', '5'])); // tríada
  assert.ok(!encajaEnGrupo('maj7', ['', '1', '5', '1', '2', '5'])); // sus2
  assert.ok(!encajaEnGrupo('maj7', ['1', '5', '1', '', '', ''])); // quinta
  assert.ok(encajaEnGrupo('mmaj7', ['', '1', '5', '6', 'b3', ''])); // m6
  assert.ok(!encajaEnGrupo('mmaj7', ['', '1', '5', '6', 'b2', ''])); // sin b3
  assert.ok(!encajaEnGrupo('m7', ['', '1', '5', '1', 'b3', '5'])); // tríada menor
  assert.ok(encajaEnGrupo('sus', ['', '1', '5', '1', '4', '5'])); // tríada sus4
});
