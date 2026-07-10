// ---------- Modelo de la búsqueda pública del mapa de protectoras (FEATURE-006) ----------

/** Centro geográfico usado cuando el usuario no comparte ubicación ni busca ciudad. */
export const DEFAULT_CENTER = { lat: 40.4165, lng: -3.7026 };
/** Radio amplio para cubrir la península + Baleares desde el centro por defecto. */
export const DEFAULT_RADIUS_KM = 1000;

export interface SheltersSearch {
  lat: number | undefined;
  lng: number | undefined;
  perros: boolean;
  gatos: boolean;
  acogida: boolean;
  voluntariado: boolean;
}

type RawParams = Record<string, string | string[] | undefined>;

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function numeroEnRango(v: string | undefined, min: number, max: number): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

function chip(v: string | string[] | undefined): boolean {
  return primero(v) === "si";
}

/** Parsea los searchParams de /mapa. Los valores inválidos se ignoran. */
export function parseSheltersSearch(params: RawParams): SheltersSearch {
  const lat = numeroEnRango(primero(params.lat), -90, 90);
  const lng = numeroEnRango(primero(params.lng), -180, 180);
  const conUbicacion = lat !== undefined && lng !== undefined;

  return {
    lat: conUbicacion ? lat : undefined,
    lng: conUbicacion ? lng : undefined,
    perros: chip(params.perros),
    gatos: chip(params.gatos),
    acogida: chip(params.acogida),
    voluntariado: chip(params.voluntariado),
  };
}

// ---------- Traducción a argumentos del RPC shelters_nearby ----------

export interface SheltersNearbyRpcArgs {
  lat: number;
  lng: number;
  radius_m: number;
  p_species: "dog" | "cat" | null;
  p_accepts_volunteers: boolean | null;
  p_accepts_fostering: boolean | null;
}

export function searchToRpcArgs(s: SheltersSearch): SheltersNearbyRpcArgs {
  const conUbicacion = s.lat !== undefined && s.lng !== undefined;

  // Ambos chips activos (o ninguno) = sin filtro de especie.
  const p_species = s.perros !== s.gatos ? (s.perros ? "dog" : "cat") : null;

  return {
    lat: conUbicacion ? (s.lat as number) : DEFAULT_CENTER.lat,
    lng: conUbicacion ? (s.lng as number) : DEFAULT_CENTER.lng,
    radius_m: DEFAULT_RADIUS_KM * 1000,
    p_species,
    p_accepts_volunteers: s.voluntariado ? true : null,
    p_accepts_fostering: s.acogida ? true : null,
  };
}

// ---------- URL compartible ----------

/** Serializa la búsqueda a query string omitiendo los valores por defecto. */
export function buildQueryString(s: SheltersSearch): string {
  const qs = new URLSearchParams();
  if (s.lat !== undefined && s.lng !== undefined) {
    qs.set("lat", String(s.lat));
    qs.set("lng", String(s.lng));
  }
  if (s.perros) qs.set("perros", "si");
  if (s.gatos) qs.set("gatos", "si");
  if (s.acogida) qs.set("acogida", "si");
  if (s.voluntariado) qs.set("voluntariado", "si");
  return qs.toString();
}
