import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { parseGrado, parseNota } from './lib/teoria.ts';
import { parseAcordeGrado } from './lib/progresiones.ts';
import { parsePaso } from './lib/patrones.ts';

// Astro devuelve las entradas ordenadas por id; guardamos la posición en el
// archivo para respetar el orden escrito a mano (ver lib/orden.ts).
const yamlConOrden = (texto: string) =>
  (parse(texto) as Record<string, unknown>[]).map((entrada, orden) => ({ ...entrada, orden }));

const archivo = (ruta: string) => file(ruta, { parser: yamlConOrden });
const orden = z.number().int();

const esValido = <T,>(parse: (s: T) => unknown) => (s: T) => {
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
    // Versión inglesa: nombre, si cambia (7 alterado → Altered 7), y descripción.
    en: z.object({ nombre: z.string().optional(), descripcion: z.string().optional() }).optional(),
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
    // Versión inglesa (calculadora de intervalos en /en/).
    en: z
      .object({
        caracter: z.string(),
        ascendente: z.array(z.string()).default([]),
        descendente: z.array(z.string()).default([]),
      })
      .optional(),
  }),
});

const escalas = defineCollection({
  loader: archivo('src/data/escalas.yaml'),
  schema: z.object({
    orden,
    nombre: z.string(),
    // Nombre en la versión inglesa (buscador de escalas en /en/).
    en: z.object({ nombre: z.string() }).optional(),
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
      // Versión inglesa (/en/chords/): nombre si cambia y notas.
      en: z.object({ nombre: z.string().optional(), notas: z.string().optional() }).optional(),
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
    // Versión inglesa (oído armónico en /en/…).
    en: z.object({ nombre: z.string(), descripcion: z.string().optional() }).optional(),
    pulsos: z.number().int().min(1).max(12).optional(),
    compases: z.array(acordeGrado).min(1),
  }),
});

const patrones = defineCollection({
  loader: archivo('src/data/patrones.yaml'),
  schema: z.object({
    orden,
    nombre: z.string(),
    descripcion: z.string().optional(),
    sobre: z.enum(['escala', 'arpegio']),
    celula: z
      .array(z.union([z.number().int(), z.string()]).refine(esValido(parsePaso), { message: 'Paso no válido (p. ej. 0, 2, "0-", "1+")' }))
      .min(1),
    idaYVuelta: z.boolean().optional(),
  }),
});

// Ayudas para improvisar sobre una canción del repertorio. Cada escala se escribe
// como "<id de escalas.yaml>" (en la tónica del acorde del tramo) o "<nota> <id>"
// para tocarla desde otra nota (p. ej. "A pentatonica-menor" sobre Dm7).
const escalaImpro = z.string().refine(
  (s) => {
    const partes = s.trim().split(/\s+/);
    return partes.length === 1 || (partes.length === 2 && esValido(parseNota)(partes[0]));
  },
  { message: 'Escala no válida: "dorico" o "Bb pentatonica-menor".' },
);

const improvisacion = z.object({
  enfoque: z.string().nullish(),
  tramos: z
    .array(
      z.object({
        compases: z.string(),
        acorde: z.string(),
        escalas: z.array(escalaImpro).default([]),
        guia: z.string().nullish(),
        consejo: z.string().nullish(),
      }),
    )
    .default([]),
  estrategias: z.array(z.object({ titulo: z.string(), texto: z.string() })).default([]),
  ejercicios: z.array(z.string()).default([]),
  /** Páginas de Estudio relacionadas, por su ruta: "notas-guia", "modos"… */
  estudio: z.array(z.string()).default([]),
});

// Citas de músicos de jazz para la portada (una al azar), en su idioma original.
const citas = defineCollection({
  loader: archivo('src/data/citas.yaml'),
  schema: z.object({
    orden,
    texto: z.string().min(1),
    autor: z.string().min(1),
    idioma: z.string().regex(/^[a-z]{2,3}(-[A-Za-z]{2})?$/, { message: 'Código de idioma (en, fr, pt-BR…)' }).default('en'),
    /** Traducción al español; obligatoria si la cita no está en inglés. */
    traduccion: z.string().min(1).optional(),
  }).refine((c) => c.idioma === 'en' || c.traduccion, {
    message: 'Una cita que no está en inglés lleva su traducción (traduccion).',
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
    improvisacion: improvisacion.nullish(),
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

export const collections = { grupos, intervalos, escalas, acordes, progresiones, patrones, repertorio, cifrados, citas };
