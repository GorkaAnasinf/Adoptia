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
 * FEATURE-057 — RLS de las plantillas de horario (availability_templates).
 * Son privadas de la protectora: solo la dueña las ve y gestiona. Requieren
 * `npx supabase start` + SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-057 plantillas", () => {
  const PASS = "password-de-test-123";
  let ownerId: string;
  let shelterId: string;

  beforeAll(async () => {
    const admin = adminClient();
    ownerId = await ensureUser("plantillas-protectora@test.com", PASS);
    await ensureUser("plantillas-otra@test.com", PASS);

    const { data: shelter, error } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Plantillas",
      slug: "protectora-plantillas",
      status: "verified",
    });
    if (error) throw error;
    shelterId = shelter.id;

    await admin.from("availability_templates").delete().eq("shelter_id", shelterId);
  });

  it("la dueña crea, lee y borra sus plantillas", async () => {
    const owner = await signInAs("plantillas-protectora@test.com", PASS);
    const { data: creada, error } = await owner
      .from("availability_templates")
      .insert({
        shelter_id: shelterId,
        nombre: "Mañanas L-V",
        slots: [{ start: "10:00", end: "13:00", minutes: 30 }],
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(creada.nombre).toBe("Mañanas L-V");

    const { data: leidas } = await owner
      .from("availability_templates")
      .select()
      .eq("shelter_id", shelterId);
    expect((leidas ?? []).length).toBeGreaterThanOrEqual(1);

    const { error: eBorrar } = await owner
      .from("availability_templates")
      .delete()
      .eq("id", creada.id);
    expect(eBorrar).toBeNull();
  });

  it("otra protectora NO ve ni escribe plantillas ajenas; anon tampoco lee", async () => {
    const admin = adminClient();
    const { data: plantilla } = await admin
      .from("availability_templates")
      .insert({
        shelter_id: shelterId,
        nombre: "Privada",
        slots: [{ start: "16:00", end: "18:00", minutes: 60 }],
      })
      .select()
      .single();

    const otra = await signInAs("plantillas-otra@test.com", PASS);
    const { data: vistas } = await otra
      .from("availability_templates")
      .select()
      .eq("shelter_id", shelterId);
    expect(vistas ?? []).toHaveLength(0); // no es lectura pública

    const { data: editadas } = await otra
      .from("availability_templates")
      .update({ nombre: "hack" })
      .eq("id", plantilla!.id)
      .select();
    expect(editadas ?? []).toHaveLength(0);

    const anon = anonClient();
    const { data: anonVe } = await anon
      .from("availability_templates")
      .select()
      .eq("shelter_id", shelterId);
    expect(anonVe ?? []).toHaveLength(0);
  });

  it("rechaza una plantilla sin franjas (CHECK)", async () => {
    const owner = await signInAs("plantillas-protectora@test.com", PASS);
    const { error } = await owner
      .from("availability_templates")
      .insert({ shelter_id: shelterId, nombre: "Vacía", slots: [] });
    expect(error).not.toBeNull();
  });
});
