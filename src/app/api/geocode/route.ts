import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeQuerySchema } from "@/lib/schemas/shelter";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Adoptia/1.0 (https://adoptia-eight.vercel.app)";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// ---------- Rate limit en memoria por IP (política Nominatim: 1 req/s) ----------
const LIMITE_PETICIONES = 20;
const VENTANA_MS = 60_000;
let peticionesPorIp = new Map<string, { count: number; resetAt: number }>();

export function __resetRateLimitForTests() {
  peticionesPorIp = new Map();
}

function excedeLimite(ip: string): boolean {
  const ahora = Date.now();
  const entrada = peticionesPorIp.get(ip);
  if (!entrada || entrada.resetAt < ahora) {
    peticionesPorIp.set(ip, { count: 1, resetAt: ahora + VENTANA_MS });
    return false;
  }
  entrada.count += 1;
  return entrada.count > LIMITE_PETICIONES;
}

function normalizeCityQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Geocodifica una ciudad/CP para el buscador del mapa de protectoras
 * (FEATURE-006). Público, sin sesión: cachea en `geocode_cache` y limita
 * peticiones por IP para no abusar de Nominatim. Nunca 500 por ciudad
 * inexistente: devuelve { lat: null, lng: null } y el cliente muestra el
 * mensaje de "no encontrada".
 */
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
  if (excedeLimite(ip)) {
    return json({ error: { code: "rate_limited", message: "Demasiadas peticiones, espera un momento" } }, 429);
  }

  const parsed = geocodeQuerySchema.safeParse({
    q: new URL(req.url).searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Falta el parámetro q", issues: parsed.error.issues } },
      422,
    );
  }

  const query = normalizeCityQuery(parsed.data.q);
  const admin = createAdminClient();

  const { data: cached } = await admin
    .from("geocode_cache")
    .select("lat, lng")
    .eq("query_norm", query)
    .maybeSingle();
  if (cached) {
    return json({ data: { lat: cached.lat, lng: cached.lng, source: "cache" } });
  }

  let resultados: Array<{ lat: string; lon: string }> = [];
  try {
    const url = `${NOMINATIM}?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) resultados = await res.json();
  } catch {
    resultados = [];
  }

  if (resultados.length === 0) {
    return json({ data: { lat: null, lng: null, source: "nominatim" } });
  }

  const lat = Number(resultados[0].lat);
  const lng = Number(resultados[0].lon);

  await admin.from("geocode_cache").upsert({ query_norm: query, lat, lng }, { onConflict: "query_norm" });

  return json({ data: { lat, lng, source: "nominatim" } });
}
