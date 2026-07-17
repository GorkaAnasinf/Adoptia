import { ESPECIES, SEXOS, TAMANOS } from "@/lib/schemas/animal";

// ---------- Modelo de la búsqueda pública de animales ----------

export const PAGE_SIZE = 24;

export const EDADES = ["cachorro", "joven", "adulto", "senior"] as const;
export type EdadBucket = (typeof EDADES)[number];

export const ORDENES = ["recientes", "cercanos"] as const;
export type Orden = (typeof ORDENES)[number];

/** Sexos filtrables en la UI pública ("unknown" no es un filtro útil). */
const SEXOS_FILTRABLES = SEXOS.filter((s) => s !== "unknown");

const DISTANCIA_MIN_KM = 1;
const DISTANCIA_MAX_KM = 500;

/** Longitud máxima del término de búsqueda de texto. */
export const QUERY_MAX = 60;

export interface AnimalSearch {
  q: string | undefined;
  especie: (typeof ESPECIES)[number] | undefined;
  tamanos: (typeof TAMANOS)[number][];
  sexos: (typeof SEXOS)[number][];
  edad: EdadBucket | undefined;
  ninos: true | undefined;
  perros: true | undefined;
  gatos: true | undefined;
  distanciaKm: number | undefined;
  lat: number | undefined;
  lng: number | undefined;
  orden: Orden;
  pagina: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function enumValido<T extends string>(valores: readonly T[], v: string | undefined): T | undefined {
  return valores.includes(v as T) ? (v as T) : undefined;
}

function listaValida<T extends string>(valores: readonly T[], v: string | undefined): T[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is T => valores.includes(x as T));
}

function numeroEnRango(v: string | undefined, min: number, max: number): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

/** Parsea los searchParams de /animales. Los valores inválidos se ignoran. */
export function parseAnimalSearch(params: RawParams): AnimalSearch {
  const lat = numeroEnRango(primero(params.lat), -90, 90);
  const lng = numeroEnRango(primero(params.lng), -180, 180);
  const conUbicacion = lat !== undefined && lng !== undefined;

  const ordenPedido = enumValido(ORDENES, primero(params.orden)) ?? "recientes";
  const paginaRaw = numeroEnRango(primero(params.pagina), 1, 10_000);

  const flag = (v: string | string[] | undefined): true | undefined =>
    primero(v) === "si" ? true : undefined;

  const qBruto = primero(params.q)?.trim().slice(0, QUERY_MAX);

  return {
    q: qBruto ? qBruto : undefined,
    especie: enumValido(ESPECIES, primero(params.especie)),
    tamanos: listaValida(TAMANOS, primero(params.tamano)),
    sexos: listaValida(SEXOS_FILTRABLES, primero(params.sexo)),
    edad: enumValido(EDADES, primero(params.edad)),
    ninos: flag(params.ninos),
    perros: flag(params.perros),
    gatos: flag(params.gatos),
    distanciaKm: numeroEnRango(primero(params.distancia), DISTANCIA_MIN_KM, DISTANCIA_MAX_KM),
    lat: conUbicacion ? lat : undefined,
    lng: conUbicacion ? lng : undefined,
    // "cercanos" solo tiene sentido con ubicación; si no, recientes.
    orden: ordenPedido === "cercanos" && !conUbicacion ? "recientes" : ordenPedido,
    pagina: paginaRaw ? Math.trunc(paginaRaw) : 1,
  };
}

// ---------- Traducción a argumentos del RPC animals_search ----------

/** Límites de cada bucket de edad en años: [desde, hasta). */
const RANGO_EDAD: Record<EdadBucket, [number | null, number | null]> = {
  cachorro: [null, 1],
  joven: [1, 3],
  adulto: [3, 8],
  senior: [8, null],
};

function fechaHaceAnios(hoy: Date, anios: number): string {
  const d = new Date(hoy);
  d.setUTCFullYear(d.getUTCFullYear() - anios);
  return d.toISOString().slice(0, 10);
}

/**
 * Escapa los metacaracteres de LIKE (`\`, `%`, `_`) para que el texto del
 * usuario se interprete literal y no como comodín. El `\` va primero.
 */
