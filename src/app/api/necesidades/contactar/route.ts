import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaContactoNecesidad } from "@/lib/email/templates";
import { ayudaNecesidadSchema } from "@/lib/schemas/necesidades";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// Rate limit en memoria: nadie spamea a las protectoras.
const LIMITE = 5;
const VENTANA_MS = 3_600_000;
let peticiones = new Map<string, { count: number; resetAt: number }>();
export function __resetRateLimitForTests() {
  peticiones = new Map();
}

/**
 * «Puedo ayudar» (FEATURE-031). Relay puro: el email va A LA PROTECTORA con el
 * mensaje del usuario y `Reply-To` con su correo, que cede conscientemente al
 * escribir (avisado en el formulario). La RLS ya oculta las necesidades
 * cubiertas o de protectoras sin verificar: si no se ve, es 404.
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
    return json({ error: { code: "rate_limited", message: "Demasiados mensajes" } }, 429);
  }

  const parsed = ayudaNecesidadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Escribe un mensaje algo más largo" } },
      422,
    );
  }

  const { data: need } = await supabase
    .from("shelter_needs")
    .select("id, descripcion, categoria, status, shelters (name, email)")
    .eq("id", parsed.data.need_id)
    .maybeSingle();
  const shelter = (need as { shelters?: { name: string; email: string | null } } | null)?.shelters;
  if (!need || !shelter) {
    return json({ error: { code: "not_found", message: "Necesidad no disponible" } }, 404);
  }
  if (!shelter.email) {
    return json({ error: { code: "no_email", message: "La protectora no tiene email" } }, 409);
  }

  const remitente = await obtenerContactoAdoptante(createAdminClient(), user.id);
  const plantilla = plantillaContactoNecesidad({
    shelterName: shelter.name,
    remitenteNombre: remitente.fullName,
    descripcion: need.descripcion as string,
    mensaje: parsed.data.mensaje,
  });
  try {
    await enviarEmail({ to: shelter.email, replyTo: user.email ?? undefined, ...plantilla });
  } catch (err) {
    console.error("No se pudo enviar el mensaje de ayuda a la protectora:", err);
    return json({ error: { code: "email_error", message: "No se pudo enviar el mensaje" } }, 502);
  }

  return json({ data: { ok: true } });
}
