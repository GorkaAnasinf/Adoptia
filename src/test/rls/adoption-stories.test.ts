// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * FEATURE-059 — RLS de `adoption_stories` (testimonios del adoptante):
 * el adoptante solo escribe una historia SUYA y solo de un animal que adoptó;
 * la protectora dueña la modera; el público solo ve las aprobadas.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-059 RLS adoption_stories", () => {
  const PASS = "password-de-test-123";

  let shelterOwnerId: string;
  let otroOwnerId: string;
  let adopterId: string;
  let shelterId: string;
  let adoptadoId: string; // animal adoptado por adopter
  let noAdoptadoId: string; // animal SIN adopción del adopter

  beforeAll(async () => {
    const admin = adminClient();
    shelterOwnerId = await ensureUser("hist-prot-a@test.com", PASS);
    otroOwnerId = await ensureUser("hist-prot-b@test.com", PASS);
    adopterId = await ensureUser("hist-adopter-a@test.com", PASS);
    await ensureUser("hist-adopter-b@test.com", PASS);

    const { data: shelter } = await upsertShelterFixture({
      owner_id: shelterOwnerId,
      name: "Protectora Historias A",
      slug: "protectora-historias-a",
      status: "verified",
    });
    shelterId = shelter.id;
    await upsertShelterFixture({
      owner_id: otroOwnerId,
      name: "Protectora Historias B",
      slug: "protectora-historias-b",
      status: "verified",
    });

    const animal = async (slug: string, status: string) => {
      const { data } = await admin
        .from("animals")
        .upsert(
          { shelter_id: shelterId, name: slug, slug, status, published_at: new Date().toISOString() },
          { onConflict: "slug" },
        )
        .select()
        .single();
      return data.id as string;
    };
    adoptadoId = await animal("hist-adoptado", "adopted");
    noAdoptadoId = await animal("hist-no-adoptado", "available");

    // Adopción completada del adopter sobre `adoptado`.
    await admin
      .from("adoption_requests")
      .upsert(
        { animal_id: adoptadoId, adopter_id: adopterId, status: "completed", questionnaire: {} },
        { onConflict: "animal_id,adopter_id" },
      );

    // Limpieza de historias previas de estos animales.
    await admin.from("adoption_stories").delete().in("animal_id", [adoptadoId, noAdoptadoId]);
  });

  it("el adoptante puede crear una historia de un animal que adoptó (con consentimiento)", async () => {
    const cliente = await signInAs("hist-adopter-a@test.com", PASS);
    const { error } = await cliente.from("adoption_stories").insert({
      animal_id: adoptadoId,
      adopter_id: adopterId,
      shelter_id: shelterId,
      quote: "Llegó asustada y hoy es la reina del sofá.",
      consent: true,
    });
    expect(error).toBeNull();
  });

  it("NO puede crear historia de un animal que no adoptó", async () => {
    const cliente = await signInAs("hist-adopter-a@test.com", PASS);
    const { error } = await cliente.from("adoption_stories").insert({
      animal_id: noAdoptadoId,
      adopter_id: adopterId,
      shelter_id: shelterId,
      quote: "No debería poder publicar esto.",
      consent: true,
    });
    expect(error).not.toBeNull(); // RLS rechaza el insert
  });

  it("NO puede crear historia sin consentimiento (check + RLS)", async () => {
    const cliente = await signInAs("hist-adopter-a@test.com", PASS);
    const { error } = await cliente.from("adoption_stories").insert({
      animal_id: adoptadoId,
      adopter_id: adopterId,
      shelter_id: shelterId,
      quote: "Sin consentimiento no vale.",
      consent: false,
    });
    expect(error).not.toBeNull();
  });

  it("anónimo NO ve una historia pendiente, pero sí cuando está aprobada", async () => {
    const anon = anonClient();
    const antes = await anon.from("adoption_stories").select("id").eq("animal_id", adoptadoId);
    expect(antes.data ?? []).toHaveLength(0);

    // La protectora dueña la aprueba.
    const dueña = await signInAs("hist-prot-a@test.com", PASS);
    const { error: errMod } = await dueña
      .from("adoption_stories")
      .update({ status: "approved", published_at: new Date().toISOString() })
      .eq("animal_id", adoptadoId);
    expect(errMod).toBeNull();

    const despues = await anon.from("adoption_stories").select("id").eq("animal_id", adoptadoId);
    expect((despues.data ?? []).length).toBeGreaterThan(0);
  });

  it("una protectora que no es la dueña NO puede moderar la historia", async () => {
    const otra = await signInAs("hist-prot-b@test.com", PASS);
    const { data } = await otra
      .from("adoption_stories")
      .update({ status: "rejected" })
      .eq("animal_id", adoptadoId)
      .select();
    expect(data ?? []).toHaveLength(0); // RLS filtra: 0 filas afectadas
  });
});
