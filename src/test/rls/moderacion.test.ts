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
 * FEATURE-011 — RLS de reports/audit_log, tope diario de reportes e
 * inmutabilidad de la auditoría. Requieren `npx supabase start` + SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-011 moderación", () => {
  const PASS = "password-de-test-123";
  let reporterId: string;
  let otroId: string;
  let adminId: string;
  let animalId: string;

  beforeAll(async () => {
    const admin = adminClient();

    reporterId = await ensureUser("mod-reporter@test.com", PASS);
    otroId = await ensureUser("mod-otro@test.com", PASS);
    adminId = await ensureUser("mod-admin@test.com", PASS);
    const ownerId = await ensureUser("mod-protectora@test.com", PASS);
    await admin.from("profiles").update({ role: "admin" }).eq("id", adminId);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora Moderación",
      slug: "protectora-moderacion",
      status: "verified",
    });
    if (es) throw es;

    await admin.from("reports").delete().in("reporter_id", [reporterId, otroId]);

    const { data: animal, error: ea } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelter.id,
          name: "Mod Perro",
          slug: "mod-perro-test",
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
  });

  it("un usuario reporta una ficha; no puede reportar a nombre de otro; anon no lee", async () => {
    const reporter = await signInAs("mod-reporter@test.com", PASS);
    const { error } = await reporter.from("reports").insert({
      reporter_id: reporterId,
      animal_id: animalId,
      reason: "posible_fraude",
      details: "Piden dinero por adelantado por Bizum",
    });
    expect(error).toBeNull();

    const { error: suplantado } = await reporter.from("reports").insert({
      reporter_id: otroId,
      animal_id: animalId,
      reason: "spam",
    });
    expect(suplantado).not.toBeNull();

    const { data: deAnon } = await anonClient().from("reports").select();
    expect(deAnon ?? []).toHaveLength(0);
  });

  it("el admin ve todos los reportes; otro usuario solo los suyos", async () => {
    const adminUser = await signInAs("mod-admin@test.com", PASS);
    const { data: todos } = await adminUser.from("reports").select().eq("animal_id", animalId);
    expect((todos ?? []).length).toBeGreaterThanOrEqual(1);

    const otro = await signInAs("mod-otro@test.com", PASS);
    const { data: ajenos } = await otro.from("reports").select().eq("animal_id", animalId);
    expect(ajenos ?? []).toHaveLength(0);
  });

  it("el sexto reporte en 24 h se rechaza (anti-abuso)", async () => {
    const otro = await signInAs("mod-otro@test.com", PASS);
    for (let i = 1; i <= 5; i++) {
      const { error } = await otro.from("reports").insert({
        reporter_id: otroId,
        animal_id: animalId,
        reason: "otro",
        details: `Reporte ${i}`,
      });
      expect(error).toBeNull();
    }
    const { error: sexto } = await otro
      .from("reports")
      .insert({ reporter_id: otroId, animal_id: animalId, reason: "spam" });
    expect(sexto).not.toBeNull();
    expect(sexto!.message).toContain("reports_limit");
  });

  it("solo el admin puede resolver un reporte", async () => {
    const reporter = await signInAs("mod-reporter@test.com", PASS);
    const { data: propio } = await reporter.from("reports").select("id").limit(1).single();

    const { data: intento } = await reporter
      .from("reports")
      .update({ status: "dismissed" })
      .eq("id", propio!.id)
      .select();
    expect(intento ?? []).toHaveLength(0); // RLS filtra en silencio

    const adminUser = await signInAs("mod-admin@test.com", PASS);
    const { data: resuelto, error } = await adminUser
      .from("reports")
      .update({ status: "reviewed", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq("id", propio!.id)
      .select();
    expect(error).toBeNull();
    expect(resuelto).toHaveLength(1);
  });

  it("la auditoría la escriben y leen solo admins, y es inmutable incluso para service_role", async () => {
    const adminUser = await signInAs("mod-admin@test.com", PASS);
    const { data: fila, error } = await adminUser
      .from("audit_log")
      .insert({
        admin_id: adminId,
        action: "unpublish_animal",
        target_type: "animal",
        target_id: animalId,
        reason: "Test de auditoría",
      })
      .select()
      .single();
    expect(error).toBeNull();

    // No-admin: ni lee ni escribe
    const reporter = await signInAs("mod-reporter@test.com", PASS);
    const { data: lecturaAjena } = await reporter.from("audit_log").select();
    expect(lecturaAjena ?? []).toHaveLength(0);
    const { error: escrituraAjena } = await reporter.from("audit_log").insert({
      admin_id: reporterId,
      action: "x",
      target_type: "animal",
      target_id: animalId,
    });
    expect(escrituraAjena).not.toBeNull();

    // Inmutable: ni update ni delete, ni siquiera con service_role
    const service = adminClient();
    const { error: eUpd } = await service
      .from("audit_log")
      .update({ reason: "manipulado" })
      .eq("id", fila!.id);
    expect(eUpd).not.toBeNull();
    const { error: eDel } = await service.from("audit_log").delete().eq("id", fila!.id);
    expect(eDel).not.toBeNull();
  });
});
