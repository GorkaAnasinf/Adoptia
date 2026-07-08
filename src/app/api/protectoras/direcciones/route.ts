import { normalizePhoton } from "@/lib/geocoding";
import { createClient } from "@/lib/supabase/server";

const PHOTON = "https://photon.komoot.io/api";
// bbox de España (península + Baleares + Canarias) para sesgar resultados.
const BBOX_ES = "-18.2,27.6,4.4,43.9";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * Autocompletado de direcciones (Photon/OSM). Solo protectoras autenticadas.
 * Nunca 500 por fallo del proveedor: si algo va mal devuelve lista vacía.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "shelter") {
    return json({ error: { code: "forbidden", message: "Solo protectoras" } }, 403);
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return json({ data: [] });

  try {
    const url = `${PHOTON}?q=${encodeURIComponent(q)}&lang=es&limit=6&bbox=${BBOX_ES}`;
    const res = await fetch(url, { headers: { "User-Agent": "Adoptia/1.0" } });
    if (!res.ok) return json({ data: [] });
    const body = (await res.json()) as { features?: Parameters<typeof normalizePhoton>[0] };
    const features = Array.isArray(body.features) ? body.features : [];
    return json({ data: normalizePhoton(features) });
  } catch {
    return json({ data: [] });
  }
}
