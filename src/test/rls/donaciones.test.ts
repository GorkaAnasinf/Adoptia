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
 * FEATURE-032 — RLS y RPC de ofertas de donación: solo el donante gestiona lo
 * suyo, las protectoras verificadas de la zona las ven únicamente vía RPC,
 * ubicación redondeada, tope de abiertas y caducidad no manipulable.
 * Requieren `npx supabase start` + SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-032 ofertas de donación", () => {
  const PASS = "password-de-test-123";
  let donanteId: string;
  let shelterCercaId: string;
  let shelterLejosId: string;
  let shelterPendienteId: string;
  let ofertaId: string;

  beforeAll(async () => {
    const admin = adminClient();
    donanteId = await ensureUser("donacion-donante@test.com", PASS);
    const ownerCerca = await ensureUser("donacion-prot-cerca@test.com", PASS);
    const ownerLejos = await ensureUser("donacion-prot-lejos@test.com", PASS);
    const ownerPend = await ensureUser("donacion-prot-pend@test.com", PASS);

    await admin.from("profiles").update({ full_name: "Dani Donante" }).eq("id", donanteId);
    await admin.from("donation_offers").delete().eq("user_id", donanteId);

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
    // Donante en Bilbao (radio 25 km): Bilbao cerca, Madrid lejos
    shelterCercaId = await alta(ownerCerca, "donacion-prot-cerca", "POINT(-2.94 43.26)", "verified");
    shelterLejosId = await alta(ownerLejos, "donacion-prot-lejos", "POINT(-3.70 40.41)", "verified");
    shelterPendienteId = await alta(ownerPend, "donacion-prot-pend", "POINT(-2.93 43.27)", "pending");
  });

  it("el donante publica su oferta; anon no puede", async () => {
    const donante = await signInAs("donacion-donante@test.com", PASS);
    const { data, error } = await donante
      .from("donation_offers")
      .insert({
        user_id: donanteId,
        categoria: "comida",
        descripcion: "Dos sacos de pienso sin abrir y un transportín mediano",
        city: "Bilbao",
        location: "POINT(-2.9351234 43.2639876)",
        radius_km: 25,
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    ofertaId = data!.id as string;

    const { error: deAnon } = await anonClient().from("donation_offers").insert({
      user_id: donanteId,
      categoria: "comida",
      descripcion: "spam",
      location: "POINT(0 0)",
    });
    expect(deAnon).not.toBeNull();
  });

  it("un tercero autenticado no lee ni edita la tabla directamente", async () => {
    const tercero = await signInAs("donacion-prot-lejos@test.com", PASS);
    const { data } = await tercero.from("donation_offers").select();
    expect(data ?? []).toHaveLength(0);

    const { data: upd } = await tercero
      .from("donation_offers")
      .update({ descripcion: "hack" })
      .eq("id", ofertaId)
      .select();
    expect(upd ?? []).toHaveLength(0);
  });

  it("solo la protectora verificada Y dentro del radio ve la oferta, sin coordenadas ni user_id", async () => {
    const cerca = await signInAs("donacion-prot-cerca@test.com", PASS);
    const { data, error } = await cerca.rpc("donation_offers_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(error).toBeNull();
    const filas = (data ?? []) as Record<string, unknown>[];
    expect(filas).toHaveLength(1);
    expect(filas[0].full_name).toBe("Dani Donante");
    expect(filas[0].categoria).toBe("comida");
    expect(filas[0].city).toBe("Bilbao");
    const claves = Object.keys(filas[0]);
    expect(claves).not.toContain("location");
    expect(claves).not.toContain("user_id");
    expect(claves).not.toContain("email");

    const lejos = await signInAs("donacion-prot-lejos@test.com", PASS);
    const { data: deLejos } = await lejos.rpc("donation_offers_nearby", {
      p_shelter_id: shelterLejosId,
    });
    expect(deLejos ?? []).toHaveLength(0);

    const pendiente = await signInAs("donacion-prot-pend@test.com", PASS);
    const { data: dePendiente } = await pendiente.rpc("donation_offers_nearby", {
      p_shelter_id: shelterPendienteId,
    });
    expect(dePendiente ?? []).toHaveLength(0); // no verificada

    // Con el shelter_id de otra protectora: el join owner_id=auth.uid() vacía
    const { data: ajena } = await lejos.rpc("donation_offers_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(ajena ?? []).toHaveLength(0);
  });

  it("la ubicación guardada está redondeada (dirección exacta inexistente)", async () => {
    const { data: fila } = await adminClient()
      .from("donation_offers")
      .select("location")
      .eq("id", ofertaId)
      .single();
    expect(JSON.stringify(fila!.location)).not.toContain("43.2639876");
  });

  it("renovada_at no se puede fechar en el futuro: el trigger la fija a now()", async () => {
    const donante = await signInAs("donacion-donante@test.com", PASS);
    const futuro = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    await donante.from("donation_offers").update({ renovada_at: futuro }).eq("id", ofertaId);

    const { data } = await adminClient()
      .from("donation_offers")
      .select("renovada_at")
      .eq("id", ofertaId)
      .single();
    const dif = Math.abs(Date.now() - new Date(data!.renovada_at as string).getTime());
    expect(dif).toBeLessThan(60_000);
  });

  it("entregada o caducada desaparece del tablón; renovar la reabre", async () => {
    const donante = await signInAs("donacion-donante@test.com", PASS);
    const cerca = await signInAs("donacion-prot-cerca@test.com", PASS);

    await donante.from("donation_offers").update({ status: "entregada" }).eq("id", ofertaId);
    const { data: conEntregada } = await cerca.rpc("donation_offers_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(conEntregada ?? []).toHaveLength(0);

    // Caducada de verdad (renovada_at vieja vía service_role, que el trigger exime)
    const hace90d = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
    await adminClient()
      .from("donation_offers")
      .update({ status: "caducada", renovada_at: hace90d })
      .eq("id", ofertaId);
    const { data: conCaducada } = await cerca.rpc("donation_offers_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(conCaducada ?? []).toHaveLength(0);

    // Renovar: el dueño la reabre y el trigger repone renovada_at a now()
    const { error } = await donante
      .from("donation_offers")
      .update({ status: "abierta", renovada_at: new Date().toISOString() })
      .eq("id", ofertaId);
    expect(error).toBeNull();
    const { data: renovada } = await cerca.rpc("donation_offers_nearby", {
      p_shelter_id: shelterCercaId,
    });
    expect(renovada).toHaveLength(1);
  });

  it("una oferta abierta pero sin renovar en 60 días no sale en el tablón aunque el cron no haya pasado", async () => {
    const hace70d = new Date(Date.now() - 70 * 24 * 3600 * 1000).toISOString();
    await adminClient()
      .from("donation_offers")
      .update({ status: "abierta", renovada_at: hace70d })
      .eq("id", ofertaId);

    const cerca = await signInAs("donacion-prot-cerca@test.com", PASS);
    const { data } = await cerca.rpc("donation_offers_nearby", { p_shelter_id: shelterCercaId });
    expect(data ?? []).toHaveLength(0);

    // La reponemos abierta y fresca para los tests siguientes
    await adminClient()
      .from("donation_offers")
      .update({ renovada_at: new Date().toISOString() })
      .eq("id", ofertaId);
  });

  it("tope de 5 ofertas abiertas por usuario", async () => {
    const donante = await signInAs("donacion-donante@test.com", PASS);
    const base = {
      user_id: donanteId,
      categoria: "otros",
      descripcion: "Relleno para el tope",
      location: "POINT(-2.94 43.26)",
    };
    // Ya hay 1 abierta: metemos 4 más hasta el tope
    for (let i = 0; i < 4; i++) {
      const { error } = await donante.from("donation_offers").insert(base);
      expect(error).toBeNull();
    }
    const { error: sexta } = await donante.from("donation_offers").insert(base);
    expect(sexta).not.toBeNull();
    expect(sexta!.message).toContain("donation_offers_limit");

    await adminClient()
      .from("donation_offers")
      .delete()
      .eq("user_id", donanteId)
      .neq("id", ofertaId);
  });

  it("el borrado del donante es real y desaparece del tablón", async () => {
    const donante = await signInAs("donacion-donante@test.com", PASS);
    const { error } = await donante.from("donation_offers").delete().eq("id", ofertaId);
    expect(error).toBeNull();

    const cerca = await signInAs("donacion-prot-cerca@test.com", PASS);
    const { data } = await cerca.rpc("donation_offers_nearby", { p_shelter_id: shelterCercaId });
    expect(data ?? []).toHaveLength(0);

    const { data: resto } = await adminClient()
      .from("donation_offers")
      .select()
      .eq("user_id", donanteId);
    expect(resto ?? []).toHaveLength(0); // supresión real
  });
});
