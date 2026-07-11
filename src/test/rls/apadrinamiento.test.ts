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
 * FEATURE-013 — validación en BD de enlaces de pago y RLS de sponsorships.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-013 apadrinamiento", () => {
  const PASS = "password-de-test-123";
  let ownerId: string;
  let shelterId: string;
  let animalId: string;

  beforeAll(async () => {
    const admin = adminClient();
    ownerId = await ensureUser("apad-protectora@test.com", PASS);
    await ensureUser("apad-otro@test.com", PASS);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Apadrina",
      slug: "protectora-apadrina",
      status: "verified",
    });
    if (es) throw es;
    shelterId = shelter.id;

    const { data: animal, error: ea } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterId,
          name: "Abuelo Simón",
          slug: "abuelo-simon-test",
          species: "dog",
          status: "available",
          published_at: new Date().toISOString(),
          sponsorable: false,
          sponsor_link: null,
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (ea) throw ea;
    animalId = animal.id;
  });

  it("un enlace de pago con dominio no permitido se rechaza al guardar", async () => {
    const owner = await signInAs("apad-protectora@test.com", PASS);
    const { error } = await owner
      .from("animals")
      .update({ sponsorable: true, sponsor_link: "https://mi-web-sospechosa.com/dona" })
      .eq("id", animalId);
    expect(error).not.toBeNull();
    expect(error!.message).toContain("sponsor_link_valido");
  });

  it("marcar apadrinable sin enlace también se rechaza", async () => {
    const owner = await signInAs("apad-protectora@test.com", PASS);
    const { error } = await owner
      .from("animals")
      .update({ sponsorable: true, sponsor_link: null })
      .eq("id", animalId);
    expect(error).not.toBeNull();
  });

  it("la protectora dueña marca apadrinable con enlace válido; otra cuenta no puede", async () => {
    const otro = await signInAs("apad-otro@test.com", PASS);
    const { data: intento } = await otro
      .from("animals")
      .update({ sponsorable: true, sponsor_link: "https://buy.stripe.com/abc123" })
      .eq("id", animalId)
      .select();
    expect(intento ?? []).toHaveLength(0); // RLS filtra en silencio

    const owner = await signInAs("apad-protectora@test.com", PASS);
    const { data, error } = await owner
      .from("animals")
      .update({
        sponsorable: true,
        sponsor_link: "https://buy.stripe.com/abc123",
        sponsor_note: "Simón tiene 12 años y artrosis: busca padrinos.",
      })
      .eq("id", animalId)
      .select();
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("el enlace de donaciones de la protectora se valida igual", async () => {
    const owner = await signInAs("apad-protectora@test.com", PASS);
    const { error: malo } = await owner
      .from("shelters")
      .update({ donation_link: "http://teaming.net/inseguro" }) // http, no https
      .eq("id", shelterId);
    expect(malo).not.toBeNull();

    const { error: bueno } = await owner
      .from("shelters")
      .update({ donation_link: "https://www.teaming.net/protectora-apadrina" })
      .eq("id", shelterId);
    expect(bueno).toBeNull();
  });

  it("sponsorships: solo la protectora dueña (o admin) lee; nadie inserta desde cliente", async () => {
    const admin = adminClient();
    await admin.from("sponsorships").insert({ animal_id: animalId }); // service_role sí

    const otro = await signInAs("apad-otro@test.com", PASS);
    const { data: ajeno } = await otro.from("sponsorships").select().eq("animal_id", animalId);
    expect(ajeno ?? []).toHaveLength(0);
    const { error: insercion } = await otro.from("sponsorships").insert({ animal_id: animalId });
    expect(insercion).not.toBeNull();

    const { data: deAnon } = await anonClient().from("sponsorships").select();
    expect(deAnon ?? []).toHaveLength(0);

    const owner = await signInAs("apad-protectora@test.com", PASS);
    const { data: propio } = await owner.from("sponsorships").select().eq("animal_id", animalId);
    expect((propio ?? []).length).toBeGreaterThanOrEqual(1);
  });
});
