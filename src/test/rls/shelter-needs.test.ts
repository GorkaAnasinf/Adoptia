// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * FEATURE-031 — RLS y RPC del tablón de necesidades: solo protectoras
 * verificadas publican; el público lee únicamente abiertas de verificadas;
 * la dueña conserva su historial de cubiertas; el RPC de proximidad excluye
 * cubiertas, no verificadas y fuera de radio.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-031 tablón de necesidades", () => {
  const PASS = "password-de-test-123";

  let shelterVerifId: string;
  let shelterPendId: string;
  let shelterLejosId: string;
  let needId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const ownerVerif = await ensureUser("needs-prot-verif@test.com", PASS);
    const ownerPend = await ensureUser("needs-prot-pend@test.com", PASS);
    const ownerLejos = await ensureUser("needs-prot-lejos@test.com", PASS);
    await ensureUser("needs-tercero@test.com", PASS);

    const alta = async (owner: string, slug: string, punto: string, status: string) => {
      const { data, error } = await upsertShelterFixture({
        owner_id: owner,
        name: slug,
        slug,
        status,
        location: punto,
      });
      if (error) throw error;
      return data.id as string;
    };
    // Cluster propio en Murcia para no pisar otros tests de proximidad
    shelterVerifId = await alta(ownerVerif, "needs-prot-verif", "POINT(-1.13 37.98)", "verified");
    shelterPendId = await alta(ownerPend, "needs-prot-pend", "POINT(-1.14 37.99)", "pending");
    shelterLejosId = await alta(ownerLejos, "needs-prot-lejos", "POINT(-8.54 42.88)", "verified"); // Santiago

    await admin
      .from("shelter_needs")
      .delete()
      .in("shelter_id", [shelterVerifId, shelterPendId, shelterLejosId]);
  });

  afterAll(async () => {
    await adminClient()
      .from("shelter_needs")
      .delete()
      .in("shelter_id", [shelterVerifId, shelterPendId, shelterLejosId]);
  });

  it("la protectora verificada crea una necesidad; la pendiente no; el tercero tampoco", async () => {
    const verif = await signInAs("needs-prot-verif@test.com", PASS);
    const { data, error } = await verif
      .from("shelter_needs")
      .insert({
        shelter_id: shelterVerifId,
        categoria: "comida",
        descripcion: "Pienso de cachorro, se nos acaba esta semana",
        urgencia: "urgente",
      })
      .select()
      .single();
    expect(error).toBeNull();
    needId = data!.id as string;

    const pend = await signInAs("needs-prot-pend@test.com", PASS);
    const { error: dePend } = await pend.from("shelter_needs").insert({
      shelter_id: shelterPendId,
      categoria: "comida",
      descripcion: "no debería poder",
    });
    expect(dePend).not.toBeNull();

    const tercero = await signInAs("needs-tercero@test.com", PASS);
    const { error: deTercero } = await tercero.from("shelter_needs").insert({
      shelter_id: shelterVerifId,
      categoria: "otros",
      descripcion: "suplantación",
    });
    expect(deTercero).not.toBeNull();
  });

  it("anon lee las abiertas de verificadas; cubierta desaparece del público pero no del historial de la dueña", async () => {
    const { data: publicas } = await anonClient()
      .from("shelter_needs")
      .select("id, descripcion")
      .eq("id", needId);
    expect(publicas).toHaveLength(1);

    const verif = await signInAs("needs-prot-verif@test.com", PASS);
    const { error } = await verif
      .from("shelter_needs")
      .update({ status: "cubierta" })
      .eq("id", needId);
    expect(error).toBeNull();

    const { data: yaNo } = await anonClient().from("shelter_needs").select("id").eq("id", needId);
    expect(yaNo ?? []).toHaveLength(0);

    const { data: historial } = await verif
      .from("shelter_needs")
      .select("id, status")
      .eq("id", needId);
    expect(historial).toHaveLength(1);
    expect(historial![0].status).toBe("cubierta");

    // Reabrible
    await verif.from("shelter_needs").update({ status: "abierta" }).eq("id", needId);
    const { data: reabierta } = await anonClient()
      .from("shelter_needs")
      .select("id")
      .eq("id", needId);
    expect(reabierta).toHaveLength(1);
  });

  it("nadie más edita: ni tercero ni otra protectora", async () => {
    const tercero = await signInAs("needs-tercero@test.com", PASS);
    const { data: intento } = await tercero
      .from("shelter_needs")
      .update({ descripcion: "hack" })
      .eq("id", needId)
      .select();
    expect(intento ?? []).toHaveLength(0);

    const lejos = await signInAs("needs-prot-lejos@test.com", PASS);
    const { data: deLejos } = await lejos
      .from("shelter_needs")
      .update({ descripcion: "hack" })
      .eq("id", needId)
      .select();
    expect(deLejos ?? []).toHaveLength(0);
  });

  it("el RPC de proximidad devuelve abiertas de verificadas dentro del radio, urgentes primero", async () => {
    const admin = adminClient();
    // Necesidad de la pendiente (no debe salir) y una normal de la verificada
    await admin.from("shelter_needs").insert({
      shelter_id: shelterPendId,
      categoria: "otros",
      descripcion: "de protectora pendiente",
    });
    await admin.from("shelter_needs").insert({
      shelter_id: shelterVerifId,
      categoria: "mantas_ropa",
      descripcion: "mantas para el invierno",
      urgencia: "normal",
    });

    // Murcia centro, radio 30 km
    const { data, error } = await anonClient().rpc("shelter_needs_nearby", {
      p_lat: 37.98,
      p_lng: -1.13,
      p_radius_km: 30,
    });
    expect(error).toBeNull();
    const filas = (data ?? []) as Record<string, unknown>[];
    const propias = filas.filter((f) => f.shelter_slug === "needs-prot-verif");
    expect(propias.length).toBe(2);
    expect(propias[0].urgencia).toBe("urgente"); // urgentes primero
    expect(filas.some((f) => f.shelter_slug === "needs-prot-pend")).toBe(false);
    expect(filas.some((f) => f.shelter_slug === "needs-prot-lejos")).toBe(false); // fuera de radio
  });
});
