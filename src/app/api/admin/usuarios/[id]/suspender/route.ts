import { auditar, usuarioAdminId } from "@/lib/admin";
import { suspenderUsuarioSchema } from "@/lib/schemas/moderacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// Suspensión "indefinida" pero reversible: GoTrue banea por duración.
const BAN_LARGO = "87600h"; // ~10 años

/**
 * Suspende o reactiva la cuenta de un usuario (bloqueo de login vía GoTrue).
 * No borra datos: la supresión RGPD es otro flujo. Queda auditado.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const adminId = await usuarioAdminId(supabase);
  if (!adminId) {
    return json({ error: { code: "forbidden", message: "Solo administradores" } }, 403);
  }
  if (id === adminId) {
    return json({ error: { code: "invalid_target", message: "No puedes suspenderte a ti mismo" } }, 409);
  }

  const parsed = suspenderUsuarioSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Acción inválida (¿falta el motivo?)" } },
      422,
    );
  }
  const accion = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: accion.accion === "suspend" ? BAN_LARGO : "none",
  });
  if (error) {
    return json({ error: { code: "auth_error", message: error.message } }, 500);
  }

  await auditar(supabase, {
    admin_id: adminId,
    action: accion.accion === "suspend" ? "suspend_user" : "reactivate_user",
    target_type: "user",
    target_id: id,
    reason: accion.accion === "suspend" ? accion.motivo : null,
  });

  return json({ data: { id, suspended: accion.accion === "suspend" } });
}
