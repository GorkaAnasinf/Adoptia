// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * IMPROVEMENT-026 — El estado del animal sigue a su propuesta de acogida:
 * aceptada → fostered; finalizada/borrada (baja del acogedor) → available;
 * animales en otros estados y propuestas sin animal no se tocan.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("IMPROVEMENT-026 sincronización animal-acogida", () => {
  const PASS = "password-de-test-123";

  let fosterId: string;
  let shelterId: string;
  let animalLibre: string;
  let animalReservado: string;

  const altaFoster = async () => {
    const admin = adminClient();
    await admin.from("foster_homes").delete().eq("user_id", fosterId);
    // Zaragoza, lejos del cluster de Bilbao que usan los tests de FEATURE-016:
    // la BD persiste entre ejecuciones y un acogedor extra en su radio los rompe.
    await admin.from("foster_homes").insert({
      user_id: fosterId,
      location: "POINT(-0.88 41.65)",
      city: "Zaragoza",
      radius_km: 25,
      condiciones: { especies: ["dog"] },
      consent_at: new Date().toISOString(),
    });
  };

  const estadoAnimal = async (id: string) => {
    const { data } = await adminClient().from("animals").select("status").eq("id", id).single();
    return data!.status as string;
  };

  beforeAll(async () => {
    const admin = adminClient();
    fosterId = await ensureUser("sync-foster@test.com", PASS);
    const owner = await ensureUser("sync-prot@test.com", PASS);

    const { data: shelter, error } = await upsertShelterFixture({
      owner_id: owner,
      name: "sync-prot",
      slug: "sync-prot",
      status: "verified",
      location: "POINT(-0.89 41.64)",
    });
    if (error) throw error;
    shelterId = shelter.id as string;

    const alta = async (slug: string, status: string) => {
      const { data } = await admin
        .from("animals")
        .upsert(
          {
            shelter_id: shelterId,
            name: slug,
            slug,
            status,
            published_at: new Date().toISOString(),
          },
          { onConflict: "slug" },
        )
        .select()
        .single();
      return data!.id as string;
    };
    animalLibre = await alta("sync-libre", "available");
    animalReservado = await alta("sync-reservado", "reserved");
    // El upsert puede reutilizar filas de ejecuciones previas: estado conocido
    await admin.from("animals").update({ status: "available" }).eq("id", animalLibre);
    await admin.from("animals").update({ status: "reserved" }).eq("id", animalReservado);

    await altaFoster();
    await admin.from("foster_proposals").delete().eq("foster_user_id", fosterId);
  });

  afterAll(async () => {
    // No dejar rastro: la BD local persiste y otros ficheros cuentan acogedores.
    const admin = adminClient();
    await admin.from("foster_proposals").delete().eq("foster_user_id", fosterId);
    await admin.from("foster_homes").delete().eq("user_id", fosterId);
  });

  it("aceptar la propuesta pone el animal en acogida; finalizarla lo devuelve", async () => {
    const prot = await signInAs("sync-prot@test.com", PASS);
    const { data: p, error } = await prot
      .from("foster_proposals")
      .insert({
        shelter_id: shelterId,
        foster_user_id: fosterId,
        animal_id: animalLibre,
        duracion: "2 semanas",
        mensaje: "sync test",
      })
      .select()
      .single();
    expect(error).toBeNull();

    await prot.from("foster_proposals").update({ status: "aceptada" }).eq("id", p!.id);
    expect(await estadoAnimal(animalLibre)).toBe("fostered");

    await prot.from("foster_proposals").update({ status: "finalizada" }).eq("id", p!.id);
    expect(await estadoAnimal(animalLibre)).toBe("available");
  });

  it("la baja del acogedor con acogida aceptada devuelve el animal a disponible", async () => {
    const prot = await signInAs("sync-prot@test.com", PASS);
    const { data: p } = await prot
      .from("foster_proposals")
      .insert({
        shelter_id: shelterId,
        foster_user_id: fosterId,
        animal_id: animalLibre,
        duracion: "1 mes",
        mensaje: "sync baja",
      })
      .select()
      .single();
    await prot.from("foster_proposals").update({ status: "aceptada" }).eq("id", p!.id);
    expect(await estadoAnimal(animalLibre)).toBe("fostered");

    const foster = await signInAs("sync-foster@test.com", PASS);
    const { error } = await foster.from("foster_homes").delete().eq("user_id", fosterId);
    expect(error).toBeNull();
    expect(await estadoAnimal(animalLibre)).toBe("available");

    await altaFoster(); // restaurar para el resto de tests
  });

  it("un animal reservado no se toca, y la propuesta sin animal no rompe", async () => {
    const prot = await signInAs("sync-prot@test.com", PASS);
    const { data: p } = await prot
      .from("foster_proposals")
      .insert({
        shelter_id: shelterId,
        foster_user_id: fosterId,
        animal_id: animalReservado,
        duracion: "1 semana",
        mensaje: "sync reservado",
      })
      .select()
      .single();
    await prot.from("foster_proposals").update({ status: "aceptada" }).eq("id", p!.id);
    expect(await estadoAnimal(animalReservado)).toBe("reserved");
    await prot.from("foster_proposals").update({ status: "finalizada" }).eq("id", p!.id);
    expect(await estadoAnimal(animalReservado)).toBe("reserved");

    const { data: sinAnimal, error } = await prot
      .from("foster_proposals")
      .insert({
        shelter_id: shelterId,
        foster_user_id: fosterId,
        duracion: "1 semana",
        mensaje: "sin animal",
      })
      .select()
      .single();
    expect(error).toBeNull();
    await prot.from("foster_proposals").update({ status: "aceptada" }).eq("id", sinAnimal!.id);
    await prot.from("foster_proposals").update({ status: "finalizada" }).eq("id", sinAnimal!.id);
  });

  it("rechazar desde enviada no altera el estado del animal", async () => {
    const prot = await signInAs("sync-prot@test.com", PASS);
    const { data: p } = await prot
      .from("foster_proposals")
      .insert({
        shelter_id: shelterId,
        foster_user_id: fosterId,
        animal_id: animalLibre,
        duracion: "3 días",
        mensaje: "sync rechazo",
      })
      .select()
      .single();
    await prot.from("foster_proposals").update({ status: "rechazada" }).eq("id", p!.id);
    expect(await estadoAnimal(animalLibre)).toBe("available");
  });
});
