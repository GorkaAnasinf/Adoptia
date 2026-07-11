import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import {
  plantillaSolicitudCerradaPorAdopcion,
  plantillaSolicitudResuelta,
} from "@/lib/email/templates";
import { esTransicionValida } from "@/lib/schemas/animal";
import { accionSolicitudSchema } from "@/lib/schemas/solicitud";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * El email es best-effort: si SMTP falla (config, red…) no debe tumbar la
 * respuesta cuando el cambio de estado ya se guardó en BD. Se registra y se
 * sigue.
 */
async function enviarEmailSeguro(payload: Parameters<typeof enviarEmail>[0]) {
  try {
    await enviarEmail(payload);
  } catch (err) {
    console.error("No se pudo enviar el email de la solicitud:", err);
  }
}

type SolicitudConAnimal = {
  id: string;
  status: string;
  animal_id: string;
  adopter_id: string;
  animals: {
    id: string;
    name: string;
    status: string;
    shelter_id: string;
    species: string | null;
    shelters: { owner_id: string } | null;
  } | null;
};

/** Animales disponibles de la misma especie, para sugerir en el email de cierre por adopción. */
async function cargarAnimalesSimilares(
  supabase: Awaited<ReturnType<typeof createClient>>,
  animal: { id: string; species: string | null },
): Promise<{ name: string; slug: string }[]> {
  if (!animal.species) return [];
  const { data } = await supabase
    .from("animals")
    .select("name, slug")
    .eq("species", animal.species)
    .eq("status", "available")
    .not("published_at", "is", null)
    .neq("id", animal.id)
    .limit(3);
  return (data as { name: string; slug: string }[] | null) ?? [];
}

/**
 * Aprueba, rechaza o cierra ("marcar adoptado") una solicitud. Solo la
 * protectora dueña del animal puede actuar. El rechazo exige motivo. Al
 * marcar como adoptado, el resto de solicitudes pendientes del mismo animal
 * se cierran automáticamente con un email amable.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const { data: solicitud } = await supabase
    .from("adoption_requests")
    .select("id, status, animal_id, adopter_id, animals(id, name, status, shelter_id, species, shelters(owner_id))")
    .eq("id", id)
    .maybeSingle();
  const fila = solicitud as unknown as SolicitudConAnimal | null;
  if (!fila) {
    return json({ error: { code: "not_found", message: "Solicitud no encontrada" } }, 404);
  }

  const parsed = accionSolicitudSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Acción inválida (¿falta el motivo del rechazo?)", issues: parsed.error.issues } },
      422,
    );
  }
  const accion = parsed.data;

  // Autorización por acción: withdraw es del adoptante dueño de la solicitud;
  // el resto (aprobar/rechazar/adoptar/notas) son de la protectora del animal.
  if (accion.accion === "withdraw") {
    if (fila.adopter_id !== user.id) {
      return json({ error: { code: "forbidden", message: "Solo quien envió la solicitud puede retirarla" } }, 403);
    }
  } else if (fila.animals?.shelters?.owner_id !== user.id) {
    return json({ error: { code: "forbidden", message: "Solo la protectora dueña puede gestionar esta solicitud" } }, 403);
  }

  // Las notas internas se pueden editar en cualquier momento; el resto de
  // acciones exigen que la solicitud siga pendiente.
  if (accion.accion !== "note" && fila.status !== "pending") {
    return json(
      { error: { code: "invalid_state", message: "Esta solicitud ya está resuelta" } },
      409,
    );
  }

  if (accion.accion === "withdraw") {
    const { data, error } = await supabase
      .from("adoption_requests")
      .update({ status: "withdrawn" })
      .eq("id", id)
      .select("id, status")
      .single();
    if (error) return json({ error: { code: "db_error", message: error.message } }, 500);
    return json({ data });
  }

  if (accion.accion === "note") {
    // `shelter_notes` tiene el privilegio de columna SELECT revocado para el
    // rol `authenticated` (migración FEATURE-007 column RLS): no se puede
    // pedir de vuelta con `.select()` desde este cliente. Como la fila ya
    // está autorizada (protectora dueña, verificado arriba) y sabemos qué se
    // escribió, la respuesta se construye sin releer la columna.
    const { error } = await supabase
      .from("adoption_requests")
      .update({ shelter_notes: accion.nota })
      .eq("id", id)
      .select("id")
      .single();
    if (error) return json({ error: { code: "db_error", message: error.message } }, 500);
    return json({ data: { id, shelter_notes: accion.nota } });
  }

  const nuevoEstado = { approve: "approved", reject: "rejected", complete: "completed" }[accion.accion] as
    | "approved"
    | "rejected"
    | "completed";

  const { data: actualizada, error } = await supabase
    .from("adoption_requests")
    .update({ status: nuevoEstado })
    .eq("id", id)
    .select("id, status")
    .single();
  if (error) {
    return json({ error: { code: "db_error", message: error.message } }, 500);
  }

  const admin = createAdminClient();
  const animal = fila.animals;

  if (accion.accion === "approve" && animal) {
    if (esTransicionValida(animal.status as never, "reserved" as never)) {
      await supabase.from("animals").update({ status: "reserved" }).eq("id", animal.id);
    }
    const contacto = await obtenerContactoAdoptante(admin, fila.adopter_id);
    if (contacto.email) {
      const plantilla = plantillaSolicitudResuelta({
        adopterName: contacto.fullName ?? "",
        animalName: animal.name,
        resultado: "approved",
      });
      await enviarEmailSeguro({ to: contacto.email, ...plantilla });
    }
  }

  if (accion.accion === "reject" && animal) {
    const contacto = await obtenerContactoAdoptante(admin, fila.adopter_id);
    if (contacto.email) {
      const plantilla = plantillaSolicitudResuelta({
        adopterName: contacto.fullName ?? "",
        animalName: animal.name,
        resultado: "rejected",
        motivo: accion.motivo,
      });
      await enviarEmailSeguro({ to: contacto.email, ...plantilla });
    }
  }

  if (accion.accion === "complete" && animal) {
    if (esTransicionValida(animal.status as never, "adopted" as never)) {
      await supabase.from("animals").update({ status: "adopted" }).eq("id", animal.id);
    }

    // Cierra el resto de solicitudes pendientes del mismo animal con email amable.
    const { data: otras } = await supabase
      .from("adoption_requests")
      .select("id, adopter_id")
      .eq("animal_id", animal.id)
      .eq("status", "pending")
      .neq("id", id);

    const animalesSimilares = await cargarAnimalesSimilares(supabase, animal);

    for (const otra of (otras as { id: string; adopter_id: string }[] | null) ?? []) {
      await supabase.from("adoption_requests").update({ status: "rejected" }).eq("id", otra.id);
      const contacto = await obtenerContactoAdoptante(admin, otra.adopter_id);
      if (contacto.email) {
        const plantilla = plantillaSolicitudCerradaPorAdopcion({
          adopterName: contacto.fullName ?? "",
          animalName: animal.name,
          animalesSimilares,
        });
        await enviarEmailSeguro({ to: contacto.email, ...plantilla });
      }
    }
  }

  return json({ data: actualizada });
}
