import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  secuenciaArpegio,
  secuenciaArpegiosPorGrado,
  secuenciaEscala,
  secuenciaIntervalo,
  secuenciaVoicing,
} from './secuencias.ts';
import { RANGO_GUITARRA } from './teoria.ts';

const alturas = (ev: { midi: number }[]) => ev.map((e) => e.midi);

test('intervalos', () => {
  assert.deepEqual(alturas(secuenciaIntervalo('C', 'b3', 'ascendente')), [48, 51]);
  assert.deepEqual(alturas(secuenciaIntervalo('C', 'b3', 'descendente')), [48, 45]);
  const arm = secuenciaIntervalo('C', '5', 'armonico');
  assert.deepEqual(alturas(arm), [48, 55]);
  assert.ok(arm.every((e) => e.inicio === 0));
  // Octava descendente desde E3 bajaría a E2: cabe justo.
  assert.deepEqual(alturas(secuenciaIntervalo('E', '8', 'descendente')), [52, 40]);
  // Desde C3 una 8ª abajo (C2) se sale: sube todo una octava.
  assert.deepEqual(alturas(secuenciaIntervalo('C', '8', 'descendente')), [60, 48]);
});

test('escalas', () => {
  const asc = secuenciaEscala('C', ['1', '2', '3', '4', '5', '6', '7'], 'ascendente', 120);
  assert.deepEqual(alturas(asc), [48, 50, 52, 53, 55, 57, 59, 60]);
  assert.equal(asc[1].inicio, 0.5);
  const desc = secuenciaEscala('C', ['1', '2', '3', '4', '5', '6', '7'], 'descendente', 120);
  assert.deepEqual(alturas(desc), [60, 59, 57, 55, 53, 52, 50, 48]);
  // Superlocrio: #2 (3 st) va después de b2 y antes de 3.
  assert.deepEqual(alturas(secuenciaEscala('C', ['1', 'b2', '#2', '3', 'b5', '#5', 'b7'], 'ascendente', 120)), [48, 49, 51, 52, 54, 56, 58, 60]);
});

test('arpegios', () => {
  assert.deepEqual(alturas(secuenciaArpegio('C', ['1', 'b3', 'b5', 'bb7'], 100)), [48, 51, 54, 57, 60]);
  const porGrado = secuenciaArpegiosPorGrado('C', ['1', '2', '3', '4', '5', '6', '7'], 120);
  assert.equal(porGrado.length, 28);
  assert.deepEqual(alturas(porGrado.slice(4, 8)), [50, 53, 57, 60]); // Dm7
  assert.equal(porGrado[4].inicio, 2.5); // tras 4 notas y un pulso de silencio
  assert.throws(() => secuenciaArpegiosPorGrado('C', ['1', '2', '3', '5', '6'], 120));
});

test('voicings', () => {
  const rasgueo = secuenciaVoicing(['x', 3, 5, 4, 5, 'x'], 'rasgueo', 100);
  assert.deepEqual(alturas(rasgueo), [48, 55, 59, 64]); // C G B E
  assert.ok(rasgueo[3].inicio < 0.2);
  const final = rasgueo.map((e) => e.inicio + e.duracion);
  assert.ok(final.every((f) => Math.abs(f - final[0]) < 1e-9), 'todas las cuerdas se apagan a la vez');
});

test('todo cae en el rango de la guitarra', () => {
  for (const t of ['C', 'F#', 'B', 'Bb', 'E']) {
    const ev = [
      ...secuenciaEscala(t, ['1', '2', '3', '4', '5', '6', '7'], 'ascendente', 120),
      ...secuenciaArpegiosPorGrado(t, ['1', '2', 'b3', '4', '5', '6', 'b7'], 120),
      ...secuenciaIntervalo(t, '8', 'descendente'),
    ];
    assert.ok(ev.every((e) => e.midi >= RANGO_GUITARRA.min && e.midi <= RANGO_GUITARRA.max), t);
  }
});

test('ligar notas repetidas seguidas (pad continuo)', async () => {
  const { ligarRepetidos } = await import('./secuencias.ts');
  const ligados = ligarRepetidos([
    { midi: 60, inicio: 0, duracion: 1 },
    { midi: 64, inicio: 0, duracion: 1 },
    { midi: 60, inicio: 1, duracion: 1 },
    { midi: 67, inicio: 1, duracion: 1 },
    { midi: 60, inicio: 3, duracion: 1 },
  ]);
  assert.deepEqual(
    ligados.map((e) => [e.midi, e.inicio, e.duracion]),
    [
      [60, 0, 2],
      [64, 0, 1],
      [67, 1, 1],
      [60, 3, 1],
    ],
  );
});

test('voicing continuo: sostenido sin bucle o rasgueo por compás', async () => {
  const { secuenciaVoicingContinua } = await import('./secuencias.ts');
  const trastes = ['x', 3, 2, 0, 1, 0] as const;
  const sost = secuenciaVoicingContinua(trastes, 120, true);
  assert.equal(sost.vuelta, null);
  assert.equal(sost.eventos.length, 5);
  assert.ok(sost.eventos.every((e) => e.inicio === 0 && e.duracion >= 600));
  const rasg = secuenciaVoicingContinua(trastes, 120, false);
  assert.equal(rasg.vuelta, 2);
  assert.ok(rasg.eventos.every((e) => e.inicio + e.duracion > 2));
});

test('escala continua: sube y baja sin repetir extremos', async () => {
  const { secuenciaEscalaContinua } = await import('./secuencias.ts');
  const { eventos, vuelta } = secuenciaEscalaContinua('C', ['1', '2', '3', '4', '5', '6', '7'], 120);
  // C D E F G A B C B A G F E D → 14 notas; a 120 BPM, 7 s por vuelta.
  assert.deepEqual(eventos.map((e) => e.midi), [48, 50, 52, 53, 55, 57, 59, 60, 59, 57, 55, 53, 52, 50]);
  assert.equal(vuelta, 7);
});
