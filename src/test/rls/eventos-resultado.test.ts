// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * FEATURE-064 — Resultado de una jornada finalizada: la dueña declara
 * adopciones/asistentes al cerrarla (`finished`); son agregados públicos (social
 * proof) sin PII; un tercero no puede finalizar ni editar el resultado.
 * Requiere `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-064 resultado de jornada", () => {
  const PASS = "password-de-test-123";
  const enHoras = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

  let shelterId: string;
  let eventoId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const owner = await ensureUser("res-prot@test.com", PASS);
    await ensureUser("res-tercero@test.com", PASS);

    const { data: sh, error } = await upsertShelterFixture({
      owner_id: owner,
      name: "res-prot",
      slug: "res-prot",
      status: "verified",
      location: "POINT(-2.46 36.84)",
    });
    if (error) throw error;
    shelterId = sh.id as string;

    await admin.from("events").delete().eq("shelter_id", shelterId);
    const { data: ev, error: evErr } = await admin
      .from("events")
      .insert({
        shelter_id: shelterId,
        title: "Jornada pasada",
        starts_at: enHoras(-51),
        ends_at: enHoras(-48),
        location: "POINT(-2.46 36.84)",
        city: "Almería",
        status: "published",
      })
      .select("id")
      .single();
    if (evErr) throw evErr;
    eventoId = ev!.id as string;
  });

  afterAll(async () => {
    await adminClient().from("events").delete().eq("shelter_id", shelterId);
  });

  it("la dueña finaliza y declara el resultado; anon lee los contadores", async () => {
    const dueña = await signInAs("res-prot@test.com", PASS);
    const { error } = await dueña
      .from("events")
      .update({ status: "finished", adoptions_count: 4, attended_count: 30 })
      .eq("id", eventoId);
    expect(error).toBeNull();

    const { data } = await anonClient()
      .from("events")
      .select("status, adoptions_count, attended_count")
      .eq("id", eventoId)
      .maybeSingle();
    expect(data?.status).toBe("finished");
    expect(data?.adoptions_count).toBe(4);
    expect(data?.attended_count).toBe(30);
  });

  it("un tercero no puede finalizar ni editar el resultado", async () => {
    const tercero = await signInAs("res-tercero@test.com", PASS);
    const { data } = await tercero
      .from("events")
      .update({ adoptions_count: 999 })
      .eq("id", eventoId)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("rechaza un número de adopciones negativo (check de BD)", async () => {
    const dueña = await signInAs("res-prot@test.com", PASS);
    const { error } = await dueña.from("events").update({ adoptions_count: -1 }).eq("id", eventoId);
    expect(error).not.toBeNull();
  });
});
