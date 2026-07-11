import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Caducidad de avisos de perdidos/encontrados: los abiertos sin actividad en
 * 60 días pasan a `archived` (dejan de ser públicos, el autor los conserva).
 * Idempotente por naturaleza: archivar dos veces no cambia nada.
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

  return Response.json({
    data: { archivados: (data ?? []).length, at: new Date().toISOString() },
  });
}
