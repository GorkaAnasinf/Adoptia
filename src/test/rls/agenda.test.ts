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
 * FEATURE-053 — RLS y RPC de las excepciones por día (availability_overrides)
 * y su efecto sobre appointment_free_slots. Requieren `npx supabase start` +
 * SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-053 agenda overrides", () => {
  const PASS = "password-de-test-123";
  let ownerId: string;
  let otroOwnerId: string;
  let shelterId: string;
  let otroShelterId: string;

  // Fecha futura fija y su weekday, para probar patrón vs override en el RPC.
  const objetivo = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  const ymd = objetivo.toISOString().slice(0, 10);
  const weekday = objetivo.getDay();

  beforeAll(async () => {
    const admin = adminClient();

    ownerId = await ensureUser("agenda-protectora@test.com", PASS);
    otroOwnerId = await ensureUser("agenda-otra@test.com", PASS);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Agenda",
      slug: "protectora-agenda",
      status: "verified",
    });
    if (es) throw es;
    shelterId = shelter.id;

    const { data: otroShelter, error: eo } = await upsertShelterFixture({
      owner_id: otroOwnerId,
      name: "Protectora Agenda Otra",
      slug: "protectora-agenda-otra",
      status: "verified",
    });
    if (eo) throw eo;
    otroShelterId = otroShelter.id;

    await admin.from("appointments").delete().eq("shelter_id", shelterId);
    await admin.from("availability_overrides").delete().eq("shelter_id", shelterId);
    await admin.from("availability_overrides").delete().eq("shelter_id", otroShelterId);
    await admin.from("availability_slots").delete().eq("shelter_id", shelterId);

    // Patrón semanal en el weekday del día objetivo: 10:00–12:00 / 30 min.
    const { error: ef } = await admin.from("availability_slots").insert({
      shelter_id: shelterId,
      weekday,
      start_time: "10:00",
      end_time: "12:00",
      slot_minutes: 30,
    });
    if (ef) throw ef;
  });

  it("la dueña escribe overrides; anon los lee de verificada pero no escribe", async () => {
    const owner = await signInAs("agenda-protectora@test.com", PASS);
    const { data: creado, error } = await owner
      .from("availability_overrides")
      .insert({ shelter_id: shelterId, date: ymd, closed: true, note: "Vacaciones" })
      .select()
      .single();
    expect(error).toBeNull();
    expect(creado.closed).toBe(true);

    const anon = anonClient();
    const { data: leido } = await anon
      .from("availability_overrides")
      .select()
      .eq("shelter_id", shelterId);
    expect((leido ?? []).length).toBeGreaterThanOrEqual(1);

    const { error: eInsert } = await anon
      .from("availability_overrides")
      .insert({ shelter_id: shelterId, date: "2030-01-01", closed: true });
    expect(eInsert).not.toBeNull();
  });

  it("rechaza un override con una franja de duración fuera de rango", async () => {
    const owner = await signInAs("agenda-protectora@test.com", PASS);
    const { error } = await owner.from("availability_overrides").insert({
      shelter_id: shelterId,
      date: "2029-12-31",
      closed: false,
      slots: [{ start: "10:00", end: "12:00", minutes: 5 }], // 5 < 15 → CHECK
    });
    expect(error).not.toBeNull();
  });

  it("un upsert por lotes con una fila de otra protectora se rechaza entero", async () => {
    const owner = await signInAs("agenda-protectora@test.com", PASS);
    const { error } = await owner.from("availability_overrides").upsert(
      [
        { shelter_id: shelterId, date: "2029-11-01", closed: true, slots: [] },
        { shelter_id: otroShelterId, date: "2029-11-01", closed: true, slots: [] },
      ],
      { onConflict: "shelter_id,date" },
    );
    expect(error).not.toBeNull(); // with check fila a fila tumba el statement

    // Y la fila propia tampoco se escribió (el upsert es atómico).
    const { data } = await owner
      .from("availability_overrides")
      .select()
      .eq("shelter_id", shelterId)
      .eq("date", "2029-11-01");
    expect(data ?? []).toHaveLength(0);
  });

  it("otra protectora NO puede editar overrides ajenos", async () => {
    const otra = await signInAs("agenda-otra@test.com", PASS);
    const { data } = await otra
      .from("availability_overrides")
      .update({ note: "hack" })
      .eq("shelter_id", shelterId)
      .select();
    expect(data ?? []).toHaveLength(0); // RLS filtra en silencio
  });

  it("un día cerrado no genera huecos en el RPC", async () => {
    const admin = adminClient();
    await admin
      .from("availability_overrides")
      .upsert(
        { shelter_id: shelterId, date: ymd, closed: true, slots: [], note: "Cerrado" },
        { onConflict: "shelter_id,date" },
      );

    const { data, error } = await anonClient().rpc("appointment_free_slots", {
      p_shelter_id: shelterId,
      p_days: 8,
    });
    expect(error).toBeNull();
    const delDia = (data as { starts_at: string }[]).filter(
      (h) => h.starts_at.slice(0, 10) === ymd,
    );
    expect(delDia).toHaveLength(0);
  });

  it("un horario especial sustituye al patrón semanal ese día", async () => {
    const admin = adminClient();
    await admin.from("availability_overrides").upsert(
      {
        shelter_id: shelterId,
        date: ymd,
        closed: false,
        slots: [{ start: "16:00", end: "18:00", minutes: 60 }],
        note: null,
      },
      { onConflict: "shelter_id,date" },
    );

    const { data } = await anonClient().rpc("appointment_free_slots", {
      p_shelter_id: shelterId,
      p_days: 8,
    });
    const delDia = (data as { starts_at: string; slot_minutes: number }[]).filter(
      (h) => h.starts_at.slice(0, 10) === ymd,
    );
    // 16:00–18:00 en tramos de 60 min → 2 huecos, ninguno a las 10:00 del patrón.
    expect(delDia).toHaveLength(2);
    expect(delDia.every((h) => h.slot_minutes === 60)).toBe(true);
    const horasMadrid = delDia.map((h) =>
      new Date(h.starts_at).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
      }),
    );
    expect(horasMadrid).toContain("16:00");
    expect(horasMadrid).not.toContain("10:00");
  });

  it("sin override el día sigue el patrón semanal", async () => {
    const admin = adminClient();
    await admin
      .from("availability_overrides")
      .delete()
      .eq("shelter_id", shelterId)
      .eq("date", ymd);

    const { data } = await anonClient().rpc("appointment_free_slots", {
      p_shelter_id: shelterId,
      p_days: 8,
    });
    const delDia = (data as { starts_at: string; slot_minutes: number }[]).filter(
      (h) => h.starts_at.slice(0, 10) === ymd,
    );
    // 10:00–12:00 / 30 min → 4 huecos.
    expect(delDia.length).toBeGreaterThanOrEqual(4);
    expect(delDia.every((h) => h.slot_minutes === 30)).toBe(true);
  });
});
