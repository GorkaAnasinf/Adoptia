import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { geocodeSchema, normalizeGeoQuery } from "@/lib/schemas/shelter";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Adoptia/1.0 (https://adoptia-eight.vercel.app)";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * Geocodifica una dirección con Nominatim y cachea el resultado en BD.
 * Solo protectoras autenticadas. Nunca 500 por dirección inexistente:
 * si Nominatim no encuentra nada devuelve { lat: null, lng: null } y el
 * cliente coloca el pin a mano.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "shelter") {
    return json({ error: { code: "forbidden", message: "Solo protectoras" } }, 403);
  }

  const parsed = geocodeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Dirección inválida", issues: parsed.error.issues } },
      422,
    );
  }

  const query = normalizeGeoQuery(parsed.data);
  const admin = createAdminClient();

  // 1. Caché
  const { data: cached } = await admin
    .from("geocode_cache")
    .select("lat, lng")
    .eq("query_norm", query)
    .maybeSingle();
  if (cached) {
    return json({ data: { lat: cached.lat, lng: cached.lng, source: "cache" } });
  }

  // 2. Nominatim (respeta su política: User-Agent identificado, límite a España)
  let resultados: Array<{ lat: string; lon: string }> = [];
  try {
    const url = `${NOMINATIM}?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) resultados = await res.json();
  } catch {
    // Nominatim caído: se trata como "no encontrado", pin manual
    resultados = [];
  }

  if (resultados.length === 0) {
    return json({ data: { lat: null, lng: null, source: "nominatim" } });
  }

  const lat = Number(resultados[0].lat);
  const lng = Number(resultados[0].lon);

  await admin
    .from("geocode_cache")
    .upsert({ query_norm: query, lat, lng }, { onConflict: "query_norm" });

  return json({ data: { lat, lng, source: "nominatim" } });
}