function escaparLike(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export interface AnimalsSearchRpcArgs {
  p_query: string | null;
  p_species: string | null;
  p_sizes: string[] | null;
  p_sexes: string[] | null;
  p_good_with_kids: boolean | null;
  p_good_with_dogs: boolean | null;
  p_good_with_cats: boolean | null;
  p_birth_after: string | null;
  p_birth_before: string | null;
  p_lat: number | null;
  p_lng: number | null;
  p_radius_km: number | null;
  p_order: "recent" | "distance";
  p_limit: number;
  p_offset: number;
}

export function searchToRpcArgs(s: AnimalSearch, hoy: Date = new Date()): AnimalsSearchRpcArgs {
  const [desdeAnios, hastaAnios] = s.edad ? RANGO_EDAD[s.edad] : [null, null];
  const conUbicacion = s.lat !== undefined && s.lng !== undefined;

  return {
    p_query: s.q ? `%${escaparLike(s.q)}%` : null,
    p_species: s.especie ?? null,
    p_sizes: s.tamanos.length ? s.tamanos : null,
    p_sexes: s.sexos.length ? s.sexos : null,
    p_good_with_kids: s.ninos ?? null,
    p_good_with_dogs: s.perros ?? null,
    p_good_with_cats: s.gatos ?? null,
    // Nacido DESPUÉS de (hoy - hasta años) → más joven que `hasta`.
    p_birth_after: hastaAnios !== null ? fechaHaceAnios(hoy, hastaAnios) : null,
    p_birth_before: desdeAnios !== null && desdeAnios > 0 ? fechaHaceAnios(hoy, desdeAnios) : null,
    p_lat: conUbicacion ? (s.lat as number) : null,
    p_lng: conUbicacion ? (s.lng as number) : null,
    p_radius_km: conUbicacion && s.distanciaKm !== undefined ? s.distanciaKm : null,
    p_order: s.orden === "cercanos" && conUbicacion ? "distance" : "recent",
    p_limit: PAGE_SIZE,
    p_offset: (s.pagina - 1) * PAGE_SIZE,
  };
}

// ---------- URL compartible ----------

/** Serializa la búsqueda a query string omitiendo los valores por defecto. */
export function buildQueryString(s: AnimalSearch): string {
  const qs = new URLSearchParams();
  if (s.q) qs.set("q", s.q);
  if (s.especie) qs.set("especie", s.especie);
  if (s.tamanos.length) qs.set("tamano", s.tamanos.join(","));
  if (s.sexos.length) qs.set("sexo", s.sexos.join(","));
  if (s.edad) qs.set("edad", s.edad);
  if (s.ninos) qs.set("ninos", "si");
  if (s.perros) qs.set("perros", "si");
  if (s.gatos) qs.set("gatos", "si");
  if (s.distanciaKm !== undefined) qs.set("distancia", String(s.distanciaKm));
  if (s.lat !== undefined && s.lng !== undefined) {
    qs.set("lat", String(s.lat));
    qs.set("lng", String(s.lng));
  }
  if (s.orden !== "recientes") qs.set("orden", s.orden);
  if (s.pagina > 1) qs.set("pagina", String(s.pagina));
  return qs.toString();
}

/** Edad aproximada a partir de birth_date_approx: años, o meses si <1 año. */
export function edadAproximada(
  birth: string | null | undefined,
  hoy: Date = new Date(),
): { unidad: "anios" | "meses"; n: number } | null {
  if (!birth) return null;
  const nacimiento = new Date(birth);
  if (Number.isNaN(nacimiento.getTime())) return null;
  const meses =
    (hoy.getUTCFullYear() - nacimiento.getUTCFullYear()) * 12 +
    (hoy.getUTCMonth() - nacimiento.getUTCMonth());
  if (meses < 0) return null;
  if (meses < 12) return { unidad: "meses", n: meses };
  return { unidad: "anios", n: Math.floor(meses / 12) };
}

/**
 * ¿La fecha de nacimiento cae en el bucket de edad? Mismos límites
 * `[desde, hasta)` que la búsqueda del RPC (RANGO_EDAD). Para el filtrado
 * client-side del perfil de protectora (FEATURE-028).
 */
export function edadEnBucket(
  birth: string | null | undefined,
  bucket: EdadBucket,
  hoy: Date = new Date(),
): boolean {
  const edad = edadAproximada(birth, hoy);
  if (!edad) return false;
  const anios = edad.unidad === "meses" ? edad.n / 12 : edad.n;
  const [desde, hasta] = RANGO_EDAD[bucket];
  if (desde !== null && anios < desde) return false;
  if (hasta !== null && anios >= hasta) return false;
  return true;
}

/**
 * `next/image` lanza con src relativas sin barra inicial (datos antiguos o
 * corruptos). Solo aceptamos URLs absolutas o rutas del propio dominio.
 */
export function esImagenValida(url: string | null | undefined): url is string {
  return Boolean(url && (/^https?:\/\//.test(url) || url.startsWith("/")));
}

export function totalPaginas(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/**
 * Números de página a pintar en la paginación: primera, última y vecinos de
 * la actual, con "..." en los huecos. Con una sola página no hay paginación.
 */
export function paginasVisibles(actual: number, total: number): (number | "...")[] {
  if (total <= 1) return [];
  const numeros = new Set<number>([1, total]);
  for (let p = actual - 1; p <= actual + 1; p++) {
    if (p >= 1 && p <= total) numeros.add(p);
  }
  // Desde los extremos enseña un arranque de 3 (1,2,3 o n-2,n-1,n)
  if (actual <= 2) numeros.add(3);
  if (actual >= total - 1) numeros.add(total - 2);

  const orden = [...numeros].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const salida: (number | "...")[] = [];
  for (const [i, n] of orden.entries()) {
    if (i > 0 && n - orden[i - 1] > 1) salida.push("...");
    salida.push(n);
  }
  return salida;
}
