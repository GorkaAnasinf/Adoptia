import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import {
  plantillaJornadaCercana,
  plantillaJornadaProtectora,
  plantillaJornadaRecordatorio,
} from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

async function enviarEmailSeguro(payload: Parameters<typeof enviarEmail>[0]) {
  try {
    await enviarEmail(payload);
  } catch (err) {
    console.error("No se pudo enviar el aviso de jornada:", err);
  }
}

type EventoRecordatorio = {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  starts_at: string;
  reminder_sent_at: string | null;
  shelters: { name: string; email: string | null } | null;
  event_attendees: { user_id: string; reminded_at: string | null }[];
};

type ZonaMatch = {
  event_id: string;
  event_title: string;
  event_city: string | null;
  starts_at: string;
  user_id: string;
  search_name: string;
  unsubscribe_token: string;
};

/**
 * Avisos de jornadas de adopción (FEATURE-063). Dos bloques idempotentes:
 *  1. Recordatorio 24 h antes (ventana 23–25 h) a cada asistente sin
 *     `reminded_at`, y un resumen a la protectora si el evento no tiene
 *     `reminder_sent_at`.
 *  2. Aviso de jornada cercana a los adoptantes con una búsqueda guardada cuya
 *     zona cubre una jornada aún no avisada (`zone_notified_at`).
 * Se marca ANTES de enviar: si el email falla se pierde (aceptable), pero un
 * segundo cron nunca duplica.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const ahora = new Date().toISOString();
  let recordatorios = 0;
  let avisosProtectora = 0;
  let avisosZona = 0;

  // ---------- 1. Recordatorios 24 h ----------
  const desde = new Date(Date.now() + 23 * 3600 * 1000).toISOString();
  const hasta = new Date(Date.now() + 25 * 3600 * 1000).toISOString();

  const { data: evData, error: evErr } = await admin
    .from("events")
    .select("id, title, address, city, starts_at, reminder_sent_at, shelters(name, email), event_attendees(user_id, reminded_at)")
    .eq("status", "published")
    .gte("starts_at", desde)
    .lte("starts_at", hasta);
  if (evErr) {
    return Response.json({ error: { code: "db_error", message: evErr.message } }, { status: 500 });
  }

  const eventos = (evData as unknown as EventoRecordatorio[] | null) ?? [];
  for (const evento of eventos) {
    const fecha = new Date(evento.starts_at);
    const lugar = [evento.address, evento.city].filter(Boolean).join(", ");
    const asistentes = evento.event_attendees ?? [];

    for (const asistente of asistentes) {
      if (asistente.reminded_at) continue;
      await admin
        .from("event_attendees")
        .update({ reminded_at: ahora })
        .eq("event_id", evento.id)
        .eq("user_id", asistente.user_id);

      const contacto = await obtenerContactoAdoptante(admin, asistente.user_id);
      if (contacto.email) {
        await enviarEmailSeguro({
          to: contacto.email,
          ...plantillaJornadaRecordatorio({
            nombre: contacto.fullName ?? "",
            titulo: evento.title,
            lugar,
            fecha,
            eventId: evento.id,
          }),
        });
        recordatorios += 1;
      }
    }

    if (!evento.reminder_sent_at && evento.shelters?.email) {
      await admin.from("events").update({ reminder_sent_at: ahora }).eq("id", evento.id);
      await enviarEmailSeguro({
        to: evento.shelters.email,
        ...plantillaJornadaProtectora({
          nombre: evento.shelters.name,
          titulo: evento.title,
          fecha,
          asistentes: asistentes.length,
          eventId: evento.id,
        }),
      });
      avisosProtectora += 1;
    }
  }

  // ---------- 2. Avisos de jornada cercana por zona ----------
  const { data: zonaData, error: zonaErr } = await admin.rpc("event_zone_matches");
  if (zonaErr) {
    return Response.json({ error: { code: "db_error", message: zonaErr.message } }, { status: 500 });
  }
  const matches = (zonaData as ZonaMatch[] | null) ?? [];

  const porUsuario = new Map<string, ZonaMatch[]>();
  for (const m of matches) {
    porUsuario.set(m.user_id, [...(porUsuario.get(m.user_id) ?? []), m]);
  }

  for (const [userId, filas] of porUsuario) {
    // Dedup de jornadas por si varias búsquedas del usuario coinciden.
    const porEvento = new Map<string, ZonaMatch>();
    for (const f of filas) porEvento.set(f.event_id, f);
    const jornadas = [...porEvento.values()].map((f) => ({
      id: f.event_id,
      title: f.event_title,
      city: f.event_city,
      fecha: new Date(f.starts_at),
    }));

    const contacto = await obtenerContactoAdoptante(admin, userId);
    if (contacto.email) {
      await enviarEmailSeguro({
        to: contacto.email,
        ...plantillaJornadaCercana({
          nombre: contacto.fullName ?? "",
          jornadas,
          unsubscribeToken: filas[0].unsubscribe_token,
        }),
      });
      avisosZona += 1;
    }
  }

  // Marca los eventos avisados (los que tenían al menos una coincidencia).
  const eventosAvisados = [...new Set(matches.map((m) => m.event_id))];
  if (eventosAvisados.length > 0) {
    await admin.from("events").update({ zone_notified_at: ahora }).in("id", eventosAvisados);
  }

  return Response.json({
    data: { recordatorios, avisosProtectora, avisosZona, at: ahora },
  });
}
