import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaCitaCancelada } from "@/lib/email/templates";
import { accionCitaSchema } from "@/lib/schemas/cita";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function enviarEmailSeguro(payload: Parameters<typeof enviarEmail>[0]) {
  try {
    await enviarEmail(payload);
  } catch (err) {
    console.error("No se pudo enviar el email de la cita:", err);
  }
}

type CitaConContexto = {
  id: string;
  status: string;
  adopter_id: string;
  starts_at: string;
  adoption_requests: { animals: { name: string } | null } | null;
  shelters: { name: string; email: string | null; owner_id: string } | null;
};

/**
 * Gestiona una cita: cancelar (cualquiera de las partes, con motivo y aviso a
 * la otra), marcar realizada o registrar que el adoptante no se presentó
 * (solo la protectora).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const { data } = await supabase
    .from("appointments")
    .select(
      "id, status, adopter_id, starts_at, adoption_requests(animals(name)), shelters(name, email, owner_id)",
    )
    .eq("id", id)
    .maybeSingle();
  const cita = data as unknown as CitaConContexto | null;
  if (!cita) return json({ error: { code: "not_found", message: "Cita no encontrada" } }, 404);

  const parsed = accionCitaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Acción inválida (¿falta el motivo?)", issues: parsed.error.issues } },
      422,
    );
  }
  const accion = parsed.data;

  const esProtectora = cita.shelters?.owner_id === user.id;
  const esAdoptante = cita.adopter_id === user.id;

  if (accion.accion === "cancel") {
    if (!esProtectora && !esAdoptante) {
      return json({ error: { code: "forbidden", message: "Esta cita no es tuya" } }, 403);
    }
  } else if (!esProtectora) {
    return json(
      { error: { code: "forbidden", message: "Solo la protectora puede registrar el resultado de la visita" } },
      403,
    );
  }

  if (!["pending", "confirmed"].includes(cita.status)) {
    return json({ error: { code: "invalid_state", message: "Esta cita ya está cerrada" } }, 409);
  }

  const cambios: Record<string, unknown> =
    accion.accion === "cancel"
      ? { status: "cancelled", cancel_reason: accion.motivo, cancelled_by: user.id }
      : { status: accion.accion === "done" ? "done" : "no_show" };

  const { data: actualizada, error } = await supabase
    .from("appointments")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();
  if (error) return json({ error: { code: "db_error", message: error.message } }, 500);

  if (accion.accion === "cancel") {
    const animalName = cita.adoption_requests?.animals?.name ?? "";
    const fecha = new Date(cita.starts_at);
    if (esProtectora) {
      // Avisa al adoptante
      const contacto = await obtenerContactoAdoptante(createAdminClient(), cita.adopter_id);
      if (contacto.email) {
        const plantilla = plantillaCitaCancelada({
          nombre: contacto.fullName ?? "",
          animalName,
          fecha,
          motivo: accion.motivo,
          canceladaPorProtectora: true,
        });
        await enviarEmailSeguro({ to: contacto.email, ...plantilla });
      }
    } else if (cita.shelters?.email) {
      // Avisa a la protectora
      const plantilla = plantillaCitaCancelada({
        nombre: cita.shelters.name,
        animalName,
        fecha,
        motivo: accion.motivo,
        canceladaPorProtectora: false,
      });
      await enviarEmailSeguro({ to: cita.shelters.email, ...plantilla });
    }
  }

  return json({ data: actualizada });
}
