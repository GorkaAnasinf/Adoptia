import { auditar, usuarioAdminId } from "@/lib/admin";
import { resolverReporteSchema } from "@/lib/schemas/moderacion";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/** Marca un reporte como revisado o descartado (solo admin, auditado). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const adminId = await usuarioAdminId(supabase);
  if (!adminId) {
    return json({ error: { code: "forbidden", message: "Solo administradores" } }, 403);
  }

  const parsed = resolverReporteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Acción inválida" } }, 422);
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: parsed.data.accion,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, status")
    .single();
  if (error || !data) {
    return json({ error: { code: "not_found", message: "Reporte no encontrado" } }, 404);
  }

  await auditar(supabase, {
    admin_id: adminId,
    action: `report_${parsed.data.accion}`,
    target_type: "report",
    target_id: id,
  });

  return json({ data });
}
