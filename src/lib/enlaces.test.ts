import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { CUALIDADES_CAPAS, cualidadCapas } from './capas.ts';
import { DESDE_CUALIDAD, DESDE_GRUPO, enlaceArpegios, enlaceCapas, enlaceGrupo, leerDestinoCapas } from './enlaces.ts';
import { parseAcordeGrado } from './progresiones.ts';

const grupos = (parse(readFileSync(new URL('../data/grupos.yaml', import.meta.url), 'utf8')) as { id: string }[]).map((g) => g.id);
const arpegiosPagina = readFileSync(new URL('../pages/estudio/arpegios.astro', import.meta.url), 'utf8');

test('cada grupo de acordes va a una cualidad (y escala) de Mástil por capas y a un arpegio que existen', () => {
  assert.deepEqual(Object.keys(DESDE_GRUPO).sort(), [...grupos].sort());
  for (const [g, { capas, arpegio }] of Object.entries(DESDE_GRUPO)) {
    const c = CUALIDADES_CAPAS.find((x) => x.id === capas.cualidad);
    assert.ok(c, g);
    if (capas.escala) assert.ok(c.escalas.some((e) => e.id === capas.escala), `${g}: ${capas.escala}`);
    if (arpegio) {
      assert.doesNotThrow(() => parseAcordeGrado(arpegio));
      assert.ok(arpegiosPagina.includes(`['${arpegio}',`), `${g}: ${arpegio} no está en Arpegios`);
    }
  }
});

test('cada cualidad de Mástil por capas tiene grupo y, si lo hay, arpegio de la página', () => {
  assert.deepEqual(Object.keys(DESDE_CUALIDAD).sort(), CUALIDADES_CAPAS.map((c) => c.id).sort());
  for (const [id, { grupo, arpegio, triada }] of Object.entries(DESDE_CUALIDAD)) {
    assert.ok(grupos.includes(grupo), id);
    if (arpegio) assert.ok(arpegiosPagina.includes(`['${arpegio}',`), `${id}: ${arpegio}`);
    assert.equal(triada === true, parseAcordeGrado(cualidadCapas(id).romano).formula.length === 3, id);
  }
});

test('direcciones: se construyen y Mástil por capas lee solo lo válido', () => {
  const url = enlaceCapas('/t/estudio/capas/', 'Bb', { cualidad: '7', escala: 'alterada' });
  assert.equal(url, '/t/estudio/capas/?tonica=Bb&cualidad=7&escala=alterada');
  assert.equal(enlaceArpegios('/arpegios/', 'F#', 'I°7'), '/arpegios/?tonica=F%23&cualidad=I%C2%B07');
  assert.equal(enlaceGrupo('/acordes/', 'Eb', 'm7b5'), '/acordes/?tonica=Eb#grupo-m7b5');
  assert.deepEqual(leerDestinoCapas(url.slice(url.indexOf('?'))), { cualidad: '7', escala: 'alterada' });
  assert.deepEqual(leerDestinoCapas('?cualidad=m7&escala=alterada&forma=G'), { cualidad: 'm7', forma: 'G' });
  assert.deepEqual(leerDestinoCapas('?cualidad=nada&forma=todo'), { forma: 'todo' });
  assert.deepEqual(leerDestinoCapas(''), {});
});
