import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESCALAS_MOTIVO, MOTIVOS_EJEMPLO, TRANSFORMACIONES, frase, notasReales, rolloSVG, secuenciaFrase, type Contexto, type Motivo } from './motivos.ts';

const escala = (id: string) => ESCALAS_MOTIVO.find((e) => e.id === id)!;
const C: Contexto = { tonica: 'C', escala: escala('jonica') };
const motivo = (id: string) => MOTIVOS_EJEMPLO.find((m) => m.id === id)!.motivo;
const t = (id: string) => TRANSFORMACIONES.find((x) => x.id === id)!;
const nombres = (ctx: Contexto, m: Motivo, id: string) => t(id).aplicar(ctx, m, 8).map((x) => x.nota).join(' ');
const ritmo = (ctx: Contexto, m: Motivo, id: string) => t(id).aplicar(ctx, m, 8).map((x) => `${x.inicio}+${x.dur}`).join(' ');

test('el motivo en la escala: nombres, alturas y ritmo', () => {
  const notas = notasReales(C, motivo('arpegio'));
  assert.deepEqual(notas.map((x) => x.nota), ['C', 'E', 'G']);
  assert.deepEqual(notas.map((x) => x.midi), [60, 64, 67]);
  assert.deepEqual(notas.map((x) => [x.inicio, x.dur]), [[0, 1], [1, 1], [2, 2]]);
  assert.deepEqual(notasReales(C, motivo('cromatico')).map((x) => x.nota), ['G', 'Gb', 'F', 'E']);
  // En dórica, la 3 del arpegio es menor.
  assert.deepEqual(notasReales({ tonica: 'D', escala: escala('dorica') }, motivo('arpegio')).map((x) => x.nota), ['D', 'F', 'A']);
});

test('transformaciones de la altura sobre 1–3–5 en C mayor', () => {
  const m = motivo('arpegio');
  assert.equal(nombres(C, m, 'repeticion'), 'C E G');
  assert.equal(nombres(C, m, 'secuencia'), 'D F A');
  assert.equal(nombres(C, m, 'transposicion'), 'F A C');
  assert.equal(nombres(C, m, 'inversion'), 'C A F');
  assert.deepEqual(t('inversion').aplicar(C, m, 8).map((x) => x.midi), [60, 57, 53]);
  assert.equal(nombres(C, m, 'retrogradacion'), 'G E C');
  assert.equal(nombres(C, m, 'ampliacion'), 'C G D');
  assert.deepEqual(t('ampliacion').aplicar(C, m, 8).map((x) => x.midi), [60, 67, 74]);
  assert.equal(nombres(C, m, 'fragmentacion'), 'C E C E');
});

test('transformaciones del ritmo', () => {
  const m = motivo('arpegio'); // C (1) E (1) G (2) desde el tiempo 1
  assert.equal(ritmo(C, m, 'repeticion'), '8+1 9+1 10+2');
  assert.equal(ritmo(C, m, 'desplazamiento'), '9+1 10+1 11+2');
  assert.equal(ritmo(C, m, 'aumentacion'), '8+2 10+2 12+4');
  assert.equal(ritmo(C, m, 'disminucion'), '8+0.5 8.5+0.5 9+1 10+0.5 10.5+0.5 11+1');
  // Retrogradación: la nota larga primero.
  assert.equal(ritmo(C, m, 'retrogradacion'), '8+2 10+1 11+1');
  // Con silencios y anacrusa: se conservan y se dan la vuelta.
  const ch = motivo('charleston'); // G (3) A (1) · silencio (1) · G (2)
  assert.equal(ritmo(C, ch, 'repeticion'), '8+3 11+1 13+2');
  assert.equal(ritmo(C, ch, 'retrogradacion'), '8+2 11+1 12+3');
  assert.equal(ritmo(C, motivo('llamada'), 'repeticion'), '9+1 10+1 11+1 12+4');
});

test('la inversión invierte también las alteraciones', () => {
  // G Gb F E → desde G: G G# A B.
  assert.equal(nombres(C, motivo('cromatico'), 'inversion'), 'G G# A B');
});

test('frase: original en el primer compás y transformación desde el segundo', () => {
  for (const tr of TRANSFORMACIONES) {
    for (const { motivo: m } of MOTIVOS_EJEMPLO) {
      const f = frase(C, m, tr);
      assert.ok(f.original.every((x) => x.inicio < 8), tr.id);
      assert.ok(f.transformada.every((x) => x.inicio >= 8), tr.id);
      assert.ok(f.compases >= 2 && f.transformada.every((x) => x.inicio + x.dur <= f.compases * 8), tr.id);
      const svg = rolloSVG(f.original, f.transformada, f.compases);
      assert.equal((svg.match(/data-k=/g) ?? []).length, f.original.length + f.transformada.length);
    }
  }
  // La aumentación de un motivo largo necesita un compás más.
  assert.equal(frase(C, motivo('llamada'), t('aumentacion')).compases, 3);
});

test('audio: una nota por nota, swing y acorde de fondo', () => {
  const f = frase(C, motivo('arpegio'), t('repeticion'));
  const notas = [...f.original, ...f.transformada];
  const { eventos, tiempos, duracion } = secuenciaFrase(C, notas, f.compases, 120, { swing: 2 / 3, acorde: true });
  assert.equal(duracion, 4);
  assert.equal(tiempos.length, 6);
  assert.ok(Math.abs(tiempos[1].inicio - 1 / 3) < 1e-9); // la E, a contratiempo con swing
  assert.equal(eventos.length, 6 + 2 * 3); // notas + (bajo y dos guías) por compás
});
