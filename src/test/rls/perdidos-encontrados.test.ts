// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs } from "./helpers";

/**
 * FEATURE-012 — RLS de lost_found_posts, redondeo de privacidad de la
 * ubicación y visibilidad por estado. Requieren `npx supabase start`.
 */
describe.skipIf(!rlsDisponible)("FEATURE-012 perdidos y encontrados", () => {
  const PASS = "password-de-test-123";
  let autorId: string;
  let otroId: string;
  let postId: string;

  beforeAll(async () => {
    const admin = adminClient();
    autorId = await ensureUser("pf-autor@test.com", PASS);
    otroId = await ensureUser("pf-otro@test.com", PASS);
    await admin.from("lost_found_posts").delete().in("user_id", [autorId, otroId]);
  });

  it("un usuario publica un aviso; anon no puede publicar", async () => {
    const autor = await signInAs("pf-autor@test.com", PASS);
    const { data, error } = await autor
      .from("lost_found_posts")
      .insert({
        user_id: autorId,
        type: "lost",
        species: "dog",
        name: "Rocky",
        description: "Se perdió en el parque de Doña Casilda",
        location: "POINT(-2.9346123 43.2631456)", // coordenada "exacta"
        city: "Bilbao",
      })
      .select()
      .single();
    expect(error).toBeNull();
    postId = data.id;

    const { error: deAnon } = await anonClient().from("lost_found_posts").insert({
      user_id: autorId,
      type: "found",
      species: "cat",
      description: "x",
      location: "POINT(-2.93 43.26)",
    });
    expect(deAnon).not.toBeNull();
  });

  it("la ubicación queda redondeada (~200 m): la coordenada exacta nunca se guarda", async () => {
    const anon = anonClient();
    const { data, error } = await anon.rpc("lost_found_list");
    expect(error).toBeNull();
    const aviso = (data as { id: string; lat: number; lng: number }[]).find(
      (p) => p.id === postId,
    );
    expect(aviso).toBeDefined();
    // Redondeo a rejilla de 0.002°
    expect(aviso!.lat).toBeCloseTo(Math.round(43.2631456 / 0.002) * 0.002, 10);
    expect(aviso!.lng).toBeCloseTo(Math.round(-2.9346123 / 0.002) * 0.002, 10);
    expect(aviso!.lat).not.toBeCloseTo(43.2631456, 6);
  });

  it("solo el autor puede editar/resolver su aviso", async () => {
    const otro = await signInAs("pf-otro@test.com", PASS);
    const { data: intento } = await otro
      .from("lost_found_posts")
      .update({ status: "resolved" })
      .eq("id", postId)
      .select();
    expect(intento ?? []).toHaveLength(0);

    const autor = await signInAs("pf-autor@test.com", PASS);
    const { data: resuelto, error } = await autor
      .from("lost_found_posts")
      .update({ status: "resolved", resolution_story: "¡Apareció en casa de un vecino!" })
      .eq("id", postId)
      .select();
    expect(error).toBeNull();
    expect(resuelto).toHaveLength(1);
  });

  it("un aviso resuelto desaparece del mapa pero su historia sigue siendo legible", async () => {
    const anon = anonClient();
    const { data: mapa } = await anon.rpc("lost_found_list");
    expect((mapa as { id: string }[]).map((p) => p.id)).not.toContain(postId);

    const { data: fila } = await anon
      .from("lost_found_posts")
      .select("status, resolution_story")
      .eq("id", postId)
      .maybeSingle();
    expect(fila?.resolution_story).toContain("vecino");
  });

  it("un aviso archivado deja de ser público (solo autor/admin)", async () => {
    const admin = adminClient();
    await admin.from("lost_found_posts").update({ status: "archived" }).eq("id", postId);

    const { data: publico } = await anonClient()
      .from("lost_found_posts")
      .select("id")
      .eq("id", postId);
    expect(publico ?? []).toHaveLength(0);

    const autor = await signInAs("pf-autor@test.com", PASS);
    const { data: propio } = await autor.from("lost_found_posts").select("id").eq("id", postId);
    expect(propio).toHaveLength(1);
  });
});
