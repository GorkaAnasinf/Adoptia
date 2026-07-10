import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, ensureUser, rlsDisponible } from "./helpers";

/**
 * IMPROVEMENT-001 — de-duplicación del slug de protectora en BD.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("De-duplicación de slug de shelters", () => {
  const PASS = "password-de-test-123";
  let owner1: string;
  let owner2: string;
  let owner3: string;

  beforeAll(async () => {
    owner1 = await ensureUser("slug-owner1@test.com", PASS);
    owner2 = await ensureUser("slug-owner2@test.com", PASS);
    owner3 = await ensureUser("slug-owner3@test.com", PASS);
    // Limpieza de ejecuciones anteriores
    await adminClient().from("shelters").delete().like("slug", "refugio-esperanza%");
  });

  it("dos protectoras con el mismo nombre obtienen slugs distintos y estables", async () => {
    const admin = adminClient();

    const { data: a, error: ea } = await admin
      .from("shelters")
      .insert({
        owner_id: owner1,
        name: "Refugio Esperanza",
        slug: "refugio-esperanza",
        cif: "B11111111",
        email: "esperanza-1@test.com",
      })
      .select("id, slug")
      .single();
    expect(ea).toBeNull();
    expect(a!.slug).toBe("refugio-esperanza");

    const { data: b, error: eb } = await admin
      .from("shelters")
      .insert({
        owner_id: owner2,
        name: "Refugio Esperanza",
        slug: "refugio-esperanza",
        cif: "B22222222",
        email: "esperanza-2@test.com",
      })
      .select("id, slug")
      .single();
    expect(eb).toBeNull();
    expect(b!.slug).toBe("refugio-esperanza-2");

    const { data: c, error: ec } = await admin
      .from("shelters")
      .insert({
        owner_id: owner3,
        name: "Refugio Esperanza",
        slug: "refugio-esperanza",
        cif: "B33333333",
        email: "esperanza-3@test.com",
      })
      .select("id, slug")
      .single();
    expect(ec).toBeNull();
    expect(c!.slug).toBe("refugio-esperanza-3");
  });

  it("actualizar una protectora sin tocar el slug no lo cambia", async () => {
    const admin = adminClient();
    const { data, error } = await admin
      .from("shelters")
      .update({ description: "Descripción nueva" })
      .eq("slug", "refugio-esperanza-2")
      .select("slug");
    expect(error).toBeNull();
    expect(data![0].slug).toBe("refugio-esperanza-2");
  });

  it("el slug de-duplicado sigue siendo válido para URL", async () => {
    const admin = adminClient();
    const { data } = await admin
      .from("shelters")
      .select("slug")
      .like("slug", "refugio-esperanza%");
    for (const fila of data ?? []) {
      expect(fila.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});
