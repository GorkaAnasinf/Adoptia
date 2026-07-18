import { enviarEmail } from "@/lib/email/mailer";
import { plantillaRelevoAcogida } from "@/lib/email/templates";
import { relevoAcogidaSchema } from "@/lib/schemas/acogida";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// Rate limit en memoria: un acogedor no puede spamear a la protectora.
const LIMITE = 5;
const VENTANA_MS = 60_000;
let peticiones = new Map<string, { count: number; resetAt: number }>();
export function __resetRateLimitForTests() {
  peticiones = new Map();
}

/**
 * El acogedor pide (o cancela) el relevo de su acogida aceptada (FEATURE-030).
 * La escritura va por RPC con doble guarda (destinatario + status aceptada):
 * la tabla no da update al acogedor. El aviso a la protectora es best-effort:
 * el relevo queda registrado y visible en su panel aunque el email falle.
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

  const parsed = relevoAcogidaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Petición inválida" } }, 422);
  }

  if ("cancelar" in parsed.data && parsed.data.cancelar === true) {
    const { error } = await supabase.rpc("cancelar_relevo", {
      p_proposal_id: parsed.data.proposal_id,
    });
    if (error) {
      return json({ error: { code: "not_found", message: "Propuesta no disponible" } }, 404);
    }
    return json({ data: { ok: true } });
  }

  const { proposal_id, motivo, fecha_limite } = parsed.data as {
    proposal_id: string;
    motivo: string;
    fecha_limite: string;
  };

  const { error } = await supabase.rpc("pedir_relevo", {
    p_proposal_id: proposal_id,
    p_motivo: motivo,
    p_fecha_limite: fecha_limite,
  });
  if (error) {
    return json({ error: { code: "not_found", message: "Propuesta no disponible" } }, 404);
  }

  // Aviso a la protectora (best-effort): el RLS deja al acogedor leer su
  // propuesta con los datos públicos de la protectora y el animal.
  const { data: propuesta } = await supabase
    .from("foster_proposals")
    .select("id, shelters (name, email), animals (name)")
    .eq("id", proposal_id)
    .maybeSingle();
  const shelter = (propuesta as { shelters?: { name: string; email: string | null } } | null)
    ?.shelters;
  const animal = (propuesta as { animals?: { name: string } | null } | null)?.animals;

  if (shelter?.email) {
    const plantilla = plantillaRelevoAcogida({
      shelterName: shelter.name,
      fosterName: (user.user_metadata?.full_name as string | undefined) ?? "",
      animalName: animal?.name ?? null,
      motivo,
      fechaLimite: fecha_limite,
    });
    try {
      await enviarEmail({ to: shelter.email, ...plantilla });
    } catch (err) {
      console.error("No se pudo enviar el aviso de relevo a la protectora:", err);
      // El relevo ya está registrado y visible en el panel: no se revierte.
    }
  }

  return json({ data: { ok: true } });
}
