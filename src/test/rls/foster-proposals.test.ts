// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * FEATURE-029 — RLS de `foster_proposals`: la propuesta solo la ven la
 * protectora que la envió y el acogedor que la recibe; solo la protectora
 * actualiza su estado; el índice único parcial impide reenvíos con propuesta
 * activa; la baja del acogedor arrastra sus propuestas (supresión real).
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-029 RLS foster_proposals", () => {
  const PASS = "password-de-test-123";

  let fosterId: string;
  let shelterAId: string;
  let shelterBId: string;
  let tercerId: string;
  let proposalId: string;

  beforeAll(async () => {
    const admin = adminClient();

    fosterId = await ensureUser("prop-foster@test.com", PASS);
    const ownerA = await ensureUser("prop-prot-a@test.com", PASS);
    const ownerB = await ensureUser("prop-prot-b@test.com", PASS);
    tercerId = await ensureUser("prop-tercero@test.com", PASS);
    void tercerId;

    const alta = async (owner: string, slug: string) => {
      const { data, error } = await upsertShelterFixture({
        owner_id: owner,
        name: slug,
        slug,
        status: "verified",
        location: "POINT(-2.94 43.26)",
      });
      if (error) throw error;
      return data.id as string;
    };
    shelterAId = await alta(ownerA, "prop-prot-a");
    shelterBId = await alta(ownerB, "prop-prot-b");

    // Acogedor activo en Bilbao, dentro del radio de ambas protectoras
    await admin.from("foster_homes").delete().eq("user_id", fosterId);
    await admin.from("foster_homes").insert({
      user_id: fosterId,
      location: "POINT(-2.93 43.27)",
      city: "Bilbao",
      radius_km: 25,
      condiciones: { especies: ["dog"] },
      consent_at: new Date().toISOString(),
    });

    // Limpieza de propuestas de ejecuciones anteriores
    await admin.from("foster_proposals").delete().eq("foster_user_id", fosterId);
  });

  it("la protectora dueña crea la propuesta; anon y shelter ajeno no", async () => {
    const protA = await signInAs("prop-prot-a@test.com", PASS);
    const { data, error } = await protA
      .from("foster_proposals")
      .insert({
        shelter_id: shelterAId,
        foster_user_id: fosterId,
        duracion: "2 semanas",
        mensaje: "Camada de cachorros, necesitamos ayuda",
      })
      .select()
      .single();
    expect(error).toBeNull();
    proposalId = data!.id as string;

    // Anon no inserta
    const { error: deAnon } = await anonClient().from("foster_proposals").insert({
      shelter_id: shelterAId,
      foster_user_id: fosterId,
      duracion: "1 semana",
      mensaje: "x",
    });
    expect(deAnon).not.toBeNull();

    // La protectora B no puede insertar en nombre de la A
    const protB = await signInAs("prop-prot-b@test.com", PASS);
    const { error: suplantada } = await protB.from("foster_proposals").insert({
      shelter_id: shelterAId,
      foster_user_id: fosterId,
      duracion: "1 semana",
      mensaje: "x",
    });
    expect(suplantada).not.toBeNull();
  });

  it("solo la ven la protectora dueña y el acogedor; terceros y anon nada", async () => {
    const protA = await signInAs("prop-prot-a@test.com", PASS);
    const { data: deProt } = await protA.from("foster_proposals").select("id").eq("id", proposalId);
    expect(deProt).toHaveLength(1);

    const foster = await signInAs("prop-foster@test.com", PASS);
    const { data: deFoster } = await foster
      .from("foster_proposals")
      .select("id, duracion, mensaje, status")
      .eq("id", proposalId);
    expect(deFoster).toHaveLength(1);

    const protB = await signInAs("prop-prot-b@test.com", PASS);
    const { data: deB } = await protB.from("foster_proposals").select("id").eq("id", proposalId);
    expect(deB ?? []).toHaveLength(0);

    const tercero = await signInAs("prop-tercero@test.com", PASS);
    const { data: deTercero } = await tercero
      .from("foster_proposals")
      .select("id")
      .eq("id", proposalId);
    expect(deTercero ?? []).toHaveLength(0);

    const { data: deAnon } = await anonClient()
      .from("foster_proposals")
      .select("id")
      .eq("id", proposalId);
    expect(deAnon ?? []).toHaveLength(0);
  });

  it("con propuesta activa no cabe otra (índice único parcial)", async () => {
    const protA = await signInAs("prop-prot-a@test.com", PASS);
    const { error } = await protA.from("foster_proposals").insert({
      shelter_id: shelterAId,
      foster_user_id: fosterId,
      duracion: "1 mes",
      mensaje: "segundo intento",
    });
    expect(error).not.toBeNull();
    expect(error!.code).toBe("23505"); // unique_violation
  });

  it("solo la protectora dueña actualiza el estado; acogedor y ajenos no", async () => {
    const foster = await signInAs("prop-foster@test.com", PASS);
    const { data: intentoFoster } = await foster
      .from("foster_proposals")
      .update({ status: "aceptada" })
      .eq("id", proposalId)
      .select();
    expect(intentoFoster ?? []).toHaveLength(0);

    const protB = await signInAs("prop-prot-b@test.com", PASS);
    const { data: intentoB } = await protB
      .from("foster_proposals")
      .update({ status: "aceptada" })
      .eq("id", proposalId)
      .select();
    expect(intentoB ?? []).toHaveLength(0);

    const protA = await signInAs("prop-prot-a@test.com", PASS);
    const { data: ok, error } = await protA
      .from("foster_proposals")
      .update({ status: "aceptada" })
      .eq("id", proposalId)
      .select();
    expect(error).toBeNull();
    expect(ok).toHaveLength(1);
  });

  it("cerrada la propuesta (finalizada) se puede enviar otra", async () => {
    const protA = await signInAs("prop-prot-a@test.com", PASS);
    await protA.from("foster_proposals").update({ status: "finalizada" }).eq("id", proposalId);

    const { error } = await protA.from("foster_proposals").insert({
      shelter_id: shelterAId,
      foster_user_id: fosterId,
      duracion: "10 días",
      mensaje: "nueva acogida tras finalizar la anterior",
    });
    expect(error).toBeNull();
  });

  it("si se borra el animal, la propuesta conserva el historial con animal nulo", async () => {
    const admin = adminClient();
    const { data: animal } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterAId,
          name: "Trufa",
          slug: "trufa-prop-test",
          status: "available",
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();

    const { data: conAnimal, error } = await admin
      .from("foster_proposals")
      .insert({
        shelter_id: shelterBId,
        foster_user_id: fosterId,
        animal_id: animal!.id,
        duracion: "3 semanas",
        mensaje: "postoperatorio de Trufa",
      })
      .select()
      .single();
    expect(error).toBeNull();

    await admin.from("animals").delete().eq("id", animal!.id);

    const { data: fila } = await admin
      .from("foster_proposals")
      .select("id, animal_id")
      .eq("id", conAnimal!.id)
      .single();
    expect(fila).not.toBeNull();
    expect(fila!.animal_id).toBeNull();
  });

  it("la baja del acogedor arrastra sus propuestas (supresión real)", async () => {
    const foster = await signInAs("prop-foster@test.com", PASS);
    const { error } = await foster.from("foster_homes").delete().eq("user_id", fosterId);
    expect(error).toBeNull();

    const { data: restos } = await adminClient()
      .from("foster_proposals")
      .select("id")
      .eq("foster_user_id", fosterId);
    expect(restos ?? []).toHaveLength(0);
  });
});
