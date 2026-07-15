import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaContactoAviso } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

const bodySchema = z.object({ mensaje: z.string().trim().min(10).max(1000) });

// Rate limit en memoria: nadie spamea al dueño de un aviso.
const LIMITE = 5;
const VENTANA_MS = 3_600_000;
let peticiones = new Map<string, { count: number; resetAt: number }>();
export function __resetRateLimitForTests() {
  peticiones = new Map();
}

/**
 * Contacto vecino → autor de un aviso de perdido/encontrado. El email va AL
 * AUTOR; el suyo nunca se devuelve al llamante. La conversación se abre por
 * `Reply-To` con el correo del remitente, que lo cede al escribir.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Escribe un mensaje algo más largo" } }, 422);
  }

  const { id } = await ctx.params;
  // RLS ya oculta los avisos archivados ajenos: si no lo ve, es 404.
  const { data: aviso } = await supabase
    .from("lost_found_posts")
    .select("id, user_id, name, type, status, allow_contact")
    .eq("id", id)
    .maybeSingle();
  if (!aviso) return json({ error: { code: "not_found", message: "Aviso no encontrado" } }, 404);
  if (aviso.status !== "open") {
    return json({ error: { code: "aviso_cerrado", message: "El aviso ya no está activo" } }, 409);
  }
  if (!aviso.allow_contact) {
    return json(
      { error: { code: "contacto_cerrado", message: "El autor no acepta mensajes" } },
      409,
    );
  }

  const admin = createAdminClient();
  const [autor, remitente] = await Promise.all([
    obtenerContactoAdoptante(admin, aviso.user_id as string),
    obtenerContactoAdoptante(admin, user.id),
  ]);
  if (!autor.email) {
    return json({ error: { code: "no_email", message: "El autor no tiene email" } }, 409);
  }

  const plantilla = plantillaContactoAviso({
    avisoId: aviso.id as string,
    avisoTitulo: (aviso.name as string | null) ?? (aviso.type === "lost" ? "animal perdido" : "animal encontrado"),
    autorNombre: autor.fullName,
    remitenteNombre: remitente.fullName,
    mensaje: parsed.data.mensaje,
  });
  try {
    await enviarEmail({ to: autor.email, replyTo: user.email ?? undefined, ...plantilla });
  } catch (err) {
    console.error("No se pudo enviar el mensaje al autor del aviso:", err);
    return json({ error: { code: "email_error", message: "No se pudo enviar el mensaje" } }, 502);
  }

  return json({ data: { ok: true } });
}
