import { obtenerContactoAdoptante } from "@/lib/adopter-contact";
import { enviarEmail } from "@/lib/email/mailer";
import { plantillaAlertaAnimales, plantillaFavoritoAdoptado } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

async function enviarEmailSeguro(payload: Parameters<typeof enviarEmail>[0]) {
  try {
    await enviarEmail(payload);
  } catch (err) {
    console.error("No se pudo enviar el email de alertas:", err);
  }
}

type Match = {
  search_id: string;
  user_id: string;
  search_name: string;
  unsubscribe_token: string;
  animal_id: string;
  animal_name: string;
  animal_slug: string;
};

type FavoritoAdoptado = {
  user_id: string;
  animal_id: string;
  animals: { name: string; slug: string; status: string } | null;
};

/**
 * Alertas diarias del adoptante. Agrupa todas las coincidencias de un usuario
 * en UN email (límite de Resend) y marca `last_sent_at` por alerta (máx.
 * 1/día; el RPC ya filtra las recientes). Además avisa —una sola vez, vía
 * `notified_at`— cuando un favorito ha sido adoptado.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  let emailsAlertas = 0;
  let emailsFavoritos = 0;

  // ---------- Alertas ----------
  const { data: matchData, error } = await admin.rpc("saved_search_matches", { p_hours: 24 });
  if (error) {
    return Response.json({ error: { code: "db_error", message: error.message } }, { status: 500 });
  }
  const matches = ((matchData as Match[] | null) ?? []).slice();

  const porUsuario = new Map<string, Match[]>();
  for (const m of matches) {
    porUsuario.set(m.user_id, [...(porUsuario.get(m.user_id) ?? []), m]);
  }

  const alertasEnviadas = new Set<string>();
  for (const [userId, filas] of porUsuario) {
    const porAlerta = new Map<string, Match[]>();
    for (const f of filas) {
      porAlerta.set(f.search_id, [...(porAlerta.get(f.search_id) ?? []), f]);
    }
    const secciones = [...porAlerta.values()].map((fs) => ({
      searchName: fs[0].search_name,
      unsubscribeToken: fs[0].unsubscribe_token,
      animales: fs.map((f) => ({ name: f.animal_name, slug: f.animal_slug })),
    }));

    const contacto = await obtenerContactoAdoptante(admin, userId);
    if (contacto.email) {
      const plantilla = plantillaAlertaAnimales({
        nombre: contacto.fullName ?? "",
        secciones,
      });
      await enviarEmailSeguro({ to: contacto.email, ...plantilla });
      emailsAlertas += 1;
    }
    for (const id of porAlerta.keys()) alertasEnviadas.add(id);
  }
  if (alertasEnviadas.size > 0) {
    await admin
      .from("saved_searches")
      .update({ last_sent_at: new Date().toISOString() })
      .in("id", [...alertasEnviadas]);
  }

  // ---------- Favoritos adoptados (aviso único) ----------
  const { data: favData } = await admin
    .from("favorites")
    .select("user_id, animal_id, animals!inner(name, slug, status)")
    .eq("animals.status", "adopted")
    .is("notified_at", null);
  const favoritos = ((favData as unknown as FavoritoAdoptado[] | null) ?? []).filter(
    (f) => f.animals,
  );

  const favPorUsuario = new Map<string, FavoritoAdoptado[]>();
  for (const f of favoritos) {
    favPorUsuario.set(f.user_id, [...(favPorUsuario.get(f.user_id) ?? []), f]);
  }
  for (const [userId, filas] of favPorUsuario) {
    const contacto = await obtenerContactoAdoptante(admin, userId);
    if (contacto.email) {
      const plantilla = plantillaFavoritoAdoptado({
        nombre: contacto.fullName ?? "",
        animales: filas.map((f) => ({ name: f.animals!.name, slug: f.animals!.slug })),
      });
      await enviarEmailSeguro({ to: contacto.email, ...plantilla });
      emailsFavoritos += 1;
    }
    for (const f of filas) {
      await admin
        .from("favorites")
        .update({ notified_at: new Date().toISOString() })
        .eq("user_id", f.user_id)
        .eq("animal_id", f.animal_id);
    }
  }

  return Response.json({
    data: { emailsAlertas, emailsFavoritos, at: new Date().toISOString() },
  });
}
