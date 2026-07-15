// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs } from "./helpers";

/**
 * FEATURE-022 — RLS de lost_found_sightings, redondeo de privacidad del pin del
 * avistamiento y refresco de actividad del aviso. Requieren `npx supabase start`.
 */
describe.skipIf(!rlsDisponible)("FEATURE-022 avistamientos", () => {
  const PASS = "password-de-test-123";
  let autorId: string; // publica el aviso
  let vecinoId: string; // reporta el avistamiento
  let terceroId: string;
  let postId: string;
  let sightingId: string;

  // Coordenada "exacta" del avistamiento: nunca debe llegar a existir en BD.
  const LAT = 43.2673891;
  const LNG = -2.9401237;
  const REJILLA = 0.002;

  beforeAll(async () => {
    const admin = adminClient();
    autorId = await ensureUser("av-autor@test.com", PASS);
    vecinoId = await ensureUser("av-vecino@test.com", PASS);
    terceroId = await ensureUser("av-tercero@test.com", PASS);
    await admin.from("lost_found_posts").delete().in("user_id", [autorId, vecinoId, terceroId]);

    const { data } = await admin
      .from("lost_found_posts")
      .insert({
        user_id: autorId,
        type: "lost",
        species: "dog",
        name: "Kira",
        description: "Podenca canela, se escapó por la noche",
        location: "POINT(-2.9346123 43.2631456)",
        city: "Bilbao",
      })
      .select()
      .single();
    postId = data!.id;
  });

  it("un usuario con cuenta reporta un avistamiento; anon no puede", async () => {
    const vecino = await signInAs("av-vecino@test.com", PASS);
    const { data, error } = await vecino
      .from("lost_found_sightings")
      .insert({
        post_id: postId,
        user_id: vecinoId,
        seen_at: new Date().toISOString(),
        note: "Bebiendo en la fuente del parque",
        location: `POINT(${LNG} ${LAT})`,
      })
      .select()
      .single();
    expect(error).toBeNull();
    sightingId = data!.id;

    const { error: deAnon } = await anonClient().from("lost_found_sightings").insert({
      post_id: postId,
      user_id: vecinoId,
      seen_at: new Date().toISOString(),
      location: "POINT(-2.93 43.26)",
    });
    expect(deAnon).not.toBeNull();
  });

  it("no se puede reportar en nombre de otro usuario", async () => {
    const vecino = await signInAs("av-vecino@test.com", PASS);
    const { error } = await vecino.from("lost_found_sightings").insert({
      post_id: postId,
      user_id: terceroId, // suplantación
      seen_at: new Date().toISOString(),
      location: "POINT(-2.93 43.26)",
    });
    expect(error).not.toBeNull();
  });

  it("el pin queda redondeado (~200 m): la coordenada exacta nunca se guarda", async () => {
    const { data, error } = await anonClient().rpc("lost_found_sightings_list", {
      p_post_id: postId,
    });
    expect(error).toBeNull();
    const visto = (data as { id: string; lat: number; lng: number }[]).find(
      (s) => s.id === sightingId,
    );
    expect(visto).toBeDefined();
    expect(visto!.lat).toBeCloseTo(Math.round(LAT / REJILLA) * REJILLA, 10);
    expect(visto!.lng).toBeCloseTo(Math.round(LNG / REJILLA) * REJILLA, 10);
    expect(visto!.lat).not.toBeCloseTo(LAT, 6);
  });

  it("el listado público no revela quién reporta", async () => {
    const { data } = await anonClient().rpc("lost_found_sightings_list", { p_post_id: postId });
    expect(data![0]).not.toHaveProperty("user_id");
  });

  it("un avistamiento refresca la actividad del aviso: el cron ya no lo archiva", async () => {
    const admin = adminClient();
    const viejo = new Date(Date.now() - 70 * 24 * 3600 * 1000).toISOString();
    await admin.from("lost_found_posts").update({ last_activity_at: viejo }).eq("id", postId);

    const vecino = await signInAs("av-vecino@test.com", PASS);
    await vecino.from("lost_found_sightings").insert({
      post_id: postId,
      user_id: vecinoId,
      seen_at: new Date().toISOString(),
      location: "POINT(-2.935 43.264)",
    });

    const { data: aviso } = await admin
      .from("lost_found_posts")
      .select("last_activity_at")
      .eq("id", postId)
      .single();
    const edad = Date.now() - new Date(aviso!.last_activity_at as string).getTime();
    expect(edad).toBeLessThan(60_000);
  });

  it("no se admite un avistamiento con fecha futura", async () => {
    const vecino = await signInAs("av-vecino@test.com", PASS);
    const { error } = await vecino.from("lost_found_sightings").insert({
      post_id: postId,
      user_id: vecinoId,
      seen_at: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      location: "POINT(-2.93 43.26)",
    });
    expect(error).not.toBeNull();
  });

  it("el autor del aviso borra un avistamiento de su ficha (spam); un tercero no", async () => {
    const admin = adminClient();
    const { data: spam } = await admin
      .from("lost_found_sightings")
      .insert({
        post_id: postId,
        user_id: terceroId,
        seen_at: new Date().toISOString(),
        note: "COMPRA CRIPTO EN ESTE ENLACE",
        location: "POINT(-2.93 43.26)",
      })
      .select()
      .single();

    const vecino = await signInAs("av-vecino@test.com", PASS);
    const { data: intento } = await vecino
      .from("lost_found_sightings")
      .delete()
      .eq("id", spam!.id)
      .select();
    expect(intento ?? []).toHaveLength(0);

    const autor = await signInAs("av-autor@test.com", PASS);
    const { data: borrado } = await autor
      .from("lost_found_sightings")
      .delete()
      .eq("id", spam!.id)
      .select();
    expect(borrado).toHaveLength(1);
  });

  it("los avistamientos de un aviso archivado dejan de ser públicos", async () => {
    const admin = adminClient();
    await admin.from("lost_found_posts").update({ status: "archived" }).eq("id", postId);

    const { data: publico } = await anonClient()
      .from("lost_found_sightings")
      .select("id")
      .eq("post_id", postId);
    expect(publico ?? []).toHaveLength(0);

    const autor = await signInAs("av-autor@test.com", PASS);
    const { data: propio } = await autor
      .from("lost_found_sightings")
      .select("id")
      .eq("post_id", postId);
    expect((propio ?? []).length).toBeGreaterThan(0);

    await admin.from("lost_found_posts").update({ status: "open" }).eq("id", postId);
  });

  it("el teléfono de contacto solo se guarda con formato válido", async () => {
    const autor = await signInAs("av-autor@test.com", PASS);
    const { error: malo } = await autor
      .from("lost_found_posts")
      .update({ contact_phone: "llámame :)" })
      .eq("id", postId);
    expect(malo).not.toBeNull();

    const { data: bueno, error } = await autor
      .from("lost_found_posts")
      .update({ contact_phone: "+34 600 111 222" })
      .eq("id", postId)
      .select();
    expect(error).toBeNull();
    expect(bueno).toHaveLength(1);
  });
});
