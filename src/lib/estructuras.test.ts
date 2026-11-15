import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { validarCmb } from './cmb.ts';
import { analizarProgresion } from './progresiones.ts';
import {
  FORMAS,
  RHYTHM_A,
  RHYTHM_B,
  compasesDeCifrado,
  gradoRomano,
  indiceLetra,
  inicios,
  nombresSecciones,
  totalCompases,
  ubicar,
} from './estructuras.ts';

const cifrado = (id: string) => validarCmb(JSON.parse(readFileSync(`src/content/repertorio/${id}.cmb.json`, 'utf8')));
const ejemplos = FORMAS.flatMap((f) => f.ejemplos);

test('grado romano con la grafía de la nota', () => {
  assert.equal(gradoRomano('F', 'Eb'), 'bVII');
  assert.equal(gradoRomano('F', 'E'), 'VII');
  assert.equal(gradoRomano('C', 'F#'), '#IV');
  assert.equal(gradoRomano('C', 'Gb'), 'bV');
  assert.equal(gradoRomano('Bb', 'Bb'), 'I');
  assert.equal(gradoRomano('Bb', 'E'), '#IV');
  assert.equal(gradoRomano('F', 'Db'), 'bVI');
});

test('cada ejemplo tiene tantos compases como suman sus secciones, y todos se entienden', () => {
  for (const e of ejemplos) {
    const compases = e.compases ?? compasesDeCifrado(cifrado(e.cancion!), e.tonica);
    assert.equal(compases.length, totalCompases(e.secciones), e.id);
    assert.doesNotThrow(() => analizarProgresion(compases), e.id);
  }
});

test('los temas del Repertorio salen de su cifrado y los modelos no lo necesitan', () => {
  for (const e of ejemplos) assert.ok(e.cancion ? !e.compases : e.compases, e.id);
  const dias = compasesDeCifrado(cifrado('days-of-wine-and-roses'), 'F');
  assert.match(dias[0], /^Imaj/);
  assert.equal(dias[1], 'bVII7');
  // ABAC: las dos A son iguales; B y C, distintas.
  assert.deepEqual(dias.slice(0, 8), dias.slice(16, 24));
  assert.notDeepEqual(dias.slice(8, 16), dias.slice(24, 32));
  // Blues en C: I7 – IV7 – I7 – I7.
  assert.deepEqual(compasesDeCifrado(cifrado('turnaround'), 'C').slice(0, 4), ['I7', 'IV7', 'I7', 'I7']);
});

test('E.S.P. es AA′: los 12 primeros compases de cada mitad son iguales', () => {
  const esp = compasesDeCifrado(cifrado('esp'), 'F');
  assert.deepEqual(esp.slice(0, 12), esp.slice(16, 28));
  assert.notDeepEqual(esp.slice(12, 16), esp.slice(28, 32));
});

test('rhythm changes: las A y el puente son los de progresiones.yaml', () => {
  const yaml = parse(readFileSync('src/data/progresiones.yaml', 'utf8')) as { id: string; compases: string[] }[];
  assert.deepEqual(RHYTHM_A, yaml.find((p) => p.id === 'rhythm-changes-a')!.compases);
  assert.deepEqual(RHYTHM_B, yaml.find((p) => p.id === 'rhythm-changes-b')!.compases);
  const rc = FORMAS.find((f) => f.id === 'rhythm-changes')!.ejemplos[0].compases!;
  assert.deepEqual(rc.slice(0, 8), RHYTHM_A);
  assert.equal(rc[15], 'Imaj7'); // 2ª casilla
  assert.deepEqual(rc.slice(16, 24), RHYTHM_B);
  assert.deepEqual(rc.slice(24), rc.slice(8, 16));
});

test('el modelo AABA: la 1ª A acaba en turnaround y la 2ª y la 3ª en la tónica', () => {
  const m = FORMAS.find((f) => f.id === 'aaba')!.ejemplos[0].compases!;
  assert.equal(m[7], 'IIm7 V7');
  assert.equal(m[15], 'Imaj7');
  assert.equal(m[31], 'Imaj7');
  assert.equal(m[23], 'V7'); // el puente acaba en el dominante
});

test('inicios, ubicación y nombres de las secciones', () => {
  const s = FORMAS.find((f) => f.id === 'aaba')!.ejemplos[0].secciones;
  assert.deepEqual(inicios(s), [0, 8, 16, 24]);
  assert.deepEqual(ubicar(s, 0), { seccion: 0, enSeccion: 0 });
  assert.deepEqual(ubicar(s, 17), { seccion: 2, enSeccion: 1 });
  assert.deepEqual(ubicar(s, 31), { seccion: 3, enSeccion: 7 });
  assert.deepEqual(nombresSecciones(s), ['A1', 'A2', 'B', 'A3']);
  const abac = FORMAS.find((f) => f.id === 'abac')!.ejemplos[0].secciones;
  assert.deepEqual(nombresSecciones(abac), ['A1', 'B', 'A2', 'C']);
  assert.equal(indiceLetra('A′'), 0);
  assert.equal(indiceLetra('C'), 2);
});
