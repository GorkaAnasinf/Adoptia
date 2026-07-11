import { auditar, usuarioAdminId } from "@/lib/admin";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaFichaDespublicada } from "@/lib/email/templates";
import { moderarAnimalSchema } from "@/lib/schemas/moderacion";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function enviarEmailSeguro(payload: Parameters<typeof enviarEmail>[0]) {
  try {
    await enviarEmail(payload);
  } catch (err) {
    console.error("No se pudo enviar el email de moderación:", err);
  }
}

/**
 * Despublica (con motivo, email a la protectora y auditoría) o republica una
 * ficha. Reversible: la despublicación no borra nada.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const adminId = await usuarioAdminId(supabase);
  if (!adminId) {
    return json({ error: { code: "forbidden", message: "Solo administradores" } }, 403);
  }

  const parsed = moderarAnimalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Acción inválida (¿falta el motivo?)" } },
      422,
    );
  }
  const accion = parsed.data;

  const { data: animal } = await supabase
    .from("animals")
    .select("id, name, shelters(name, email)")
    .eq("id", id)
    .maybeSingle();
  const fila = animal as unknown as {
    id: string;
    name: string;
    shelters: { name: string; email: string | null } | null;
  } | null;
  if (!fila) return json({ error: { code: "not_found", message: "Ficha no encontrada" } }, 404);

  const cambios =
    accion.accion === "unpublish"
      ? { published_at: null, moderation_note: accion.motivo }
      : { published_at: new Date().toISOString(), moderation_note: null };

  const { error } = await supabase.from("animals").update(cambios).eq("id", id);
  if (error) return json({ error: { code: "db_error", message: error.message } }, 500);

  await auditar(supabase, {
    admin_id: adminId,
    action: accion.accion === "unpublish" ? "unpublish_animal" : "republish_animal",
    target_type: "animal",
    target_id: id,
    reason: accion.accion === "unpublish" ? accion.motivo : null,
  });

  if (accion.accion === "unpublish" && fila.shelters?.email) {
    const plantilla = plantillaFichaDespublicada({
      shelterName: fila.shelters.name,
      animalName: fila.name,
      motivo: accion.motivo,
    });
    await enviarEmailSeguro({ to: fila.shelters.email, ...plantilla });
  }

  return json({ data: { id, ...cambios } });
}
