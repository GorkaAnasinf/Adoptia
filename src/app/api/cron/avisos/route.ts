import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Caducidades diarias:
 * - Avisos de perdidos/encontrados abiertos sin actividad en 60 días →
 *   `archived` (dejan de ser públicos, el autor los conserva).
 * - Ofertas de donación abiertas sin renovar en 60 días → `caducada`
 *   (desaparecen del tablón de protectoras; el donante puede renovarlas).
 * Idempotente por naturaleza: repetir no cambia nada.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const limite = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("lost_found_posts")
    .update({ status: "archived" })
    .eq("status", "open")
    .lt("last_activity_at", limite)
    .select("id");
  if (error) {
    return Response.json({ error: { code: "db_error", message: error.message } }, { status: 500 });
  }

  const { data: caducadas, error: errorDonaciones } = await admin
    .from("donation_offers")
    .update({ status: "caducada" })
    .eq("status", "abierta")
    .lt("renovada_at", limite)
    .select("id");
  if (errorDonaciones) {
    return Response.json(
      { error: { code: "db_error", message: errorDonaciones.message } },
      { status: 500 },
    );
  }

  return Response.json({
    data: {
      archivados: (data ?? []).length,
      donacionesCaducadas: (caducadas ?? []).length,
      at: new Date().toISOString(),
    },
  });
}
