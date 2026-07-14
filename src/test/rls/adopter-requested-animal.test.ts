// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * BUG-004 — Tras aprobar una solicitud el animal pasa a `reserved` y la
 * protectora lo despublica (`published_at = null`). El adoptante con solicitud
 * viva DEBE poder seguir leyendo ese animal (y su media) para reservar la cita;
 * un tercero sin solicitud, NO. Un adoptante que retiró la suya, tampoco.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("BUG-004 RLS lectura de animal despublicado por adoptante", () => {
  const PASS = "password-de-test-123";

  let ownerId: string;
  let adopterId: string;
  let shelterId: string;
  let animalId: string;

  beforeAll(async () => {
    const admin = adminClient();

    ownerId = await ensureUser("bug004-protectora@test.com", PASS);
    adopterId = await ensureUser("bug004-adoptante@test.com", PASS);
    await ensureUser("bug004-otro@test.com", PASS);

    const { data: shelter } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora BUG004",
      slug: "protectora-bug004",
      status: "verified",
    });
    shelterId = shelter.id;

    // Animal RESERVADO y DESPUBLICADO: reproduce el estado tras aprobar.
    const { data: animal } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterId,
          name: "Luna",
          slug: "luna-bug004",
          status: "reserved",
          published_at: null,
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    animalId = animal.id;

    await admin
      .from("animal_media")
      .upsert(
        { animal_id: animalId, type: "photo", url: "https://example.com/luna.jpg", is_cover: true, sort_order: 0 },
        { onConflict: "id" },
      );

    // Solicitud aprobada del adoptante sobre ese animal despublicado.
    await admin
      .from("adoption_requests")
      .upsert(
        { animal_id: animalId, adopter_id: adopterId, status: "approved", questionnaire: { vivienda: "piso" } },
        { onConflict: "animal_id,adopter_id" },
      );
  });

  it("el adoptante con solicitud aprobada SÍ lee el animal despublicado", async () => {
    const client = await signInAs("bug004-adoptante@test.com", PASS);
    const { data, error } = await client
      .from("animals")
      .select("id, name, shelter_id")
      .eq("id", animalId)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(animalId);
  });

  it("el adoptante con solicitud aprobada SÍ lee la media del animal", async () => {
    const client = await signInAs("bug004-adoptante@test.com", PASS);
    const { data } = await client.from("animal_media").select("url").eq("animal_id", animalId);
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("un usuario sin solicitud NO lee el animal despublicado", async () => {
    const client = await signInAs("bug004-otro@test.com", PASS);
    const { data } = await client.from("animals").select("id").eq("id", animalId).maybeSingle();
    expect(data).toBeNull();
  });

  it("anónimo NO lee el animal despublicado", async () => {
    const client = anonClient();
    const { data } = await client.from("animals").select("id").eq("id", animalId).maybeSingle();
    expect(data).toBeNull();
  });

  it("tras retirar la solicitud (withdrawn) el adoptante YA NO lee el animal despublicado", async () => {
    const admin = adminClient();
    await admin.from("adoption_requests").update({ status: "withdrawn" }).eq("animal_id", animalId).eq("adopter_id", adopterId);

    const client = await signInAs("bug004-adoptante@test.com", PASS);
    const { data } = await client.from("animals").select("id").eq("id", animalId).maybeSingle();
    expect(data).toBeNull();

    // restaura para no afectar otras ejecuciones del stack local
    await admin.from("adoption_requests").update({ status: "approved" }).eq("animal_id", animalId).eq("adopter_id", adopterId);
  });
});
