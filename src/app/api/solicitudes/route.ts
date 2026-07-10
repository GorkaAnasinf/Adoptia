import { enviarEmail } from "@/lib/email/mailer";
import { plantillaSolicitudRecibida } from "@/lib/email/templates";
import { crearSolicitudSchema } from "@/lib/schemas/solicitud";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// ---------- Rate limit en memoria por usuario ----------
const LIMITE_PETICIONES = 10;
const VENTANA_MS = 60_000;
let peticionesPorUsuario = new Map<string, { count: number; resetAt: number }>();

export function __resetRateLimitForTests() {
  peticionesPorUsuario = new Map();
}

function excedeLimite(userId: string): boolean {
  const ahora = Date.now();
  const entrada = peticionesPorUsuario.get(userId);
  if (!entrada || entrada.resetAt < ahora) {
    peticionesPorUsuario.set(userId, { count: 1, resetAt: ahora + VENTANA_MS });
    return false;
  }
  entrada.count += 1;
  return entrada.count > LIMITE_PETICIONES;
}

/**
 * Crea una solicitud de adopción ("Me interesa") para un animal disponible.
 * Valida el cuestionario completo en servidor, aplica honeypot + rate limit
 * por usuario y avisa por email a la protectora dueña del animal.
 */
export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  if (excedeLimite(user.id)) {
    return json({ error: { code: "rate_limited", message: "Demasiadas peticiones, espera un momento" } }, 429);
  }

  const parsed = crearSolicitudSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Cuestionario inválido", issues: parsed.error.issues } },
      422,
    );
  }

  // Honeypot: si el campo oculto viene relleno, es un bot. Respondemos 201
  // "falso" (sin crear nada ni avisar) para no delatar el filtro.
  if (parsed.data.website) {
    return json({ data: { id: crypto.randomUUID(), status: "pending" } }, 201);
  }

  const { animal_id, questionnaire, message } = parsed.data;

  const { data: animal } = await supabase
    .from("animals")
    .select("id, status, name, shelter_id")
    .eq("id", animal_id)
    .maybeSingle();
  if (!animal) {
    return json({ error: { code: "not_found", message: "Animal no encontrado" } }, 404);
  }
  if (animal.status !== "available") {
    return json(
      { error: { code: "not_available", message: "Este animal ya no está disponible" } },
      403,
    );
  }

  const { data: solicitud, error } = await supabase
    .from("adoption_requests")
    .insert({
      animal_id,
      adopter_id: user.id,
      questionnaire,
      message: message ?? questionnaire.message ?? null,
    })
    .select("id, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return json(
        {
          error: {
            code: "duplicate_request",
            message: "Ya tienes una solicitud para este animal",
          },
        },
        409,
      );
    }
    return json({ error: { code: "db_error", message: error.message } }, 500);
  }

  const { data: shelter } = await supabase
    .from("shelters")
    .select("name, email")
    .eq("id", animal.shelter_id)
    .maybeSingle();
  if (shelter?.email) {
    const plantilla = plantillaSolicitudRecibida({ shelterName: shelter.name, animalName: animal.name });
    await enviarEmail({ to: shelter.email, ...plantilla });
  }

  return json({ data: solicitud }, 201);
}
