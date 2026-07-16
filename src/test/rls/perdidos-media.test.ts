// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs } from "./helpers";

/**
 * FEATURE-024 — Galería de fotos de los avisos (`lost_found_media`), su RLS y
 * la portada que devuelve `lost_found_list`. Requieren `npx supabase start`.
 */
describe.skipIf(!rlsDisponible)("FEATURE-024 galería de avisos", () => {
  const PASS = "password-de-test-123";
  let autorId: string;
  let otroId: string;
  let postId: string;

  beforeAll(async () => {
    const admin = adminClient();
    autorId = await ensureUser("gm-autor@test.com", PASS);
    otroId = await ensureUser("gm-otro@test.com", PASS);
    await admin.from("lost_found_posts").delete().in("user_id", [autorId, otroId]);

    const { data } = await admin
      .from("lost_found_posts")
      .insert({
        user_id: autorId,
        type: "lost",
        species: "dog",
        name: "Kira",
        description: "Podenca canela",
        location: "POINT(-2.9346 43.2631)",
        city: "Bilbao",
        occurred_on: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    postId = data!.id;
  });

  it("el autor añade varias fotos; anon no puede", async () => {
    const autor = await signInAs("gm-autor@test.com", PASS);
    const { error } = await autor.from("lost_found_media").insert([
      { post_id: postId, url: `${autorId}/frente.jpg`, is_cover: true, sort_order: 0 },
      { post_id: postId, url: `${autorId}/perfil.jpg`, is_cover: false, sort_order: 1 },
    ]);
    expect(error).toBeNull();

    const { error: deAnon } = await anonClient().from("lost_found_media").insert({
      post_id: postId,
      url: `${autorId}/hack.jpg`,
    });
    expect(deAnon).not.toBeNull();
  });

  it("un tercero no puede añadir fotos al aviso ajeno", async () => {
    const otro = await signInAs("gm-otro@test.com", PASS);
    const { error } = await otro.from("lost_found_media").insert({
      post_id: postId,
      url: `${otroId}/intruso.jpg`,
    });
    expect(error).not.toBeNull();
  });

  it("solo puede haber una portada por aviso (índice único)", async () => {
    const admin = adminClient();
    const { error } = await admin.from("lost_found_media").insert({
      post_id: postId,
      url: `${autorId}/segunda-portada.jpg`,
      is_cover: true,
      sort_order: 2,
    });
    expect(error).not.toBeNull();
  });

  it("la galería es pública (aviso abierto) y sale ordenada por el RPC", async () => {
    const { data, error } = await anonClient().rpc("lost_found_media_list", { p_post_id: postId });
    expect(error).toBeNull();
    const fotos = data as { url: string; is_cover: boolean; sort_order: number }[];
    expect(fotos).toHaveLength(2);
    expect(fotos[0].sort_order).toBeLessThan(fotos[1].sort_order);
    expect(fotos.find((f) => f.is_cover)?.url).toContain("frente");
  });

  it("lost_found_list devuelve la foto marcada como portada, no otra", async () => {
    // El test que muerde (BUG-006): si alguien rompe el `order by` de la
    // subconsulta de portada, esto falla.
    const { data } = await anonClient().rpc("lost_found_list");
    const aviso = (data as { id: string; cover_url: string | null }[]).find((p) => p.id === postId);
    expect(aviso).toBeDefined();
    expect(aviso!.cover_url).toContain("frente.jpg");
    expect(aviso!.cover_url).not.toContain("perfil.jpg");
  });

  it("la galería de un aviso archivado ajeno no es pública", async () => {
    const admin = adminClient();
    await admin.from("lost_found_posts").update({ status: "archived" }).eq("id", postId);

    const { data } = await anonClient()
      .from("lost_found_media")
      .select("id")
      .eq("post_id", postId);
    expect(data ?? []).toHaveLength(0);

    await admin.from("lost_found_posts").update({ status: "open" }).eq("id", postId);
  });

  it("el autor borra una foto de su galería; un tercero no", async () => {
    const admin = adminClient();
    const { data: extra } = await admin
      .from("lost_found_media")
      .insert({ post_id: postId, url: `${autorId}/spam.jpg`, sort_order: 5 })
      .select()
      .single();

    const otro = await signInAs("gm-otro@test.com", PASS);
    const { data: intento } = await otro
      .from("lost_found_media")
      .delete()
      .eq("id", extra!.id)
      .select();
    expect(intento ?? []).toHaveLength(0);

    const autor = await signInAs("gm-autor@test.com", PASS);
    const { data: borrado } = await autor
      .from("lost_found_media")
      .delete()
      .eq("id", extra!.id)
      .select();
    expect(borrado).toHaveLength(1);
  });

  it("borrar el aviso arrastra su galería (cascade)", async () => {
    const admin = adminClient();
    const { data: post } = await admin
      .from("lost_found_posts")
      .insert({
        user_id: autorId,
        type: "found",
        species: "cat",
        description: "temporal",
        location: "POINT(-2.93 43.26)",
        occurred_on: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    await admin.from("lost_found_media").insert({ post_id: post!.id, url: `${autorId}/x.jpg` });

    await admin.from("lost_found_posts").delete().eq("id", post!.id);
    const { data } = await admin.from("lost_found_media").select("id").eq("post_id", post!.id);
    expect(data ?? []).toHaveLength(0);
  });

  it("ya no existe la columna photo_url en lost_found_posts", async () => {
    const { error } = await adminClient().from("lost_found_posts").select("photo_url").limit(1);
    expect(error).not.toBeNull(); // columna eliminada por la migración
  });
});
