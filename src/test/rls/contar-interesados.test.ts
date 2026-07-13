// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  anonClient,
  ensureUser,
  rlsDisponible,
  upsertShelterFixture,
} from "./helpers";

/**
 * IMPROVEMENT-020 — contador público de interesados: agregado anónimo vía RPC
 * security definer. Solo cuenta fichas publicadas de protectora verificada y
 * nunca filtra qué usuarios están interesados. Requiere `npx supabase start`.
 */
describe.skipIf(!rlsDisponible)("IMPROVEMENT-020 contar_interesados", () => {
  const PASS = "password-de-test-123";
  let publicadoId: string;
  let borradorId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const ownerId = await ensureUser("interesados-protectora@test.com", PASS);
    const a1 = await ensureUser("interesados-adopta-1@test.com", PASS);
    const a2 = await ensureUser("interesados-adopta-2@test.com", PASS);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Interesados",
      slug: "protectora-interesados",
      status: "verified",
    });
    if (es) throw es;

    const sube = async (slug: string, publicado: boolean) => {
      const { data, error } = await admin
        .from("animals")
        .upsert(
          {
            shelter_id: shelter.id,
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
    publicadoId = await sube("interesados-publicado-test", true);
    borradorId = await sube("interesados-borrador-test", false);

    // Dos adoptantes distintos interesados en el animal publicado; ninguno en el borrador.
    await admin
      .from("adoption_requests")
      .delete()
      .in("animal_id", [publicadoId, borradorId]);
    await admin.from("adoption_requests").insert([
      { animal_id: publicadoId, adopter_id: a1 },
      { animal_id: publicadoId, adopter_id: a2 },
    ]);
  });

  it("anon obtiene el número de interesados de una ficha publicada", async () => {
    const { data, error } = await anonClient().rpc("contar_interesados", {
      p_animal_id: publicadoId,
    });
    expect(error).toBeNull();
    expect(data).toBe(2);
  });

  it("no expone interesados de una ficha sin publicar (devuelve 0)", async () => {
    const { data } = await anonClient().rpc("contar_interesados", {
      p_animal_id: borradorId,
    });
    expect(data).toBe(0);
  });

  it("anon no puede leer la tabla de solicitudes directamente (sin fuga de identidad)", async () => {
    const { data } = await anonClient()
      .from("adoption_requests")
      .select("adopter_id")
      .eq("animal_id", publicadoId);
    expect(data ?? []).toHaveLength(0);
  });
});
