import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaAvistamiento } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

const NOVENTA_DIAS_MS = 90 * 24 * 3600 * 1000;

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  seen_at: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "fecha inválida")
    .refine((v) => Date.parse(v) <= Date.now() + 300_000, "no puede ser futura")
    .refine((v) => Date.parse(v) >= Date.now() - NOVENTA_DIAS_MS, "demasiado antigua"),
  nota: z.string().trim().max(500).optional(),
  photo_url: z.url().max(500).optional(),
});

// Rate limit en memoria: un aviso no se llena de pistas falsas.
const LIMITE = 3;
const VENTANA_MS = 3_600_000;
let peticiones = new Map<string, { count: number; resetAt: number }>();
export function __resetRateLimitForTests() {
  peticiones = new Map();
}

/**
 * "He visto a este animal": pista de un vecino sobre un aviso abierto. La
 * coordenada la redondea BD (~200 m) antes de guardarla, igual que la del
 * aviso. Avisa al autor por email; si el correo falla, la pista se queda igual
 * — perderla sería peor que no avisar.
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
    return json({ error: { code: "rate_limited", message: "Demasiados avistamientos" } }, 429);
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Revisa el pin y la fecha" } }, 422);
  }

  const { id } = await ctx.params;
  const { data: aviso } = await supabase
    .from("lost_found_posts")
    .select("id, user_id, name, type, status")
    .eq("id", id)
    .maybeSingle();
  if (!aviso) return json({ error: { code: "not_found", message: "Aviso no encontrado" } }, 404);
  if (aviso.status !== "open") {
    return json({ error: { code: "aviso_cerrado", message: "El aviso ya no está activo" } }, 409);
  }

  const { lat, lng, seen_at, nota, photo_url } = parsed.data;
  const { data: creado, error } = await supabase
    .from("lost_found_sightings")
    .insert({
      post_id: id,
      user_id: user.id,
      seen_at,
      note: nota ?? null,
      photo_url: photo_url ?? null,
      location: `POINT(${lng} ${lat})`,
    })
    .select()
    .single();
  if (error) {
    return json({ error: { code: "db_error", message: "No se pudo guardar el avistamiento" } }, 500);
  }

  // Notificar es best-effort: la pista ya está a salvo.
  try {
    const autor = await obtenerContactoAdoptante(createAdminClient(), aviso.user_id as string);
    if (autor.email) {
      const plantilla = plantillaAvistamiento({
        avisoId: aviso.id as string,
        avisoTitulo:
          (aviso.name as string | null) ??
          (aviso.type === "lost" ? "animal perdido" : "animal encontrado"),
        autorNombre: autor.fullName,
        cuando: new Date(seen_at).toLocaleString("es-ES", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Europe/Madrid",
        }),
        nota: nota ?? null,
      });
      await enviarEmail({ to: autor.email, ...plantilla });
    }
  } catch (err) {
    console.error("No se pudo avisar al autor del avistamiento:", err);
  }

  return json({ data: { id: (creado as { id: string }).id } }, 201);
}
