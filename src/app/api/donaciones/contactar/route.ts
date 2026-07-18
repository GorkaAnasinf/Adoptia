import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaContactoDonacion } from "@/lib/email/templates";
import { contactoDonacionSchema } from "@/lib/schemas/donaciones";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// Rate limit en memoria: una protectora no puede spamear donantes.
const LIMITE = 10;
const VENTANA_MS = 60_000;
let peticiones = new Map<string, { count: number; resetAt: number }>();
export function __resetRateLimitForTests() {
  peticiones = new Map();
}

type OfertaCercana = {
  id: string;
  full_name: string | null;
  categoria: string;
  descripcion: string;
};

/**
 * Contacto protectora → donante sobre una oferta de donación (FEATURE-032).
 * Relay puro: el email va AL DONANTE con los datos de la protectora — nunca al
 * revés: su contacto se resuelve server-side y no se devuelve al llamante.
 * Solo puede contactarse una oferta que el RPC de proximidad devuelve para la
 * protectora del llamante (verificada + radio del donante).
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

  const parsed = contactoDonacionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Petición inválida" } }, 422);
  }
  const { offer_id, mensaje } = parsed.data;

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

  // El RPC ya aplica verificación + radio: si la oferta no está en la lista de
  // esta protectora, no se puede contactar.
  const { data: cercanas } = await supabase.rpc("donation_offers_nearby", {
    p_shelter_id: shelter.id,
  });
  const oferta = ((cercanas as OfertaCercana[] | null) ?? []).find((o) => o.id === offer_id);
  if (!oferta) {
    return json(
      { error: { code: "not_found", message: "Oferta no disponible para tu protectora" } },
      404,
    );
  }

  // El contacto del donante se resuelve con service_role y nunca se devuelve.
  const admin = createAdminClient();
  const { data: fila } = await admin
    .from("donation_offers")
    .select("user_id")
    .eq("id", offer_id)
    .maybeSingle();
  if (!fila) {
    return json({ error: { code: "not_found", message: "Oferta no disponible" } }, 404);
  }
  const contacto = await obtenerContactoAdoptante(admin, fila.user_id as string);
  if (!contacto.email) {
    return json({ error: { code: "no_email", message: "El donante no tiene email" } }, 409);
  }

  const plantilla = plantillaContactoDonacion({
    donanteNombre: contacto.fullName,
    shelterName: shelter.name,
    shelterEmail: shelter.email,
    shelterPhone: shelter.phone,
    descripcion: oferta.descripcion,
    mensaje,
  });
  try {
    await enviarEmail({ to: contacto.email, replyTo: shelter.email ?? undefined, ...plantilla });
  } catch (err) {
    console.error("No se pudo enviar el contacto de donación:", err);
    return json({ error: { code: "email_error", message: "No se pudo enviar el mensaje" } }, 502);
  }

  return json({ data: { ok: true } });
}
