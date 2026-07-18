// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * FEATURE-030 — Relevo de acogida: el acogedor destinatario pide/cancela el
 * relevo de SU propuesta aceptada vía RPC (la tabla no le da update); con dos
 * acogidas aceptadas del mismo animal, finalizar una no lo libera.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-030 relevo de acogida", () => {
  const PASS = "password-de-test-123";

  let fosterA: string;
  let fosterB: string;
  let shelterId: string;
  let animalId: string;
  let propuestaA: string;

  const crearPropuesta = async (foster: string, status: string) => {
    const { data, error } = await adminClient()
      .from("foster_proposals")
      .insert({
        shelter_id: shelterId,
        foster_user_id: foster,
        animal_id: animalId,
        duracion: "2 semanas",
        mensaje: "relevo test",
        status,
      })
      .select()
      .single();
    if (error) throw error;
    return data!.id as string;
  };

  beforeAll(async () => {
    const admin = adminClient();
    fosterA = await ensureUser("relevo-foster-a@test.com", PASS);
    fosterB = await ensureUser("relevo-foster-b@test.com", PASS);
    const owner = await ensureUser("relevo-prot@test.com", PASS);

    const { data: shelter, error } = await upsertShelterFixture({
      owner_id: owner,
      name: "relevo-prot",
      slug: "relevo-prot",
      status: "verified",
      location: "POINT(-4.72 41.65)", // Valladolid: lejos de otros clusters de test
    });
    if (error) throw error;
    shelterId = shelter.id as string;

    for (const f of [fosterA, fosterB]) {
      await admin.from("foster_homes").delete().eq("user_id", f);
      await admin.from("foster_homes").insert({
        user_id: f,
        location: "POINT(-4.73 41.66)",
        city: "Valladolid",
        radius_km: 25,
        condiciones: { especies: ["dog"] },
        consent_at: new Date().toISOString(),
      });
    }

    const { data: animal } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterId,
          name: "Relevo",
          slug: "relevo-test",
          status: "available",
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    animalId = animal!.id as string;
    await admin.from("animals").update({ status: "available" }).eq("id", animalId);

    await admin.from("foster_proposals").delete().in("foster_user_id", [fosterA, fosterB]);
    propuestaA = await crearPropuesta(fosterA, "aceptada");
  });

  afterAll(async () => {
    const admin = adminClient();
    await admin.from("foster_proposals").delete().in("foster_user_id", [fosterA, fosterB]);
    await admin.from("foster_homes").delete().eq("user_id", fosterA);
    await admin.from("foster_homes").delete().eq("user_id", fosterB);
  });

  it("el acogedor destinatario pide relevo de su propuesta aceptada", async () => {
    const foster = await signInAs("relevo-foster-a@test.com", PASS);
    const { error } = await foster.rpc("pedir_relevo", {
      p_proposal_id: propuestaA,
      p_motivo: "Obras en casa por inundación",
      p_fecha_limite: "2026-08-01",
    });
    expect(error).toBeNull();

    const { data: fila } = await adminClient()
      .from("foster_proposals")
      .select("relevo_pedido_at, relevo_motivo, relevo_fecha_limite")
      .eq("id", propuestaA)
      .single();
    expect(fila!.relevo_pedido_at).not.toBeNull();
    expect(fila!.relevo_motivo).toBe("Obras en casa por inundación");
    expect(fila!.relevo_fecha_limite).toBe("2026-08-01");
  });

  it("ni otro acogedor ni la protectora pueden pedir el relevo en su nombre", async () => {
    const otro = await signInAs("relevo-foster-b@test.com", PASS);
    const { error: deOtro } = await otro.rpc("pedir_relevo", {
      p_proposal_id: propuestaA,
      p_motivo: "hack",
      p_fecha_limite: "2026-08-01",
    });
    expect(deOtro).not.toBeNull();

    const prot = await signInAs("relevo-prot@test.com", PASS);
    const { error: deProt } = await prot.rpc("pedir_relevo", {
      p_proposal_id: propuestaA,
      p_motivo: "hack",
      p_fecha_limite: "2026-08-01",
    });
    expect(deProt).not.toBeNull();
  });

  it("el acogedor no gana update directo sobre la tabla", async () => {
    const foster = await signInAs("relevo-foster-a@test.com", PASS);
    const { data } = await foster
      .from("foster_proposals")
      .update({ relevo_motivo: "directo" })
      .eq("id", propuestaA)
      .select();
    expect(data ?? []).toHaveLength(0); // RLS: update sigue siendo solo de la protectora
  });

  it("cancelar_relevo limpia los campos; solo el destinatario", async () => {
    const otro = await signInAs("relevo-foster-b@test.com", PASS);
    const { error: deOtro } = await otro.rpc("cancelar_relevo", { p_proposal_id: propuestaA });
    expect(deOtro).not.toBeNull();

    const foster = await signInAs("relevo-foster-a@test.com", PASS);
    const { error } = await foster.rpc("cancelar_relevo", { p_proposal_id: propuestaA });
    expect(error).toBeNull();

    const { data: fila } = await adminClient()
      .from("foster_proposals")
      .select("relevo_pedido_at, relevo_motivo, relevo_fecha_limite")
      .eq("id", propuestaA)
      .single();
    expect(fila!.relevo_pedido_at).toBeNull();
    expect(fila!.relevo_motivo).toBeNull();
    expect(fila!.relevo_fecha_limite).toBeNull();
  });

  it("no se puede pedir relevo de una propuesta no aceptada", async () => {
    const admin = adminClient();
    await admin.from("foster_proposals").update({ status: "finalizada" }).eq("id", propuestaA);

    const foster = await signInAs("relevo-foster-a@test.com", PASS);
    const { error } = await foster.rpc("pedir_relevo", {
      p_proposal_id: propuestaA,
      p_motivo: "tarde",
      p_fecha_limite: "2026-08-01",
    });
    expect(error).not.toBeNull();
  });

  it("con dos acogidas aceptadas del mismo animal, finalizar una no lo libera", async () => {
    const admin = adminClient();
    // Relevo en marcha: original (A, re-aceptada) + nueva (B, aceptada)
    await admin.from("foster_proposals").delete().in("foster_user_id", [fosterA, fosterB]);
    await admin.from("animals").update({ status: "available" }).eq("id", animalId);
    const original = await crearPropuesta(fosterA, "aceptada");
    const relevo = await crearPropuesta(fosterB, "aceptada");

    const estado = async () => {
      const { data } = await admin.from("animals").select("status").eq("id", animalId).single();
      return data!.status as string;
    };
    expect(await estado()).toBe("fostered");

    await admin.from("foster_proposals").update({ status: "finalizada" }).eq("id", original);
    expect(await estado()).toBe("fostered"); // el relevo sigue vivo

    await admin.from("foster_proposals").update({ status: "finalizada" }).eq("id", relevo);
    expect(await estado()).toBe("available"); // ya no queda ninguna aceptada
  });
});
