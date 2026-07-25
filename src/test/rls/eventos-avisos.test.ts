// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, ensureUser, rlsDisponible, upsertShelterFixture } from "./helpers";

/**
 * FEATURE-063 — RPC `event_zone_matches`: empareja jornadas publicadas y futuras
 * con las búsquedas guardadas ACTIVAS cuya zona (lat/lng/radio_km) las cubre, y
 * excluye las ya avisadas (`zone_notified_at`).
 * Requiere `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-063 avisos de jornadas por zona", () => {
  const PASS = "password-de-test-123";
  const enHoras = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

  let shelterId: string;
  let cercaUserId: string;
  let lejosUserId: string;
  let inactivaUserId: string;
  let eventoId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const owner = await ensureUser("avisos-prot@test.com", PASS);
    cercaUserId = await ensureUser("avisos-cerca@test.com", PASS);
    lejosUserId = await ensureUser("avisos-lejos@test.com", PASS);
    inactivaUserId = await ensureUser("avisos-inactiva@test.com", PASS);

    const { data: sh, error } = await upsertShelterFixture({
      owner_id: owner,
      name: "avisos-prot",
      slug: "avisos-prot",
      status: "verified",
      location: "POINT(-2.46 36.84)", // Almería
    });
    if (error) throw error;
    shelterId = sh.id as string;

    await admin.from("events").delete().eq("shelter_id", shelterId);
    const { data: ev, error: evErr } = await admin
      .from("events")
      .insert({
        shelter_id: shelterId,
        title: "Jornada con zona",
        starts_at: enHoras(48),
        ends_at: enHoras(51),
        location: "POINT(-2.46 36.84)",
        city: "Almería",
        status: "published",
      })
      .select("id")
      .single();
    if (evErr) throw evErr;
    eventoId = ev!.id as string;

    // Búsquedas guardadas: cerca (radio cubre), lejos (Santiago), e inactiva cerca.
    await admin.from("saved_searches").delete().in("user_id", [cercaUserId, lejosUserId, inactivaUserId]);
    await admin.from("saved_searches").insert([
      { user_id: cercaUserId, name: "Cerca de Almería", active: true, filters: { lat: 36.84, lng: -2.46, radio_km: 30 } },
      { user_id: lejosUserId, name: "Santiago", active: true, filters: { lat: 42.88, lng: -8.54, radio_km: 30 } },
      { user_id: inactivaUserId, name: "Inactiva", active: false, filters: { lat: 36.84, lng: -2.46, radio_km: 30 } },
    ]);
  });

  afterAll(async () => {
    const admin = adminClient();
    await admin.from("events").delete().eq("shelter_id", shelterId);
    await admin.from("saved_searches").delete().in("user_id", [cercaUserId, lejosUserId, inactivaUserId]);
  });

  it("empareja solo la búsqueda activa cuya zona cubre la jornada", async () => {
    const { data, error } = await adminClient().rpc("event_zone_matches");
    expect(error).toBeNull();
    const filas = ((data ?? []) as Record<string, unknown>[]).filter((f) => f.event_id === eventoId);
    expect(filas).toHaveLength(1);
    expect(filas[0].user_id).toBe(cercaUserId);
    expect(filas[0].search_name).toBe("Cerca de Almería");
    expect(filas[0].unsubscribe_token).toBeTruthy();
  });

  it("no vuelve a emparejar una jornada ya avisada (zone_notified_at)", async () => {
    const admin = adminClient();
    await admin.from("events").update({ zone_notified_at: new Date().toISOString() }).eq("id", eventoId);
    const { data } = await admin.rpc("event_zone_matches");
    const filas = ((data ?? []) as Record<string, unknown>[]).filter((f) => f.event_id === eventoId);
    expect(filas).toHaveLength(0);
    await admin.from("events").update({ zone_notified_at: null }).eq("id", eventoId);
  });
});
