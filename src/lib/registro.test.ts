import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  alternarPausa,
  cerrarSesion,
  diaDe,
  duracion,
  enCursoValido,
  racha,
  reloj,
  reparto,
  segundosEnCurso,
  sesionesValidas,
  totalDesde,
  totalesPorDia,
  ultimosDias,
  unirSesiones,
  type EnCurso,
  type Sesion,
} from './registro.ts';

/** Una sesión el día `dia` (AAAA-MM-DD) a mediodía, hora local. */
const sesion = (id: string, dia: string, minutos: number, seccion = 'acordes', actividad = 'Drop 2'): Sesion => ({
  id,
  inicio: new Date(`${dia}T12:00:00`).toISOString(),
  segundos: minutos * 60,
  actividad,
  seccion,
});

test('cronómetro: corre, se pausa, se reanuda y se cierra', () => {
  const t0 = 1_000_000;
  let e: EnCurso = { desde: t0, acumulado: 0, empezada: t0, actividad: 'Drop 2', seccion: 'acordes', nota: ' bien ' };
  assert.equal(segundosEnCurso(e, t0 + 30_000), 30);
  e = alternarPausa(e, t0 + 60_000);
  assert.deepEqual([e.desde, e.acumulado], [null, 60]);
  assert.equal(segundosEnCurso(e, t0 + 600_000), 60);
  e = alternarPausa(e, t0 + 600_000);
  const s = cerrarSesion(e, t0 + 630_000, 's-1')!;
  assert.equal(s.segundos, 90);
  assert.equal(s.inicio, new Date(t0).toISOString());
  assert.equal(s.nota, 'bien');
  assert.equal(cerrarSesion({ ...e, acumulado: 0, desde: t0 }, t0 + 3000, 'x'), null);
});

test('días y totales', () => {
  const hoy = new Date(2026, 10, 22, 18, 0);
  assert.deepEqual(ultimosDias(hoy, 3), ['2026-11-20', '2026-11-21', '2026-11-22']);
  assert.deepEqual(ultimosDias(new Date(2026, 2, 1), 2), ['2026-02-28', '2026-03-01']);
  const sesiones = [sesion('a', '2026-11-22', 20), sesion('b', '2026-11-22', 10, 'oido-tecnica', 'Intervalos'), sesion('c', '2026-11-20', 15)];
  assert.deepEqual(totalesPorDia(sesiones, ultimosDias(hoy, 3)), [900, 0, 1800]);
  assert.equal(totalDesde(sesiones, '2026-11-21'), 1800);
  assert.deepEqual(reparto(sesiones, '2026-11-01', 'seccion'), [
    { clave: 'acordes', segundos: 2100 },
    { clave: 'oido-tecnica', segundos: 600 },
  ]);
  assert.equal(diaDe(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('racha: cuenta hasta hoy, o hasta ayer si hoy aún no hay nada', () => {
  const hoy = new Date(2026, 10, 22, 9, 0);
  const tres = [sesion('a', '2026-11-20', 5), sesion('b', '2026-11-21', 5), sesion('c', '2026-11-22', 5)];
  assert.equal(racha(tres, hoy), 3);
  assert.equal(racha(tres.slice(0, 2), hoy), 2);
  assert.equal(racha([sesion('a', '2026-11-19', 5)], hoy), 0);
  assert.equal(racha([], hoy), 0);
});

test('lo leído o importado se sanea y se une por id', () => {
  const validas = sesionesValidas([sesion('a', '2026-11-22', 5), { id: 'b' }, null, { ...sesion('c', '2026-11-21', 1), seccion: 3 }, { ...sesion('d', '2026-11-21', 1), inicio: 'ayer' }]);
  assert.deepEqual(validas.map((s) => [s.id, s.seccion]), [
    ['a', 'acordes'],
    ['c', 'otra'],
  ]);
  assert.deepEqual(sesionesValidas('nada'), []);
  const unidas = unirSesiones([sesion('a', '2026-11-20', 5)], [sesion('a', '2026-11-20', 9), sesion('b', '2026-11-22', 1)]);
  assert.deepEqual(unidas.map((s) => [s.id, s.segundos]), [
    ['b', 60],
    ['a', 540],
  ]);
  assert.equal(enCursoValido({ acumulado: 'x' }), null);
  assert.equal(enCursoValido({ acumulado: 3, empezada: 1, actividad: 'Drop 2' })!.desde, null);
});

test('formatos de duración', () => {
  assert.equal(duracion(40), '40 s');
  assert.equal(duracion(12 * 60), '12 min');
  assert.equal(duracion(65 * 60), '1 h 05 min');
  assert.equal(reloj(452), '0:07:32');
  assert.equal(reloj(3600 * 2 + 5), '2:00:05');
});
