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
 * FEATURE-010 — RLS de favoritos/alertas, tope de 5 alertas y matching del
 * RPC saved_search_matches. Requieren `npx supabase start` + SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-010 favoritos y alertas", () => {
  const PASS = "password-de-test-123";
  let adopterId: string;
  let otroId: string;
  let shelterId: string;
  let animalId: string;

  beforeAll(async () => {
    const admin = adminClient();

    adopterId = await ensureUser("fav-adoptante@test.com", PASS);
    otroId = await ensureUser("fav-otro@test.com", PASS);
    const ownerId = await ensureUser("fav-protectora@test.com", PASS);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Favoritos",
      slug: "protectora-favoritos",
      status: "verified",
      location: "POINT(-2.94 43.26)", // Bilbao
    });
    if (es) throw es;
    shelterId = shelter.id;

    await admin.from("saved_searches").delete().in("user_id", [adopterId, otroId]);
    await admin.from("favorites").delete().in("user_id", [adopterId, otroId]);

    const { data: animal, error: ea } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterId,
          name: "Fav Perro",
          slug: "fav-perro-test",
          species: "dog",
          sex: "male",
          size: "medium",
          status: "available",
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (ea) throw ea;
    animalId = animal.id;
  });

  it("un adoptante guarda y quita su favorito; otro usuario no lo ve", async () => {
    const adopter = await signInAs("fav-adoptante@test.com", PASS);
    const { error } = await adopter
      .from("favorites")
      .insert({ user_id: adopterId, animal_id: animalId });
    expect(error).toBeNull();

    const otro = await signInAs("fav-otro@test.com", PASS);
    const { data: ajenos } = await otro.from("favorites").select().eq("animal_id", animalId);
    expect(ajenos ?? []).toHaveLength(0);

    const { data: propios } = await adopter.from("favorites").select();
    expect(propios).toHaveLength(1);
  });

  it("no se puede guardar un favorito a nombre de otro", async () => {
    const otro = await signInAs("fav-otro@test.com", PASS);
    const { error } = await otro
      .from("favorites")
      .insert({ user_id: adopterId, animal_id: animalId });
    expect(error).not.toBeNull();
  });

  it("anon no lee favoritos ni alertas", async () => {
    const anon = anonClient();
    const { data: favs } = await anon.from("favorites").select();
    expect(favs ?? []).toHaveLength(0);
    const { data: alerts } = await anon.from("saved_searches").select();
    expect(alerts ?? []).toHaveLength(0);
  });

  it("la sexta alerta de un usuario se rechaza (tope de 5)", async () => {
    const adopter = await signInAs("fav-adoptante@test.com", PASS);
    for (let i = 1; i <= 5; i++) {
      const { error } = await adopter
        .from("saved_searches")
        .insert({ user_id: adopterId, name: `Alerta ${i}`, filters: { especie: "dog" } });
      expect(error).toBeNull();
    }
    const { error: sexta } = await adopter
      .from("saved_searches")
      .insert({ user_id: adopterId, name: "Alerta 6", filters: {} });
    expect(sexta).not.toBeNull();
    expect(sexta!.message).toContain("saved_searches_limit");
  });

  it("el RPC de matching solo es ejecutable por service_role y empareja por filtros", async () => {
    const anon = anonClient();
    const { error: sinPermiso } = await anon.rpc("saved_search_matches", { p_hours: 24 });
    expect(sinPermiso).not.toBeNull();

    const admin = adminClient();
    // Alerta del otro usuario que NO casa (gatos) y una que SÍ (perros cerca de Bilbao)
    await admin.from("saved_searches").insert([
      { user_id: otroId, name: "Gatos", filters: { especie: "cat" } },
      {
        user_id: otroId,
        name: "Perros Bilbao",
        filters: { especie: "dog", lat: 43.26, lng: -2.94, radio_km: 50 },
      },
    ]);

    const { data, error } = await admin.rpc("saved_search_matches", { p_hours: 24 });
    expect(error).toBeNull();
    const filas = (data ?? []) as { search_name: string; animal_slug: string }[];
    const nombres = filas
      .filter((f) => f.animal_slug === "fav-perro-test")
      .map((f) => f.search_name);
    expect(nombres).toContain("Perros Bilbao");
    expect(nombres).not.toContain("Gatos");
  });

  it("una alerta con last_sent_at reciente no vuelve a casar (máx. 1 email/día)", async () => {
    const admin = adminClient();
    await admin
      .from("saved_searches")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("user_id", otroId)
      .eq("name", "Perros Bilbao");

    const { data } = await admin.rpc("saved_search_matches", { p_hours: 24 });
    const nombres = ((data ?? []) as { search_name: string }[]).map((f) => f.search_name);
    expect(nombres).not.toContain("Perros Bilbao");
  });
});
