import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaContactoAcogida } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

const bodySchema = z.object({ foster_user_id: z.uuid() });

// Rate limit en memoria: una protectora no puede spamear acogedores.
const LIMITE = 10;
const VENTANA_MS = 60_000;
let peticiones = new Map<string, { count: number; resetAt: number }>();
export function __resetRateLimitForTests() {
  peticiones = new Map();
}

/**
 * Primer contacto protectora → acogedor. El email va AL ACOGEDOR con los
 * datos de la protectora (nunca al revés: su contacto no se expone). Solo
 * puede contactarse a acogedores que el RPC de proximidad devuelve para la
 * protectora del llamante (verificada y dentro del radio del acogedor).
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

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Petición inválida" } }, 422);
  }

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
    (f) => f.user_id === parsed.data.foster_user_id,
  );
  if (!foster) {
    return json(
      { error: { code: "not_found", message: "Acogedor no disponible para tu protectora" } },
      404,
    );
  }

  const contacto = await obtenerContactoAdoptante(createAdminClient(), foster.user_id);
  if (!contacto.email) {
    return json({ error: { code: "no_email", message: "El acogedor no tiene email" } }, 409);
  }

  const plantilla = plantillaContactoAcogida({
    fosterName: contacto.fullName ?? "",
    shelterName: shelter.name,
    shelterEmail: shelter.email,
    shelterPhone: shelter.phone,
  });
  try {
    await enviarEmail({ to: contacto.email, ...plantilla });
  } catch (err) {
    console.error("No se pudo enviar el email de contacto de acogida:", err);
    return json({ error: { code: "email_error", message: "No se pudo enviar el aviso" } }, 502);
  }

  return json({ data: { ok: true } });
}
