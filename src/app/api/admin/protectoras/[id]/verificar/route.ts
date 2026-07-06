import { enviarEmail } from "@/lib/email/mailer";
import { plantillaRechazada, plantillaVerificada } from "@/lib/email/templates";
import { verificarSchema } from "@/lib/schemas/shelter";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * Verifica o rechaza una protectora. Solo admin (rol comprobado en el handler,
 * RLS como red final). Cambia status a verified/suspended y envía email al
 * gestor. El rechazo exige motivo.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
  if (profile?.role !== "admin") {
    return json({ error: { code: "forbidden", message: "Solo administradores" } }, 403);
  }

  const parsed = verificarSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Acción inválida (¿falta el motivo?)" } },
      400,
    );
  }

  const { data: shelter } = await supabase
    .from("shelters")
    .select("name, email")
    .eq("id", id)
    .single();
  if (!shelter) {
    return json({ error: { code: "not_found", message: "Protectora no encontrada" } }, 404);
  }

  const esVerify = parsed.data.accion === "verify";
  const { error } = await supabase
    .from("shelters")
    .update(
      esVerify
        ? { status: "verified", verification_note: null }
        : { status: "suspended", verification_note: parsed.data.motivo },
    )
    .eq("id", id);
  if (error) {
    return json({ error: { code: "db_error", message: error.message } }, 500);
  }

  if (shelter.email) {
    const plantilla = esVerify
      ? plantillaVerificada({ shelterName: shelter.name })
      : plantillaRechazada({ shelterName: shelter.name, motivo: parsed.data.motivo });
    await enviarEmail({ to: shelter.email, ...plantilla });
  }

  return json({ data: { status: esVerify ? "verified" : "suspended" } });
}
