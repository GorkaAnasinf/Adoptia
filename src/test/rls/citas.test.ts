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
 * FEATURE-009 — RLS y RPC de citas: franjas de disponibilidad, huecos libres
 * y exclusión de doble reserva. Requieren `npx supabase start` + SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-009 citas", () => {
  const PASS = "password-de-test-123";
  let ownerId: string;
  let adopterId: string;
  let otroAdopterId: string;
  let shelterId: string;
  let animalId: string;
  let requestId: string;
  let slotId: string;

  beforeAll(async () => {
    const admin = adminClient();

    ownerId = await ensureUser("citas-protectora@test.com", PASS);
    adopterId = await ensureUser("citas-adoptante@test.com", PASS);
    otroAdopterId = await ensureUser("citas-otro@test.com", PASS);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Citas",
      slug: "protectora-citas",
      status: "verified",
    });
    if (es) throw es;
    shelterId = shelter.id;

    // Limpieza de ejecuciones anteriores (citas/franjas del fixture)
    await admin.from("appointments").delete().eq("shelter_id", shelterId);
    await admin.from("availability_slots").delete().eq("shelter_id", shelterId);

    const { data: animal, error: ea } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterId,
          name: "Citas Perro",
          slug: "citas-perro-test",
          species: "dog",
          status: "available",
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (ea) throw ea;
    animalId = animal.id;

    const { data: request, error: er } = await admin
      .from("adoption_requests")
      .upsert(
        { animal_id: animalId, adopter_id: adopterId, status: "approved" },
        { onConflict: "animal_id,adopter_id" },
      )
      .select()
      .single();
    if (er) throw er;
    requestId = request.id;

    // Franja diaria (todos los weekdays, para que siempre haya huecos mañana)
    const { data: slot, error: ef } = await admin
      .from("availability_slots")
      .insert({
        shelter_id: shelterId,
        weekday: new Date(Date.now() + 24 * 3600 * 1000).getDay(),
        start_time: "10:00",
        end_time: "12:00",
        slot_minutes: 30,
      })
      .select()
      .single();
    if (ef) throw ef;
    slotId = slot.id;
  });

  it("anon puede leer las franjas de una protectora verificada, pero no escribirlas", async () => {
    const anon = anonClient();
    const { data } = await anon.from("availability_slots").select().eq("id", slotId);
    expect(data).toHaveLength(1);

    const { error } = await anon.from("availability_slots").insert({
      shelter_id: shelterId,
      weekday: 1,
      start_time: "09:00",
      end_time: "10:00",
    });
    expect(error).not.toBeNull();
  });

  it("otra usuaria NO puede editar franjas ajenas; la dueña sí", async () => {
    const otro = await signInAs("citas-otro@test.com", PASS);
    const { data: dataOtro } = await otro
      .from("availability_slots")
      .update({ slot_minutes: 60 })
      .eq("id", slotId)
      .select();
    expect(dataOtro ?? []).toHaveLength(0); // RLS filtra en silencio

    const owner = await signInAs("citas-protectora@test.com", PASS);
    const { data: dataOwner, error } = await owner
      .from("availability_slots")
      .update({ slot_minutes: 30 })
      .eq("id", slotId)
      .select();
    expect(error).toBeNull();
    expect(dataOwner).toHaveLength(1);
  });

  it("el RPC devuelve huecos futuros de 30 min dentro de la franja", async () => {
    const anon = anonClient();
    const { data, error } = await anon.rpc("appointment_free_slots", {
      p_shelter_id: shelterId,
      p_days: 8,
    });
    expect(error).toBeNull();
    const huecos = (data ?? []) as { starts_at: string; ends_at: string; slot_minutes: number }[];
    expect(huecos.length).toBeGreaterThanOrEqual(4); // 2 h / 30 min
    for (const h of huecos) {
      expect(new Date(h.starts_at).getTime()).toBeGreaterThan(Date.now());
      expect(h.slot_minutes).toBe(30);
    }
  });

  it("reservar un hueco lo quita de los huecos libres y la doble reserva falla", async () => {
    const anon = anonClient();
    const { data: antes } = await anon.rpc("appointment_free_slots", {
      p_shelter_id: shelterId,
      p_days: 8,
    });
    const hueco = (antes as { starts_at: string; ends_at: string }[])[0];

    const adopter = await signInAs("citas-adoptante@test.com", PASS);
    const { error: e1 } = await adopter.from("appointments").insert({
      request_id: requestId,
      shelter_id: shelterId,
      adopter_id: adopterId,
      starts_at: hueco.starts_at,
      ends_at: hueco.ends_at,
    });
    expect(e1).toBeNull();

    // Mismo hueco otra vez → exclusion constraint (23P01)
    const admin = adminClient();
    const { error: e2 } = await admin.from("appointments").insert({
      request_id: requestId,
      shelter_id: shelterId,
      adopter_id: otroAdopterId,
      starts_at: hueco.starts_at,
      ends_at: hueco.ends_at,
    });
    expect(e2).not.toBeNull();
    expect(e2!.code).toBe("23P01");

    const { data: despues } = await anon.rpc("appointment_free_slots", {
      p_shelter_id: shelterId,
      p_days: 8,
    });
    const quedan = (despues as { starts_at: string }[]).map((h) =>
      new Date(h.starts_at).toISOString(),
    );
    expect(quedan).not.toContain(new Date(hueco.starts_at).toISOString());
  });

  it("una cita cancelada libera su hueco", async () => {
    const admin = adminClient();
    const { data: cita } = await admin
      .from("appointments")
      .select("id, starts_at")
      .eq("shelter_id", shelterId)
      .eq("status", "confirmed")
      .single();

    await admin.from("appointments").update({ status: "cancelled" }).eq("id", cita!.id);

    const { data: huecos } = await anonClient().rpc("appointment_free_slots", {
      p_shelter_id: shelterId,
      p_days: 8,
    });
    const inicios = (huecos as { starts_at: string }[]).map((h) =>
      new Date(h.starts_at).toISOString(),
    );
    expect(inicios).toContain(new Date(cita!.starts_at).toISOString());
  });

  it("un adoptante solo ve sus citas; la protectora ve las de sus animales", async () => {
    const otro = await signInAs("citas-otro@test.com", PASS);
    const { data: deOtro } = await otro.from("appointments").select().eq("shelter_id", shelterId);
    expect(deOtro ?? []).toHaveLength(0);

    const owner = await signInAs("citas-protectora@test.com", PASS);
    const { data: deOwner } = await owner
      .from("appointments")
      .select()
      .eq("shelter_id", shelterId);
    expect((deOwner ?? []).length).toBeGreaterThanOrEqual(1);
  });
});
