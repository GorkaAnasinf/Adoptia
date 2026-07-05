import { createClient } from "@/lib/supabase/server";

/**
 * Keepalive del proyecto Supabase free (se pausa tras ~7 días sin actividad).
 * Protegido con CRON_SECRET; pensado para Vercel Cron / GitHub Actions.
 */
export async function GET(req: Request) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shelters")
    .select("*", { count: "exact", head: true });

  if (error) {
    return Response.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }

  return Response.json({ data: { ok: true, at: new Date().toISOString() } });
}
