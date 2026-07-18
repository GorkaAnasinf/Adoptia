import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Adoptia/1.0 (https://adoptia-eight.vercel.app)";

/**
 * Geocodifica una ciudad/CP con la misma caché (`geocode_cache`) y política
 * que `/api/geocode` (host fijo, solo ES). Para Server Components que
 * necesitan coordenadas sin pasar por el endpoint. Nunca lanza: ciudad
 * desconocida o red caída → null.
 */
export async function buscarCiudad(q: string): Promise<{ lat: number; lng: number } | null> {
  const query = q.trim().toLowerCase().replace(/\s+/g, " ");
  if (!query) return null;
  const admin = createAdminClient();

  const { data: cached } = await admin
    .from("geocode_cache")
    .select("lat, lng")
    .eq("query_norm", query)
    .maybeSingle();
  if (cached) return { lat: cached.lat as number, lng: cached.lng as number };

  try {
    const url = `${NOMINATIM}?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const resultados = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (resultados.length === 0) return null;
    const lat = Number(resultados[0].lat);
    const lng = Number(resultados[0].lon);
    await admin
      .from("geocode_cache")
      .upsert({ query_norm: query, lat, lng }, { onConflict: "query_norm" });
    return { lat, lng };
  } catch {
    return null;
  }
}
