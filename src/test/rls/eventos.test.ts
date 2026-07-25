// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs, upsertShelterFixture } from "./helpers";

/**
 * FEATURE-062 — Jornadas de adopción (F1). RLS y RPC:
 * - solo la protectora VERIFICADA dueña crea/edita/borra sus jornadas;
 * - el público ve las publicadas (no borradores) de verificadas;
 * - los animales vinculados deben ser de la propia protectora;
 * - cada usuario gestiona su RSVP; la dueña ve la lista; otro asistente no;
 * - `events_upcoming` devuelve publicadas y futuras de verificadas, con
 *   recuentos, y filtra por proximidad.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-062 jornadas de adopción", () => {
  const PASS = "password-de-test-123";
  const enHoras = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

  let shelterVerifId: string;
  let shelterOtroId: string;
  let shelterPendId: string;
  let animalVerifId: string;
  let animalOtroId: string;
  let adopterId: string;
  let eventoPubId: string;
  let eventoBorradorId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const ownerVerif = await ensureUser("evt-prot-verif@test.com", PASS);
    const ownerOtro = await ensureUser("evt-prot-otro@test.com", PASS);
    const ownerPend = await ensureUser("evt-prot-pend@test.com", PASS);
    adopterId = await ensureUser("evt-adoptante@test.com", PASS);
    await ensureUser("evt-adoptante2@test.com", PASS);

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
    // Cluster propio en Almería para no pisar otros tests de proximidad.
    shelterVerifId = await alta(ownerVerif, "evt-prot-verif", "POINT(-2.46 36.84)", "verified");
    shelterOtroId = await alta(ownerOtro, "evt-prot-otro", "POINT(-2.47 36.85)", "verified");
    shelterPendId = await alta(ownerPend, "evt-prot-pend", "POINT(-2.45 36.83)", "pending");

    const animal = async (shelter: string, slug: string) => {
      const { data: existente } = await admin.from("animals").select("id").eq("slug", slug).maybeSingle();
      if (existente) return existente.id as string;
      const { data, error } = await admin
        .from("animals")
        .insert({ shelter_id: shelter, name: slug, slug, species: "dog", status: "available", published_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    };
    animalVerifId = await animal(shelterVerifId, "evt-animal-verif");
    animalOtroId = await animal(shelterOtroId, "evt-animal-otro");

    // Limpieza de ejecuciones previas del stack local.
    await admin.from("events").delete().in("shelter_id", [shelterVerifId, shelterOtroId, shelterPendId]);
  });

  afterAll(async () => {
    await adminClient().from("events").delete().in("shelter_id", [shelterVerifId, shelterOtroId, shelterPendId]);
  });

  it("la protectora verificada crea y publica una jornada; la pendiente no; un tercero tampoco", async () => {
    const verif = await signInAs("evt-prot-verif@test.com", PASS);
    const { data: pub, error } = await verif
      .from("events")
      .insert({
        shelter_id: shelterVerifId,
        title: "Jornada en la plaza",
        description: "Ven a conocerlos",
        starts_at: enHoras(48),
        ends_at: enHoras(51),
        location: "POINT(-2.46 36.84)",
        city: "Almería",
        status: "published",
      })
      .select()
      .single();
    expect(error).toBeNull();
    eventoPubId = pub!.id as string;

    // Un borrador de la misma protectora (sin ubicación, permitido en draft).
    const { data: borr, error: errBorr } = await verif
      .from("events")
      .insert({
        shelter_id: shelterVerifId,
        title: "Borrador",
        starts_at: enHoras(72),
        ends_at: enHoras(75),
        status: "draft",
      })
      .select()
      .single();
    expect(errBorr).toBeNull();
    eventoBorradorId = borr!.id as string;

    // Protectora pendiente: no puede crear.
    const pend = await signInAs("evt-prot-pend@test.com", PASS);
    const { error: dePend } = await pend.from("events").insert({
      shelter_id: shelterPendId,
      title: "no debería",
      starts_at: enHoras(48),
      ends_at: enHoras(51),
      location: "POINT(-2.45 36.83)",
      status: "published",
    });
    expect(dePend).not.toBeNull();

    // Tercero (otra protectora) suplantando a la verificada.
    const otro = await signInAs("evt-prot-otro@test.com", PASS);
    const { error: deOtro } = await otro.from("events").insert({
      shelter_id: shelterVerifId,
      title: "suplantación",
      starts_at: enHoras(48),
      ends_at: enHoras(51),
      location: "POINT(-2.46 36.84)",
      status: "published",
    });
    expect(deOtro).not.toBeNull();
  });

  it("una jornada publicada no puede quedar sin ubicación (check de BD)", async () => {
    const verif = await signInAs("evt-prot-verif@test.com", PASS);
    const { error } = await verif.from("events").insert({
      shelter_id: shelterVerifId,
      title: "publicada sin sitio",
      starts_at: enHoras(48),
      ends_at: enHoras(51),
      status: "published",
    });
    expect(error).not.toBeNull();
  });

  it("anon lee la publicada de verificada, pero NUNCA el borrador", async () => {
    const { data: publicas } = await anonClient().from("events").select("id").eq("id", eventoPubId);
    expect(publicas).toHaveLength(1);

    const { data: borrador } = await anonClient().from("events").select("id").eq("id", eventoBorradorId);
    expect(borrador ?? []).toHaveLength(0);
  });

  it("solo la dueña edita/cancela; un tercero no", async () => {
    const otro = await signInAs("evt-prot-otro@test.com", PASS);
    const { data: intento } = await otro
      .from("events")
      .update({ title: "hackeada" })
      .eq("id", eventoPubId)
      .select();
    expect(intento ?? []).toHaveLength(0);

    const verif = await signInAs("evt-prot-verif@test.com", PASS);
    const { error } = await verif.from("events").update({ status: "cancelled" }).eq("id", eventoPubId);
    expect(error).toBeNull();
    // la dejamos publicada para el resto de casos
    await verif.from("events").update({ status: "published" }).eq("id", eventoPubId);
  });

  it("la dueña vincula un animal SUYO; no puede vincular uno ajeno", async () => {
    const verif = await signInAs("evt-prot-verif@test.com", PASS);
    const { error: ok } = await verif
      .from("event_animals")
      .insert({ event_id: eventoPubId, animal_id: animalVerifId });
    expect(ok).toBeNull();

    const { error: ajeno } = await verif
      .from("event_animals")
      .insert({ event_id: eventoPubId, animal_id: animalOtroId });
    expect(ajeno).not.toBeNull();

    const { data: publicos } = await anonClient()
      .from("event_animals")
      .select("animal_id")
      .eq("event_id", eventoPubId);
    expect(publicos).toHaveLength(1);
  });

  it("el adoptante confirma asistencia; no puede a un borrador; la dueña ve la lista y otro asistente no", async () => {
    const adoptante = await signInAs("evt-adoptante@test.com", PASS);
    const { error } = await adoptante
      .from("event_attendees")
      .insert({ event_id: eventoPubId, user_id: adopterId });
    expect(error).toBeNull();

    // No se puede confirmar a un borrador.
    const { error: aBorrador } = await adoptante
      .from("event_attendees")
      .insert({ event_id: eventoBorradorId, user_id: adopterId });
    expect(aBorrador).not.toBeNull();

    // La dueña ve al asistente.
    const verif = await signInAs("evt-prot-verif@test.com", PASS);
    const { data: lista } = await verif
      .from("event_attendees")
      .select("user_id")
      .eq("event_id", eventoPubId);
    expect(lista).toHaveLength(1);

    // Otro adoptante NO ve la asistencia ajena.
    const otro = await signInAs("evt-adoptante2@test.com", PASS);
    const { data: ajena } = await otro
      .from("event_attendees")
      .select("user_id")
      .eq("event_id", eventoPubId);
    expect(ajena ?? []).toHaveLength(0);

    // El adoptante retira su asistencia.
    const { error: baja } = await adoptante
      .from("event_attendees")
      .delete()
      .eq("event_id", eventoPubId)
      .eq("user_id", adopterId);
    expect(baja).toBeNull();
    const { data: tras } = await verif.from("event_attendees").select("user_id").eq("event_id", eventoPubId);
    expect(tras ?? []).toHaveLength(0);
  });

  it("events_upcoming devuelve publicadas y futuras de verificadas, con recuentos, y filtra por proximidad", async () => {
    const admin = adminClient();
    // Jornada de la protectora pendiente (no debe salir).
    await admin.from("events").insert({
      shelter_id: shelterPendId,
      title: "de pendiente",
      starts_at: enHoras(48),
      ends_at: enHoras(51),
      location: "POINT(-2.45 36.83)",
      status: "published",
    });
    // Jornada pasada de la verificada (no debe salir).
    await admin.from("events").insert({
      shelter_id: shelterVerifId,
      title: "ya pasó",
      starts_at: enHoras(-51),
      ends_at: enHoras(-48),
      location: "POINT(-2.46 36.84)",
      status: "published",
    });

    // Sin proximidad: la publicada futura de la verificada aparece.
    const { data: todas, error } = await anonClient().rpc("events_upcoming", {});
    expect(error).toBeNull();
    const filas = (todas ?? []) as Record<string, unknown>[];
    const propia = filas.find((f) => f.id === eventoPubId);
    expect(propia).toBeTruthy();
    expect(Number(propia!.animal_count)).toBe(1);
    expect(filas.some((f) => f.title === "de pendiente")).toBe(false);
    expect(filas.some((f) => f.title === "ya pasó")).toBe(false);

    // Con proximidad: Almería centro, radio 30 km incluye la propia.
    const { data: cerca } = await anonClient().rpc("events_upcoming", {
      p_lat: 36.84,
      p_lng: -2.46,
      p_radius_m: 30000,
    });
    const cercaFilas = (cerca ?? []) as Record<string, unknown>[];
    expect(cercaFilas.some((f) => f.id === eventoPubId)).toBe(true);

    // Fuera de radio (Santiago) no incluye la de Almería.
    const { data: lejos } = await anonClient().rpc("events_upcoming", {
      p_lat: 42.88,
      p_lng: -8.54,
      p_radius_m: 30000,
    });
    const lejosFilas = (lejos ?? []) as Record<string, unknown>[];
    expect(lejosFilas.some((f) => f.id === eventoPubId)).toBe(false);
  });
});
