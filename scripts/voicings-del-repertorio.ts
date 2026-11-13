// Añade a src/data/acordes.yaml los voicings de los cifrados del repertorio que
// aún no estén (mismo dibujo y grados). No toca los que ya hay ni su orden.
//   npm run voicings-repertorio
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import { aVoicing, voicingAYaml } from '../src/lib/acordes-datos.ts';
import { validarCmb } from '../src/lib/cmb.ts';
import { voicingsDeCifrados } from '../src/lib/voicings-repertorio.ts';

const DIR = new URL('../src/content/repertorio/', import.meta.url);
const ACORDES = new URL('../src/data/acordes.yaml', import.meta.url);
const GRUPOS = new URL('../src/data/grupos.yaml', import.meta.url);

const titulo = (id: string, cmbTitulo: string) => {
  try {
    const md = readFileSync(new URL(`${id}.md`, DIR), 'utf8');
    return /^titulo:\s*"?(.*?)"?\s*$/m.exec(md)?.[1] ?? cmbTitulo;
  } catch {
    return cmbTitulo;
  }
};

const cifrados = readdirSync(DIR)
  .filter((f) => f.endsWith('.cmb.json') && !f.startsWith('_'))
  .map((f) => {
    const cmb = validarCmb(JSON.parse(readFileSync(new URL(f, DIR), 'utf8')));
    return { titulo: titulo(f.replace(/\.cmb\.json$/, ''), cmb.title), cmb };
  });

const texto = readFileSync(ACORDES, 'utf8');
const existentes = (parse(texto) as unknown[]).map(aVoicing);
const ordenGrupos = (parse(readFileSync(GRUPOS, 'utf8')) as { id: string }[]).map((g) => g.id);
const nuevos = voicingsDeCifrados(cifrados, existentes, ordenGrupos);

if (nuevos.length === 0) {
  console.log('No hay voicings nuevos en el repertorio.');
} else {
  const bloque = `\n# --- Del repertorio (npm run voicings-repertorio) ---\n\n${nuevos.map(voicingAYaml).join('\n\n')}\n`;
  writeFileSync(ACORDES, texto.trimEnd() + '\n' + bloque);
  const resumen = Object.entries(Object.groupBy(nuevos, (v) => v.grupo)).map(([g, vs]) => `${g}: ${vs!.length}`);
  console.log(`${nuevos.length} voicings añadidos a src/data/acordes.yaml (${resumen.join(', ')}).`);
}
