import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import {
  plantillaCitaReservadaAdoptante,
  plantillaCitaReservadaProtectora,
} from "@/lib/email/templates";
import { crearCitaSchema } from "@/lib/schemas/cita";
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

type SolicitudConAnimal = {
  id: string;
  status: string;
  adopter_id: string;
  animals: {
    id: string;
    name: string;
    shelter_id: string;
    shelters: { name: string; email: string | null; owner_id: string } | null;
  } | null;
};

/**
 * Reserva una cita para una solicitud aprobada. El hueco elegido se revalida
 * contra el RPC de huecos libres y, como red final, la exclusion constraint
 * de BD convierte una carrera de doble reserva en un 409 limpio.
 */
export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const parsed = crearCitaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Datos de cita inválidos", issues: parsed.error.issues } },
      422,
    );
  }
  const { request_id, starts_at } = parsed.data;

  const { data } = await supabase
    .from("adoption_requests")
    .select("id, status, adopter_id, animals(id, name, shelter_id, shelters(name, email, owner_id))")
    .eq("id", request_id)
    .maybeSingle();
  const solicitud = data as unknown as SolicitudConAnimal | null;
  if (!solicitud || !solicitud.animals) {
    return json({ error: { code: "not_found", message: "Solicitud no encontrada" } }, 404);
  }
  if (solicitud.adopter_id !== user.id) {
    return json({ error: { code: "forbidden", message: "Solo quien envió la solicitud puede reservar cita" } }, 403);
  }
  if (solicitud.status !== "approved") {
    return json(
      { error: { code: "invalid_state", message: "Solo se puede reservar cita con una solicitud aprobada" } },
      409,
    );
  }

  const shelterId = solicitud.animals.shelter_id;
  const { data: huecos } = await supabase.rpc("appointment_free_slots", {
    p_shelter_id: shelterId,
    p_days: 30,
  });
  const objetivo = new Date(starts_at).getTime();
  const hueco = (
    (huecos as { starts_at: string; ends_at: string }[] | null) ?? []
  ).find((h) => new Date(h.starts_at).getTime() === objetivo);
  if (!hueco) {
    return json(
      { error: { code: "slot_unavailable", message: "Ese hueco ya no está disponible" } },
      409,
    );
  }

  const { data: cita, error } = await supabase
    .from("appointments")
    .insert({
      request_id,
      shelter_id: shelterId,
      adopter_id: user.id,
      starts_at: hueco.starts_at,
      ends_at: hueco.ends_at,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23P01") {
      return json(
        { error: { code: "slot_taken", message: "Alguien acaba de reservar ese hueco" } },
        409,
      );
    }
    return json({ error: { code: "db_error", message: error.message } }, 500);
  }

  const fecha = new Date(hueco.starts_at);
  const animal = solicitud.animals;
  const shelter = animal.shelters;

  const admin = createAdminClient();
  const contacto = await obtenerContactoAdoptante(admin, user.id);
  if (contacto.email) {
    const plantilla = plantillaCitaReservadaAdoptante({
      adopterName: contacto.fullName ?? "",
      animalName: animal.name,
      shelterName: shelter?.name ?? "",
      fecha,
    });
    await enviarEmailSeguro({ to: contacto.email, ...plantilla });
  }
  if (shelter?.email) {
    const plantilla = plantillaCitaReservadaProtectora({
      shelterName: shelter.name,
      animalName: animal.name,
      fecha,
    });
    await enviarEmailSeguro({ to: shelter.email, ...plantilla });
  }

  return json({ data: cita }, 201);
}
