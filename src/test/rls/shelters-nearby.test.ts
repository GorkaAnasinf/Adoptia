import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible } from "./helpers";

/**
 * Tests del RPC `shelters_nearby` (mapa de protectoras, FEATURE-006).
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 *
 * Seed geolocalizado: protectora en Bilbao (con perro y gato publicados,
 * voluntariado sí / acogida no), protectora en Madrid (solo perro) y una
 * protectora pendiente (no debe aparecer nunca, RLS/`security definer`
 * cuidadoso filtra `verified` dentro de la función).
 */
describe.skipIf(!rlsDisponible)("RPC shelters_nearby", () => {
  const PASS = "password-de-test-123";
  const BILBAO = { lat: 43.263, lng: -2.935 };

  beforeAll(async () => {
    const admin = adminClient();

    const bilbaoUser = await ensureUser("mapa-bilbao@test.com", PASS);
    const madridUser = await ensureUser("mapa-madrid@test.com", PASS);
    const pendienteUser = await ensureUser("mapa-pendiente@test.com", PASS);

    const upsertShelter = async (fila: Record<string, unknown>) => {
      const { data, error } = await admin
        .from("shelters")
        .upsert(fila, { onConflict: "slug" })
        .select()
        .single();
      if (error) throw error;
      return data.id as string;
    };

    const bilbaoId = await upsertShelter({
      owner_id: bilbaoUser,
      name: "Mapa Bilbao",
      slug: "mapa-bilbao",
      status: "verified",
      city: "Bilbao",
      location: "POINT(-2.94 43.26)",
      accepts_volunteers: true,
      accepts_fostering: false,
    });
    const madridId = await upsertShelter({
      owner_id: madridUser,
      name: "Mapa Madrid",
      slug: "mapa-madrid",
      status: "verified",
      city: "Madrid",
      location: "POINT(-3.70 40.42)",
      accepts_volunteers: false,
      accepts_fostering: true,
    });
    const pendienteId = await upsertShelter({
      owner_id: pendienteUser,
      name: "Mapa Pendiente",
      slug: "mapa-pendiente",
      status: "pending",
      city: "Bilbao",
      location: "POINT(-2.94 43.26)",
    });

    const publicado = new Date().toISOString();
    const animales: Record<string, unknown>[] = [
      {
        shelter_id: bilbaoId,
        name: "Perro Bilbao",
        slug: "mapa-perro-bilbao",
        species: "dog",
        sex: "male",
        size: "medium",
        status: "available",
        published_at: publicado,
      },
      {
        shelter_id: bilbaoId,
        name: "Gato Bilbao",
        slug: "mapa-gato-bilbao",
        species: "cat",
        sex: "female",
        size: "small",
        status: "reserved",
        published_at: publicado,
      },
      // Borrador: no cuenta en animal_count
      {
        shelter_id: bilbaoId,
        name: "Borrador Bilbao",
        slug: "mapa-borrador-bilbao",
        species: "dog",
        sex: "male",
        size: "large",
        status: "available",
        published_at: null,
      },
      {
        shelter_id: madridId,
        name: "Perro Madrid",
        slug: "mapa-perro-madrid",
        species: "dog",
        sex: "male",
        size: "large",
        status: "available",
        published_at: publicado,
      },
      // Protectora pendiente: no debe verse pese a estar publicado
      {
        shelter_id: pendienteId,
        name: "Perro Pendiente",
        slug: "mapa-perro-pendiente",
        species: "dog",
        sex: "male",
        size: "medium",
        status: "available",
        published_at: publicado,
      },
    ];
    for (const a of animales) {
      const { error } = await admin.from("animals").upsert(a, { onConflict: "slug" });
      if (error) throw error;
    }
  });

  const buscar = async (args: Record<string, unknown>) => {
    const anon = anonClient();
    const { data, error } = await anon.rpc("shelters_nearby", args);
    expect(error).toBeNull();
    return (data as Record<string, unknown>[]).filter((r) => String(r.slug).startsWith("mapa-"));
  };

  it("radio de 100 km desde Bilbao incluye Bilbao y excluye Madrid y la pendiente", async () => {
    const filas = await buscar({ lat: BILBAO.lat, lng: BILBAO.lng, radius_m: 100_000 });
    const slugs = filas.map((f) => f.slug);
    expect(slugs).toContain("mapa-bilbao");
    expect(slugs).not.toContain("mapa-madrid");
    expect(slugs).not.toContain("mapa-pendiente");
  });

  it("radio de 1000 km desde Bilbao incluye ambas verificadas ordenadas por distancia", async () => {
    const filas = await buscar({ lat: BILBAO.lat, lng: BILBAO.lng, radius_m: 1_000_000 });
    expect(filas.map((f) => f.slug)).toEqual(["mapa-bilbao", "mapa-madrid"]);
    const distancias = filas.map((f) => Number(f.distance_m));
    expect(distancias[0]).toBeLessThan(distancias[1]);
  });

  it("expone lat/lng de la protectora para colocar el marcador", async () => {
    const filas = await buscar({ lat: BILBAO.lat, lng: BILBAO.lng, radius_m: 100_000 });
    const bilbao = filas.find((f) => f.slug === "mapa-bilbao");
    expect(Number(bilbao?.lat)).toBeCloseTo(43.26, 1);
    expect(Number(bilbao?.lng)).toBeCloseTo(-2.94, 1);
  });

  it("animal_count cuenta solo animales publicados y disponibles/reservados", async () => {
    const filas = await buscar({ lat: BILBAO.lat, lng: BILBAO.lng, radius_m: 100_000 });
    const bilbao = filas.find((f) => f.slug === "mapa-bilbao");
    expect(Number(bilbao?.animal_count)).toBe(2);
  });

  it("filtro p_species=dog excluye protectoras sin perros publicados", async () => {
    const filas = await buscar({
      lat: BILBAO.lat,
      lng: BILBAO.lng,
      radius_m: 1_000_000,
      p_species: "dog",
    });
    const slugs = filas.map((f) => f.slug);
    expect(slugs).toEqual(["mapa-bilbao", "mapa-madrid"]);
    const bilbao = filas.find((f) => f.slug === "mapa-bilbao");
    expect(Number(bilbao?.animal_count)).toBe(1);
  });

  it("filtro p_species=cat solo deja la protectora con gatos publicados", async () => {
    const filas = await buscar({
      lat: BILBAO.lat,
      lng: BILBAO.lng,
      radius_m: 1_000_000,
      p_species: "cat",
    });
    expect(filas.map((f) => f.slug)).toEqual(["mapa-bilbao"]);
  });

  it("filtro p_accepts_volunteers=true deja solo Bilbao", async () => {
    const filas = await buscar({
      lat: BILBAO.lat,
      lng: BILBAO.lng,
      radius_m: 1_000_000,
      p_accepts_volunteers: true,
    });
    expect(filas.map((f) => f.slug)).toEqual(["mapa-bilbao"]);
  });

  it("filtro p_accepts_fostering=true deja solo Madrid", async () => {
    const filas = await buscar({
      lat: BILBAO.lat,
      lng: BILBAO.lng,
      radius_m: 1_000_000,
      p_accepts_fostering: true,
    });
    expect(filas.map((f) => f.slug)).toEqual(["mapa-madrid"]);
  });
});
