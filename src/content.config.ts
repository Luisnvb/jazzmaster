import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { parseGrado, parseNota } from './lib/teoria.ts';
import { parseAcordeGrado } from './lib/progresiones.ts';

// Astro devuelve las entradas ordenadas por id; guardamos la posición en el
// archivo para respetar el orden escrito a mano (ver lib/orden.ts).
const yamlConOrden = (texto: string) =>
  (parse(texto) as Record<string, unknown>[]).map((entrada, orden) => ({ ...entrada, orden }));

const archivo = (ruta: string) => file(ruta, { parser: yamlConOrden });
const orden = z.number().int();

const esValido = (parse: (s: string) => unknown) => (s: string) => {
  try {
    parse(s);
    return true;
  } catch {
    return false;
  }
};

const grado = z.string().refine(esValido(parseGrado), { message: 'Grado no válido (p. ej. 1, b3, #4, bb7, 9)' });
const nota = z.string().refine(esValido(parseNota), { message: 'Nota no válida (p. ej. C, Bb, F#)' });

const grupos = defineCollection({
  loader: archivo('src/data/grupos.yaml'),
  schema: z.object({
    orden,
    nombre: z.string(),
    simbolo: z.string(),
    descripcion: z.string().optional(),
    arpegio: z.array(grado).min(3),
  }),
});

const intervalos = defineCollection({
  loader: archivo('src/data/intervalos.yaml'),
  schema: z.object({
    orden,
    nombre: z.string(),
    semitonos: z.number().int().min(0).max(12),
    grado,
    caracter: z.string(),
    ascendente: z.array(z.string()).default([]),
    descendente: z.array(z.string()).default([]),
    revisar: z.array(z.string()).default([]),
  }),
});

const escalas = defineCollection({
  loader: archivo('src/data/escalas.yaml'),
  schema: z.object({
    orden,
    nombre: z.string(),
    grupo: reference('grupos'),
    formula: z.array(grado).min(5),
  }),
});

const traste = z.union([z.number().int().min(0).max(24), z.literal('x')]);

const acordes = defineCollection({
  loader: archivo('src/data/acordes.yaml'),
  schema: z
    .object({
      orden,
      grupo: reference('grupos'),
      nombre: z.string(),
      tonica: nota,
      trastes: z.array(traste).length(6),
      grados: z.array(z.union([grado, z.literal('')])).length(6),
      dedos: z.array(z.union([z.number().int().min(1).max(4), z.literal('T'), z.literal('')])).length(6).optional(),
      notas: z.string().optional(),
    })
    .refine((v) => v.trastes.every((t, i) => (t === 'x') === (v.grados[i] === '')), {
      message: 'Cada cuerda apagada (x) debe tener grado vacío, y cada cuerda tocada un grado.',
      path: ['grados'],
    }),
});

const acordeGrado = z.string().superRefine((compas, ctx) => {
  const acordes = compas.trim().split(/\s+/).filter(Boolean);
  if (acordes.length === 0) ctx.addIssue({ code: 'custom', message: 'Compás vacío.' });
  for (const a of acordes) {
    try {
      parseAcordeGrado(a);
    } catch (error) {
      ctx.addIssue({ code: 'custom', message: (error as Error).message });
    }
  }
});

const progresiones = defineCollection({
  loader: archivo('src/data/progresiones.yaml'),
  schema: z.object({
    orden,
    nombre: z.string(),
    descripcion: z.string().optional(),
    pulsos: z.number().int().min(1).max(12).optional(),
    compases: z.array(acordeGrado).min(1),
  }),
});

const repertorio = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: 'src/content/repertorio' }),
  schema: z.object({
    titulo: z.string(),
    autor: z.string(),
    instrumental: z.boolean().default(false),
    tonalidad: z.string().nullish(),
    tempo: z.number().int().positive().nullish(),
    compas: z.string().nullish(),
    estructura: z.string().nullish(),
    estilo: z.string().nullish(),
    enlaces: z
      .object({ grabacion: z.url().optional(), partitura: z.url().optional() })
      .default({}),
    notas: z.string().nullish(),
  }),
});

// Cifrados en el formato del Chord Melody Builder: <id>.cmb.json junto a <id>.md.
// Solo se comprueba la forma general; la validación completa está en lib/cmb.ts.
const cifrados = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.cmb.json',
    base: 'src/content/repertorio',
    generateId: ({ entry }) => entry.replace(/\.cmb\.json$/, ''),
  }),
  schema: z.looseObject({
    version: z.number(),
    bars: z.array(z.looseObject({ cells: z.array(z.looseObject({ root: z.string(), type: z.string() })) })),
  }),
});

export const collections = { grupos, intervalos, escalas, acordes, progresiones, repertorio, cifrados };
