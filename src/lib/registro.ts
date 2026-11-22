// Registro de práctica (Herramientas): un cronómetro por actividad (una página de la
// web o «Otra») y las sesiones guardadas, con totales por día, por sección y la racha
// de días seguidos. Se guarda en localStorage (registro:sesiones y registro:en-curso)
// y se exporta a archivo. Funciones puras, sin DOM: las fechas llegan como argumento.

export interface Sesion {
  id: string;
  /** Cuándo empezó (ISO). */
  inicio: string;
  segundos: number;
  /** Nombre de la página practicada o texto libre. */
  actividad: string;
  /** Id de su sección (lib/secciones.ts) u 'otra'. */
  seccion: string;
  nota?: string;
}

/** El cronómetro: corriendo si `desde` no es null (ms de época), con lo ya acumulado. */
export interface EnCurso {
  desde: number | null;
  acumulado: number;
  /** Cuándo se pulsó Empezar por primera vez (ms de época). */
  empezada: number;
  actividad: string;
  seccion: string;
  nota: string;
}

const esTexto = (x: unknown): x is string => typeof x === 'string';

/** Sesiones leídas de localStorage o de un archivo: se descartan las que no tienen forma. */
export function sesionesValidas(x: unknown): Sesion[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter(
      (s): s is Sesion =>
        typeof s === 'object' &&
        s !== null &&
        esTexto(s.id) &&
        esTexto(s.inicio) &&
        !Number.isNaN(Date.parse(s.inicio)) &&
        typeof s.segundos === 'number' &&
        s.segundos > 0 &&
        esTexto(s.actividad),
    )
    .map((s) => ({
      id: s.id,
      inicio: s.inicio,
      segundos: Math.round(s.segundos),
      actividad: s.actividad,
      seccion: esTexto(s.seccion) ? s.seccion : 'otra',
      ...(esTexto(s.nota) && s.nota ? { nota: s.nota } : {}),
    }));
}

export function enCursoValido(x: unknown): EnCurso | null {
  if (typeof x !== 'object' || x === null) return null;
  const e = x as Partial<EnCurso>;
  if (typeof e.acumulado !== 'number' || typeof e.empezada !== 'number' || !esTexto(e.actividad)) return null;
  return {
    desde: typeof e.desde === 'number' ? e.desde : null,
    acumulado: Math.max(0, e.acumulado),
    empezada: e.empezada,
    actividad: e.actividad,
    seccion: esTexto(e.seccion) ? e.seccion : 'otra',
    nota: esTexto(e.nota) ? e.nota : '',
  };
}

/** Segundos que lleva el cronómetro en el instante `ahora` (ms). */
export const segundosEnCurso = (e: EnCurso, ahora: number) => e.acumulado + (e.desde === null ? 0 : Math.max(0, (ahora - e.desde) / 1000));

/** Pausa (o reanuda) el cronómetro. */
export const alternarPausa = (e: EnCurso, ahora: number): EnCurso =>
  e.desde === null ? { ...e, desde: ahora } : { ...e, desde: null, acumulado: segundosEnCurso(e, ahora) };

/** Al terminar: la sesión que se guarda (null si ha durado menos de 5 s). */
export function cerrarSesion(e: EnCurso, ahora: number, id: string): Sesion | null {
  const segundos = Math.round(segundosEnCurso(e, ahora));
  if (segundos < 5) return null;
  return {
    id,
    inicio: new Date(e.empezada).toISOString(),
    segundos,
    actividad: e.actividad,
    seccion: e.seccion,
    ...(e.nota.trim() ? { nota: e.nota.trim() } : {}),
  };
}

/** Fecha local AAAA-MM-DD de un instante. */
export function diaDe(fecha: Date | string | number): string {
  const d = new Date(fecha);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Los últimos `n` días hasta `hoy` incluido, del más antiguo al más reciente. */
export function ultimosDias(hoy: Date, n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (n - 1 - i));
    return diaDe(d);
  });
}

/** Segundos practicados en cada día de la lista. */
export function totalesPorDia(sesiones: readonly Sesion[], dias: readonly string[]): number[] {
  const porDia = new Map<string, number>();
  for (const s of sesiones) porDia.set(diaDe(s.inicio), (porDia.get(diaDe(s.inicio)) ?? 0) + s.segundos);
  return dias.map((d) => porDia.get(d) ?? 0);
}

/** Total de las sesiones desde un día (incluido). */
export const totalDesde = (sesiones: readonly Sesion[], desde: string) =>
  sesiones.filter((s) => diaDe(s.inicio) >= desde).reduce((t, s) => t + s.segundos, 0);

/** Segundos por clave (sección o actividad) desde un día, de más a menos. */
export function reparto(sesiones: readonly Sesion[], desde: string, clave: 'seccion' | 'actividad'): { clave: string; segundos: number }[] {
  const m = new Map<string, number>();
  for (const s of sesiones) if (diaDe(s.inicio) >= desde) m.set(s[clave], (m.get(s[clave]) ?? 0) + s.segundos);
  return [...m].map(([k, segundos]) => ({ clave: k, segundos })).sort((a, b) => b.segundos - a.segundos || a.clave.localeCompare(b.clave));
}

/**
 * Días seguidos con práctica que acaban hoy (o ayer, si hoy aún no se ha practicado:
 * la racha sigue viva hasta que acabe el día).
 */
export function racha(sesiones: readonly Sesion[], hoy: Date): number {
  const dias = new Set(sesiones.map((s) => diaDe(s.inicio)));
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  if (!dias.has(diaDe(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dias.has(diaDe(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Une sesiones importadas a las que hay: las de id repetido se sustituyen. Ordenadas de más reciente a más antigua. */
export function unirSesiones(actuales: readonly Sesion[], nuevas: readonly Sesion[]): Sesion[] {
  const porId = new Map(actuales.map((s) => [s.id, s]));
  for (const s of nuevas) porId.set(s.id, s);
  return ordenarSesiones([...porId.values()]);
}

export const ordenarSesiones = (sesiones: readonly Sesion[]) => [...sesiones].sort((a, b) => b.inicio.localeCompare(a.inicio));

/** «1 h 05 min», «12 min», «40 s». */
export function duracion(segundos: number): string {
  const s = Math.round(segundos);
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

/** «0:07:32» para el cronómetro. */
export function reloj(segundos: number): string {
  const s = Math.floor(segundos);
  return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * La actividad de un valor de los selectores del registro ('acordes|Drop 2' u 'otra|',
 * con su texto libre): [sección, nombre].
 */
export function actividadDeValor(valor: string, libre = ''): [string, string] {
  const [seccion, pagina] = valor.split('|');
  if (!seccion || seccion === 'otra' || !pagina) return ['otra', libre.trim() || 'Otra'];
  return [seccion, pagina];
}

/** La última actividad elegida en el registro (registro:ultima), o «Otra» si no hay. */
export function ultimaActividad(x: unknown): [string, string] {
  const u = (typeof x === 'object' && x ? x : {}) as { valor?: unknown; libre?: unknown };
  return actividadDeValor(typeof u.valor === 'string' ? u.valor : 'otra|', typeof u.libre === 'string' ? u.libre : '');
}

/** Un cronómetro nuevo, corriendo desde `ahora`. */
export const empezarSesion = (ahora: number, [seccion, actividad]: [string, string], nota = ''): EnCurso => ({
  desde: ahora,
  acumulado: 0,
  empezada: ahora,
  seccion,
  actividad,
  nota,
});
