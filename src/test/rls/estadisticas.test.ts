// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  anonClient,
  ensureUser,
  rlsDisponible,
  signInAs,
  upsertShelterFixture,
} from "./helpers";

/**
 * FEATURE-014 — visitas agregadas sin PII: incremento anónimo vía RPC,
 * lectura solo de la protectora dueña. Requieren `npx supabase start`.
 */
describe.skipIf(!rlsDisponible)("FEATURE-014 estadísticas", () => {
  const PASS = "password-de-test-123";
  let shelterId: string;
  let publicadoId: string;
  let borradorId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const ownerId = await ensureUser("stats-protectora@test.com", PASS);
    await ensureUser("stats-otro@test.com", PASS);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Stats",
      slug: "protectora-stats",
      status: "verified",
    });
    if (es) throw es;
    shelterId = shelter.id;

    const sube = async (slug: string, publicado: boolean) => {
      const { data, error } = await admin
        .from("animals")
        .upsert(
          {
            shelter_id: shelterId,
            name: slug,
            slug,
            species: "dog",
            status: "available",
            published_at: publicado ? new Date().toISOString() : null,
          },
          { onConflict: "slug" },
        )
        .select()
        .single();
      if (error) throw error;
      return data.id as string;
    };
    publicadoId = await sube("stats-publicado-test", true);
    borradorId = await sube("stats-borrador-test", false);
    await admin.from("page_views").delete().in("animal_id", [publicadoId, borradorId]);
  });

  it("anon incrementa la visita de una ficha publicada (agregado por día, sin PII)", async () => {
    const anon = anonClient();
    await anon.rpc("registrar_visita", { p_animal_id: publicadoId });
    await anon.rpc("registrar_visita", { p_animal_id: publicadoId });

    const owner = await signInAs("stats-protectora@test.com", PASS);
    const { data } = await owner.from("page_views").select().eq("animal_id", publicadoId);
    expect(data).toHaveLength(1); // una sola fila por día
    expect(data![0].views).toBe(2);
    // Sin PII: la fila solo tiene animal, día y contador
    expect(Object.keys(data![0]).sort()).toEqual(["animal_id", "day", "views"]);
  });

  it("una ficha sin publicar no acumula visitas (no sirve para sondear borradores)", async () => {
    await anonClient().rpc("registrar_visita", { p_animal_id: borradorId });
    const { data } = await adminClient().from("page_views").select().eq("animal_id", borradorId);
    expect(data ?? []).toHaveLength(0);
  });

  it("otra cuenta no lee las métricas ajenas; nadie escribe la tabla directamente", async () => {
    const otro = await signInAs("stats-otro@test.com", PASS);
    const { data: ajenas } = await otro.from("page_views").select().eq("animal_id", publicadoId);
    expect(ajenas ?? []).toHaveLength(0);

    const { error } = await otro
      .from("page_views")
      .insert({ animal_id: publicadoId, views: 999 });
    expect(error).not.toBeNull();

    const { error: deAnon } = await anonClient()
      .from("page_views")
      .insert({ animal_id: publicadoId, views: 999 });
    expect(deAnon).not.toBeNull();
  });
});
