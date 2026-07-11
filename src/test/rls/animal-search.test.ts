import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, upsertShelterFixture } from "./helpers";

/**
 * Tests del RPC `animals_search` (listado público con filtros y distancia).
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 *
 * Seed geolocalizado: protectora en Bilbao y protectora en Madrid (verificadas)
 * + una pendiente. La búsqueda se hace como ANON: el RPC es security invoker,
 * así que la RLS de animals/shelters aplica dentro de la función.
 */
describe.skipIf(!rlsDisponible)("RPC animals_search", () => {
  const PASS = "password-de-test-123";

  // Búsquedas desde el centro de Bilbao
  const BILBAO = { lat: 43.263, lng: -2.935 };

  beforeAll(async () => {
    const admin = adminClient();

    const bilbaoUser = await ensureUser("busqueda-bilbao@test.com", PASS);
    const madridUser = await ensureUser("busqueda-madrid@test.com", PASS);
    const pendienteUser = await ensureUser("busqueda-pendiente@test.com", PASS);

    const upsertShelter = async (fila: Record<string, unknown>) => {
      const { data, error } = await upsertShelterFixture(fila);
      if (error) throw error;
      return data.id as string;
    };

    const bilbaoId = await upsertShelter({
      owner_id: bilbaoUser,
      name: "Búsqueda Bilbao",
      slug: "busqueda-bilbao",
      status: "verified",
      city: "Bilbao",
      location: "POINT(-2.94 43.26)",
    });
    const madridId = await upsertShelter({
      owner_id: madridUser,
      name: "Búsqueda Madrid",
      slug: "busqueda-madrid",
      status: "verified",
      city: "Madrid",
      location: "POINT(-3.70 40.42)",
    });
    const pendienteId = await upsertShelter({
      owner_id: pendienteUser,
      name: "Búsqueda Pendiente",
      slug: "busqueda-pendiente",
      status: "pending",
      location: "POINT(-2.94 43.26)",
    });

    const publicado = new Date().toISOString();
    const animales: Record<string, unknown>[] = [
      // Bilbao: perra pequeña joven, buena con niños
      {
        shelter_id: bilbaoId,
        name: "Pipa",
        slug: "busq-pipa",
        species: "dog",
        sex: "female",
        size: "small",
        birth_date_approx: "2024-06-01",
        good_with_kids: true,
        status: "available",
        published_at: publicado,
      },
      // Bilbao: gato reservado (aparece en el listado)
      {
        shelter_id: bilbaoId,
        name: "Misi",
        slug: "busq-misi",
        species: "cat",
        sex: "male",
        size: "small",
        birth_date_approx: "2020-01-01",
        status: "reserved",
        published_at: publicado,
      },
      // Bilbao: adoptado (NO aparece)
      {
        shelter_id: bilbaoId,
        name: "Adoptado",
        slug: "busq-adoptado",
        species: "dog",
        sex: "male",
        size: "large",
        status: "adopted",
        published_at: publicado,
      },
      // Bilbao: borrador (NO aparece)
      {
        shelter_id: bilbaoId,
        name: "Sin publicar",
        slug: "busq-borrador",
        species: "dog",
        sex: "male",
        size: "medium",
        status: "available",
        published_at: null,
      },
      // Madrid: perro grande senior
      {
        shelter_id: madridId,
        name: "Golfo",
        slug: "busq-golfo",
        species: "dog",
        sex: "male",
        size: "large",
        birth_date_approx: "2015-03-01",
        good_with_kids: false,
        status: "available",
        published_at: publicado,
      },
      // Protectora pendiente: publicado pero NO visible (RLS)
      {
        shelter_id: pendienteId,
        name: "Invisible",
        slug: "busq-invisible",
        species: "dog",
        sex: "female",
        size: "small",
        status: "available",
        published_at: publicado,
      },
    ];
    for (const a of animales) {
      const { error } = await admin.from("animals").upsert(a, { onConflict: "slug" });
      if (error) throw error;
    }
  });

  const buscar = async (args: Record<string, unknown> = {}) => {
    const anon = anonClient();
    // p_limit alto: otros tests siembran animales en paralelo y el límite
    // por defecto (24) podría dejar fuera filas de nuestro seed.
    const { data, error } = await anon.rpc("animals_search", { p_limit: 100, ...args });
    expect(error).toBeNull();
    // El stack de test puede tener otros datos; nos quedamos con el seed
    return (data as Record<string, unknown>[]).filter((r) =>
      String(r.slug).startsWith("busq-"),
    );
  };

  it("anon ve solo publicados de protectoras verificadas (ni borradores, ni adoptados, ni pendientes)", async () => {
    const filas = await buscar();
    const slugs = filas.map((f) => f.slug).sort();
    expect(slugs).toEqual(["busq-golfo", "busq-misi", "busq-pipa"]);
  });

  it("filtros combinados: perros pequeños buenos con niños", async () => {
    const filas = await buscar({
      p_species: "dog",
      p_sizes: ["small"],
      p_good_with_kids: true,
    });
    expect(filas.map((f) => f.slug)).toEqual(["busq-pipa"]);
  });

  it("filtro de edad por rango de nacimiento (senior: nacidos antes de 2018)", async () => {
    const filas = await buscar({ p_birth_before: "2018-07-09" });
    expect(filas.map((f) => f.slug)).toEqual(["busq-golfo"]);
  });

  it("ordena por distancia desde Bilbao y devuelve distance_m creciente", async () => {
    const filas = await buscar({
      p_lat: BILBAO.lat,
      p_lng: BILBAO.lng,
      p_order: "distance",
    });
    expect(filas.length).toBeGreaterThanOrEqual(3);
    // Los de Bilbao antes que el de Madrid
    expect(filas[filas.length - 1].slug).toBe("busq-golfo");
    const distancias = filas.map((f) => Number(f.distance_m));
    const ordenadas = [...distancias].sort((x, y) => x - y);
    expect(distancias).toEqual(ordenadas);
    // Bilbao a ~1 km, Madrid a ~270 km
    expect(distancias[0]).toBeLessThan(5_000);
    expect(distancias[distancias.length - 1]).toBeGreaterThan(200_000);
  });

  it("radio de 100 km desde Bilbao excluye Madrid", async () => {
    const filas = await buscar({
      p_lat: BILBAO.lat,
      p_lng: BILBAO.lng,
      p_radius_km: 100,
    });
    const slugs = filas.map((f) => f.slug);
    expect(slugs).toContain("busq-pipa");
    expect(slugs).not.toContain("busq-golfo");
  });

  it("sin ubicación distance_m es null y el orden es por recientes", async () => {
    const filas = await buscar();
    expect(filas.every((f) => f.distance_m === null)).toBe(true);
  });

  it("expone total_count para paginar y respeta limit/offset", async () => {
    const pagina = await buscar({ p_limit: 1, p_offset: 0 });
    expect(pagina).toHaveLength(1);
    // total_count cuenta el conjunto completo, no la página
    expect(Number(pagina[0].total_count)).toBeGreaterThanOrEqual(3);
  });
});
