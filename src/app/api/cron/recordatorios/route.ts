import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaCitaRecordatorio } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

async function enviarEmailSeguro(payload: Parameters<typeof enviarEmail>[0]) {
  try {
    await enviarEmail(payload);
  } catch (err) {
    console.error("No se pudo enviar el recordatorio de cita:", err);
  }
}

type CitaRecordatorio = {
  id: string;
  adopter_id: string;
  starts_at: string;
  adoption_requests: { animals: { name: string } | null } | null;
  shelters: { name: string; email: string | null } | null;
};

/**
 * Recordatorio 24 h antes de cada cita confirmada. Idempotente: marca
 * `reminder_sent_at` y filtra por él, así que si el cron corre dos veces no
 * se duplica ningún email. Ventana ancha (23–25 h) para tolerar retrasos del
 * scheduler sin dejar citas sin avisar.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const desde = new Date(Date.now() + 23 * 3600 * 1000).toISOString();
  const hasta = new Date(Date.now() + 25 * 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("appointments")
    .select("id, adopter_id, starts_at, adoption_requests(animals(name)), shelters(name, email)")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", desde)
    .lte("starts_at", hasta);
  if (error) {
    return Response.json({ error: { code: "db_error", message: error.message } }, { status: 500 });
  }

  const citas = (data as unknown as CitaRecordatorio[] | null) ?? [];
  let enviados = 0;

  for (const cita of citas) {
    const animalName = cita.adoption_requests?.animals?.name ?? "";
    const fecha = new Date(cita.starts_at);

    // Marca ANTES de enviar: si el envío falla lo perdemos (aceptable), pero
    // un segundo cron nunca duplica.
    await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", cita.id);

    const contacto = await obtenerContactoAdoptante(admin, cita.adopter_id);
    if (contacto.email) {
      const plantilla = plantillaCitaRecordatorio({
        nombre: contacto.fullName ?? "",
        animalName,
        fecha,
      });
      await enviarEmailSeguro({ to: contacto.email, ...plantilla });
    }
    if (cita.shelters?.email) {
      const plantilla = plantillaCitaRecordatorio({
        nombre: cita.shelters.name,
        animalName,
        fecha,
      });
      await enviarEmailSeguro({ to: cita.shelters.email, ...plantilla });
    }
    enviados += 1;
  }

  return Response.json({ data: { enviados, at: new Date().toISOString() } });
}
