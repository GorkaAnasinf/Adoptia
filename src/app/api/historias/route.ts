import { historiaSchema } from "@/lib/schemas/historia";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * El adoptante comparte un testimonio (FEATURE-059). Solo puede hacerlo sobre un
 * animal que adoptó (adopción `completed`); el `shelter_id` se toma del animal.
 * La historia nace `pending`: la protectora dueña la modera. RLS re-verifica la
 * propiedad de la adopción y el consentimiento.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const parsed = historiaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Petición inválida" } }, 422);
  }
  const { animal_id, quote, photo_url } = parsed.data;

  // Debe existir una adopción completada del propio usuario para ese animal.
  const { data: adopcion } = await supabase
    .from("adoption_requests")
    .select("id, animals (shelter_id)")
    .eq("animal_id", animal_id)
    .eq("adopter_id", user.id)
    .eq("status", "completed")
    .maybeSingle();
  const shelterId = (adopcion as { animals: { shelter_id: string } | null } | null)?.animals
    ?.shelter_id;
  if (!adopcion || !shelterId) {
    return json(
      { error: { code: "forbidden", message: "Solo puedes compartir la historia de un animal que adoptaste" } },
      403,
    );
  }

  const { error } = await supabase.from("adoption_stories").insert({
    animal_id,
    adopter_id: user.id,
    shelter_id: shelterId,
    quote,
    photo_url: photo_url ?? null,
    consent: true,
  });
  if (error) {
    if (error.code === "23505") {
      return json(
        { error: { code: "story_exists", message: "Ya compartiste una historia de este animal" } },
        409,
      );
    }
    return json({ error: { code: "db_error", message: "No se pudo guardar la historia" } }, 500);
  }

  return json({ data: { ok: true } }, 201);
}
