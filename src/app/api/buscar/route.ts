import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export type ResultadoBusqueda = {
  type: "animal" | "solicitud" | "favorito";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

const MIN = 2;
const LIMITE = 6;

/** Escapa los comodines de LIKE para que el texto se interprete literal. */
function escaparLike(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Buscador global del área privada (FEATURE-061). Role-aware con el cliente del
 * propio usuario: RLS decide qué ve cada uno, sin bypass. Protectora → sus
 * animales; adoptante → sus solicitudes y favoritos (por nombre del animal).
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < MIN) return json({ data: { results: [] } });
  const patron = `%${escaparLike(q)}%`;

  const results: ResultadoBusqueda[] = [];

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (shelter) {
    // Protectora: sus animales por nombre → ficha de edición.
    const { data } = await supabase
      .from("animals")
      .select("id, name, status")
      .eq("shelter_id", shelter.id)
      .ilike("name", patron)
      .order("updated_at", { ascending: false })
      .limit(LIMITE);
    for (const a of (data as { id: string; name: string; status: string }[] | null) ?? []) {
      results.push({
        type: "animal",
        id: a.id,
        title: a.name,
        subtitle: a.status,
        href: `/panel/animales/${a.id}`,
      });
    }
  } else {
    // Adoptante: sus solicitudes y favoritos, por nombre del animal.
    const [{ data: solis }, { data: favs }] = await Promise.all([
      supabase
        .from("adoption_requests")
        .select("id, status, animals!inner (name, slug)")
        .ilike("animals.name", patron)
        .limit(LIMITE),
      supabase
        .from("favorites")
        .select("animal_id, animals!inner (name, slug)")
        .ilike("animals.name", patron)
        .limit(LIMITE),
    ]);
    type Fila = { id?: string; animal_id?: string; status?: string; animals: { name: string; slug: string } | null };
    for (const s of (solis as unknown as Fila[] | null) ?? []) {
      if (!s.animals) continue;
      results.push({
        type: "solicitud",
        id: s.id ?? s.animals.slug,
        title: s.animals.name,
        subtitle: s.status ?? null,
        href: "/mi-cuenta/solicitudes",
      });
    }
    for (const f of (favs as unknown as Fila[] | null) ?? []) {
      if (!f.animals) continue;
      results.push({
        type: "favorito",
        id: f.animal_id ?? f.animals.slug,
        title: f.animals.name,
        subtitle: null,
        href: `/animales/${f.animals.slug}`,
      });
    }
  }

  return json({ data: { results } });
}
