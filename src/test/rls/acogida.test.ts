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
 * FEATURE-016 — RLS y RPC de casas de acogida: visibilidad solo para
 * protectoras verificadas dentro del radio, redondeo de ubicación, pausa y
 * baja con supresión. Requieren `npx supabase start` + SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-016 casas de acogida", () => {
  const PASS = "password-de-test-123";
  let fosterId: string;
  let shelterCercaId: string;
  let shelterLejosId: string;
  let shelterPendienteId: string;

  beforeAll(async () => {
    const admin = adminClient();
    fosterId = await ensureUser("acogida-foster@test.com", PASS);
    const ownerCerca = await ensureUser("acogida-prot-cerca@test.com", PASS);
    const ownerLejos = await ensureUser("acogida-prot-lejos@test.com", PASS);
    const ownerPend = await ensureUser("acogida-prot-pend@test.com", PASS);

    await admin.from("profiles").update({ full_name: "Ane Acogedora" }).eq("id", fosterId);
    await admin.from("foster_homes").delete().eq("user_id", fosterId);

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
    // Acogedora en Bilbao (radio 25 km): Bilbao cerca, Madrid lejos
    shelterCercaId = await alta(ownerCerca, "acogida-prot-cerca", "POINT(-2.94 43.26)", "verified");
    shelterLejosId = await alta(ownerLejos, "acogida-prot-lejos", "POINT(-3.70 40.41)", "verified");
    shelterPendienteId = await alta(ownerPend, "acogida-prot-pend", "POINT(-2.93 43.27)", "pending");
  });

  it("el acogedor se registra con consentimiento; anon no puede", async () => {
    const foster = await signInAs("acogida-foster@test.com", PASS);
    const { error } = await foster.from("foster_homes").insert({
      user_id: fosterId,
      location: "POINT(-2.9351234 43.2639876)",
      city: "Bilbao",
      radius_km: 25,
      condiciones: { especies: ["dog"], vivienda: "casa", jardin: true },
      consent_at: new Date().toISOString(),
    });
    expect(error).toBeNull();

    const { error: deAnon } = await anonClient().from("foster_homes").insert({
      user_id: fosterId,
      location: "POINT(0 0)",
      consent_at: new Date().toISOString(),
    });
    expect(deAnon).not.toBeNull();
  });

  it("solo la protectora verificada Y dentro del radio ve al acogedor; sin dirección exacta", async () => {
    const cerca = await signInAs("acogida-prot-cerca@test.com", PASS);
    const { data, error } = await cerca.rpc("foster_homes_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(error).toBeNull();
    const filas = (data ?? []) as Record<string, unknown>[];
    expect(filas).toHaveLength(1);
    expect(filas[0].full_name).toBe("Ane Acogedora");
    expect(filas[0].city).toBe("Bilbao");
    // Ni email, ni teléfono, ni coordenadas en la respuesta
    const claves = Object.keys(filas[0]);
    expect(claves).not.toContain("location");
    expect(claves).not.toContain("email");

    const lejos = await signInAs("acogida-prot-lejos@test.com", PASS);
    const { data: deLejos } = await lejos.rpc("foster_homes_nearby", {
      p_shelter_id: shelterLejosId,
    });
    expect(deLejos ?? []).toHaveLength(0);

    const pendiente = await signInAs("acogida-prot-pend@test.com", PASS);
    const { data: dePendiente } = await pendiente.rpc("foster_homes_nearby", {
      p_shelter_id: shelterPendienteId,
    });
    expect(dePendiente ?? []).toHaveLength(0); // no verificada
  });

  it("no se puede consultar con una protectora ajena ni leer la tabla directamente", async () => {
    const lejos = await signInAs("acogida-prot-lejos@test.com", PASS);
    // Con el shelter_id de otra protectora (cerca): el join owner_id=auth.uid() vacía
    const { data } = await lejos.rpc("foster_homes_nearby", { p_shelter_id: shelterCercaId });
    expect(data ?? []).toHaveLength(0);

    const { data: directo } = await lejos.from("foster_homes").select();
    expect(directo ?? []).toHaveLength(0);
  });

  it("la ubicación guardada está redondeada (dirección exacta inexistente)", async () => {
    const admin = adminClient();
    const { data } = await admin.rpc("lost_found_list"); // no aplica; leemos crudo
    void data;
    const { data: fila } = await admin
      .from("foster_homes")
      .select("location")
      .eq("user_id", fosterId)
      .single();
    // El punto redondeado difiere del introducido (rejilla 0.002°)
    expect(JSON.stringify(fila!.location)).not.toContain("43.2639876");
  });

  it("pausado (vacaciones) desaparece de las listas; reactivado vuelve", async () => {
    const foster = await signInAs("acogida-foster@test.com", PASS);
    await foster.from("foster_homes").update({ active: false }).eq("user_id", fosterId);

    const cerca = await signInAs("acogida-prot-cerca@test.com", PASS);
    const { data: pausado } = await cerca.rpc("foster_homes_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(pausado ?? []).toHaveLength(0);

    await foster.from("foster_homes").update({ active: true }).eq("user_id", fosterId);
    const { data: devuelta } = await cerca.rpc("foster_homes_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(devuelta).toHaveLength(1);
  });

  it("la baja suprime el registro y desaparece de todas las listas", async () => {
    const foster = await signInAs("acogida-foster@test.com", PASS);
    const { error } = await foster.from("foster_homes").delete().eq("user_id", fosterId);
    expect(error).toBeNull();

    const cerca = await signInAs("acogida-prot-cerca@test.com", PASS);
    const { data } = await cerca.rpc("foster_homes_nearby", { p_shelter_id: shelterCercaId });
    expect(data ?? []).toHaveLength(0);

    const { data: resto } = await adminClient()
      .from("foster_homes")
      .select()
      .eq("user_id", fosterId);
    expect(resto ?? []).toHaveLength(0); // supresión real, no soft-delete
  });
});
