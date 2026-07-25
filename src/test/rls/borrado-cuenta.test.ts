// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, ensureUser, rlsDisponible, upsertShelterFixture } from "./helpers";

/**
 * BUG-010 — Borrar una cuenta que canceló una cita o revisó un reporte no debe
 * fallar. `appointments.cancelled_by` y `reports.reviewed_by` referencian
 * `profiles(id)` y son informativas: al borrar al autor deben quedar en NULL
 * (ON DELETE SET NULL), no bloquear el borrado. Requiere `npx supabase start`
 * + SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("BUG-010 borrado de cuenta con FKs informativas", () => {
  const PASS = "password-de-test-123";
  const admin = adminClient();
  let adopterId: string;
  let shelterId: string;
  let animalId: string;
  let requestId: string;

  beforeAll(async () => {
    const ownerId = await ensureUser("bug010-owner@test.com", PASS);
    adopterId = await ensureUser("bug010-adopter@test.com", PASS);

    const { data: shelter, error: es } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Protectora BUG010",
      slug: "protectora-bug010",
      status: "verified",
    });
    if (es) throw es;
    shelterId = shelter.id;
    await admin.from("appointments").delete().eq("shelter_id", shelterId);

    const { data: animal, error: ea } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterId,
          name: "BUG010 Perro",
          slug: "bug010-perro",
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

    const { data: req, error: er } = await admin
      .from("adoption_requests")
      .upsert(
        { animal_id: animalId, adopter_id: adopterId, status: "approved" },
        { onConflict: "animal_id,adopter_id" },
      )
      .select()
      .single();
    if (er) throw er;
    requestId = req.id;
  });

  it("borrar la cuenta que canceló una cita no falla y deja cancelled_by en NULL", async () => {
    const cancelerId = await ensureUser("bug010-canceler@test.com", PASS);
    const inicio = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    const { data: appt, error: eAppt } = await admin
      .from("appointments")
      .insert({
        request_id: requestId,
        shelter_id: shelterId,
        adopter_id: adopterId,
        starts_at: inicio.toISOString(),
        ends_at: new Date(inicio.getTime() + 30 * 60000).toISOString(),
        status: "cancelled",
        cancelled_by: cancelerId,
        cancel_reason: "prueba BUG-010",
      })
      .select()
      .single();
    if (eAppt) throw eAppt;

    const { error: eDel } = await admin.auth.admin.deleteUser(cancelerId);
    expect(eDel).toBeNull();

    const { data: after } = await admin
      .from("appointments")
      .select("cancelled_by")
      .eq("id", appt.id)
      .single();
    expect(after?.cancelled_by).toBeNull();
  });

  it("borrar la cuenta que revisó un reporte no falla y deja reviewed_by en NULL", async () => {
    const reviewerId = await ensureUser("bug010-reviewer@test.com", PASS);
    const { data: rep, error: eRep } = await admin
      .from("reports")
      .insert({
        reporter_id: adopterId,
        animal_id: animalId,
        reason: "otro",
        details: "prueba BUG-010",
        status: "reviewed",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (eRep) throw eRep;

    const { error: eDel } = await admin.auth.admin.deleteUser(reviewerId);
    expect(eDel).toBeNull();

    const { data: after } = await admin
      .from("reports")
      .select("reviewed_by")
      .eq("id", rep.id)
      .single();
    expect(after?.reviewed_by).toBeNull();
  });
});
