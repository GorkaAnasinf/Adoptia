import { crearReporteSchema } from "@/lib/schemas/moderacion";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

// ---------- Rate limit en memoria por usuario (primera línea; el tope
// duro de 5/día vive en un trigger de BD) ----------
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

/** Reporta una ficha de animal. Requiere cuenta; RLS + trigger anti-abuso. */
export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  if (excedeLimite(user.id)) {
    return json(
      { error: { code: "rate_limited", message: "Demasiadas peticiones, espera un momento" } },
      429,
    );
  }

  const parsed = crearReporteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: { code: "validation", message: "Reporte inválido", issues: parsed.error.issues } },
      422,
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, ...parsed.data })
    .select("id, status")
    .single();
  if (error) {
    if (error.message.includes("reports_limit")) {
      return json(
        { error: { code: "daily_limit", message: "Has alcanzado el máximo de reportes por hoy" } },
        429,
      );
    }
    return json({ error: { code: "db_error", message: error.message } }, 500);
  }

  return json({ data }, 201);
}
