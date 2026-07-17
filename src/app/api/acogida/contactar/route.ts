import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaContactoAcogida } from "@/lib/email/templates";
import { propuestaAcogidaSchema } from "@/lib/schemas/acogida";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// Rate limit en memoria: una protectora no puede spamear acogedores.
const LIMITE = 10;
const VENTANA_MS = 60_000;
let peticiones = new Map<string, { count: number; resetAt: number }>();
export function __resetRateLimitForTests() {
  peticiones = new Map();
}

/**
 * Propuesta de acogida protectora → acogedor (FEATURE-029). Persiste la
 * propuesta (una sola activa por pareja: índice único en BD) y envía el email
 * AL ACOGEDOR con los datos de la protectora, el animal, la duración y el
 * mensaje — nunca al revés: su contacto no se expone. Solo puede proponerse a
 * acogedores que el RPC de proximidad devuelve para la protectora del llamante.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const entrada = peticiones.get(user.id);
  const ahora = Date.now();
  if (!entrada || entrada.resetAt < ahora) {
    peticiones.set(user.id, { count: 1, resetAt: ahora + VENTANA_MS });
  } else if (++entrada.count > LIMITE) {
    return json({ error: { code: "rate_limited", message: "Demasiadas peticiones" } }, 429);
  }

  const parsed = propuestaAcogidaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Petición inválida" } }, 422);
  }
  const { foster_user_id, animal_id, duracion, mensaje } = parsed.data;

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id, name, email, phone, status")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!shelter || shelter.status !== "verified") {
    return json(
      { error: { code: "forbidden", message: "Solo protectoras verificadas pueden contactar" } },
      403,
    );
  }

  // El RPC ya aplica verificación + radio: si el acogedor no está en la lista
  // de esta protectora, no se le puede contactar.
  const { data: cercanos } = await supabase.rpc("foster_homes_nearby", {
    p_shelter_id: shelter.id,
  });
  const foster = ((cercanos as { user_id: string; full_name: string | null }[] | null) ?? []).find(
    (f) => f.user_id === foster_user_id,
  );
  if (!foster) {
    return json(
      { error: { code: "not_found", message: "Acogedor no disponible para tu protectora" } },
      404,
    );
  }

  // El animal, si se indica, debe ser de la propia protectora (RLS lo re-verifica).
  let animalName: string | null = null;
  if (animal_id) {
    const { data: animal } = await supabase
      .from("animals")
      .select("id, name")
      .eq("id", animal_id)
      .eq("shelter_id", shelter.id)
      .maybeSingle();
    if (!animal) {
      return json(
        { error: { code: "animal_not_found", message: "El animal no es de tu protectora" } },
        404,
      );
    }
    animalName = animal.name as string;
  }

  // Contacto antes de persistir: sin email posible, no se abre propuesta.
  const contacto = await obtenerContactoAdoptante(createAdminClient(), foster_user_id);
  if (!contacto.email) {
    return json({ error: { code: "no_email", message: "El acogedor no tiene email" } }, 409);
  }

  const { error: errPropuesta } = await supabase.from("foster_proposals").insert({
    shelter_id: shelter.id,
    foster_user_id,
    animal_id: animal_id ?? null,
    duracion,
    mensaje,
  });
  if (errPropuesta) {
    if (errPropuesta.code === "23505") {
      return json(
        {
          error: {
            code: "proposal_exists",
            message: "Ya tienes una propuesta abierta con este acogedor",
          },
        },
        409,
      );
    }
    return json({ error: { code: "db_error", message: "No se pudo guardar la propuesta" } }, 500);
  }

  const plantilla = plantillaContactoAcogida({
    fosterName: contacto.fullName ?? "",
    shelterName: shelter.name,
    shelterEmail: shelter.email,
    shelterPhone: shelter.phone,
    animalName,
    duracion,
    mensaje,
  });
  try {
    await enviarEmail({ to: contacto.email, ...plantilla });
  } catch (err) {
    console.error("No se pudo enviar el email de propuesta de acogida:", err);
    // Compensación: sin aviso al acogedor la propuesta no debe quedar abierta
    // (el índice único bloquearía el reintento). RLS no deja borrar a la
    // protectora: va con el cliente admin.
    await createAdminClient()
      .from("foster_proposals")
      .delete()
      .eq("shelter_id", shelter.id)
      .eq("foster_user_id", foster_user_id)
      .eq("status", "enviada");
    return json({ error: { code: "email_error", message: "No se pudo enviar el aviso" } }, 502);
  }

  return json({ data: { ok: true } });
}
