import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Registro informativo de una intención de apadrinamiento (métrica para la
 * protectora). Sin datos personales; solo cuenta si el animal existe y es
 * apadrinable. Nunca falla hacia el usuario: el enlace externo es lo que importa.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ animalId: string }> }) {
  const { animalId } = await params;
  if (!UUID_RE.test(animalId)) {
    return Response.json({ error: { code: "validation", message: "Id inválido" } }, { status: 422 });
  }

  // Cliente anon: RLS decide si el animal es visible públicamente.
  const supabase = await createClient();
  const { data: animal } = await supabase
    .from("animals")
    .select("id, sponsorable")
    .eq("id", animalId)
    .maybeSingle();
  if (!animal?.sponsorable) {
    return Response.json({ error: { code: "not_found", message: "No apadrinable" } }, { status: 404 });
  }

  const admin = createAdminClient();
  await admin.from("sponsorships").insert({ animal_id: animalId });

  return Response.json({ data: { ok: true } }, { status: 201 });
}
