import { beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  anonClient,
  ensureUser,
  rlsDisponible,
  signInAs,
} from "./helpers";

/**
 * Tests de las políticas RLS de la migración baseline.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("RLS baseline", () => {
  const PASS = "password-de-test-123";
  let shelterAUserId: string;
  let shelterBUserId: string;
  let adopterUserId: string;
  let shelterAId: string;
  let shelterBId: string;
  let animalPublicadoId: string;
  let animalBorradorId: string;
  let animalDeBId: string;

  beforeAll(async () => {
    const admin = adminClient();

    shelterAUserId = await ensureUser("protectora-a@test.com", PASS);
    shelterBUserId = await ensureUser("protectora-b@test.com", PASS);
    adopterUserId = await ensureUser("adoptante@test.com", PASS);

    // Fixtures con service_role (salta RLS)
    const { data: sa, error: ea } = await admin
      .from("shelters")
      .upsert(
        {
          owner_id: shelterAUserId,
          name: "Protectora A",
          slug: "protectora-a",
          status: "verified",
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (ea) throw ea;
    shelterAId = sa.id;

    const { data: sb, error: eb } = await admin
      .from("shelters")
      .upsert(
        {
          owner_id: shelterBUserId,
          name: "Protectora B",
          slug: "protectora-b",
          status: "verified",
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (eb) throw eb;
    shelterBId = sb.id;

    const { data: pub, error: ep } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterAId,
          name: "Luna",
          slug: "luna-test",
          species: "dog",
          sex: "female",
          size: "medium",
          status: "available",
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (ep) throw ep;
    animalPublicadoId = pub.id;

    const { data: draft, error: ed } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterAId,
          name: "Borrador",
          slug: "borrador-test",
          species: "cat",
          sex: "unknown",
          size: "small",
          status: "available",
          published_at: null,
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (ed) throw ed;
    animalBorradorId = draft.id;

    const { data: ab, error: eab } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterBId,
          name: "Rocky",
          slug: "rocky-test",
          species: "dog",
          sex: "male",
          size: "large",
          status: "available",
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (eab) throw eab;
    animalDeBId = ab.id;
  });

  it("al crear un usuario existe su fila en profiles con rol adopter", async () => {
    const admin = adminClient();
    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", adopterUserId)
      .single();
    expect(data?.role).toBe("adopter");
  });

  it("anon SÍ lee un animal publicado de protectora verificada", async () => {
    const anon = anonClient();
    const { data } = await anon
      .from("animals")
      .select()
      .eq("id", animalPublicadoId);
    expect(data).toHaveLength(1);
  });

  it("anon NO lee un animal sin published_at (borrador)", async () => {
    const anon = anonClient();
    const { data } = await anon
      .from("animals")
      .select()
      .eq("id", animalBorradorId);
    expect(data).toHaveLength(0); // RLS filtra, no da error
  });

  it("la protectora dueña SÍ lee sus borradores", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const { data } = await clientA
      .from("animals")
      .select()
      .eq("id", animalBorradorId);
    expect(data).toHaveLength(1);
  });

  it("protectora A NO edita animales de protectora B", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const { data } = await clientA
      .from("animals")
      .update({ name: "hack" })
      .eq("id", animalDeBId)
      .select();
    expect(data).toHaveLength(0); // update silenciosamente no afecta filas
  });

  it("protectora A SÍ edita sus propios animales", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const { data } = await clientA
      .from("animals")
      .update({ description: "actualizada" })
      .eq("id", animalPublicadoId)
      .select();
    expect(data).toHaveLength(1);
  });

  it("un usuario NO puede cambiar su propio rol", async () => {
    const cliente = await signInAs("adoptante@test.com", PASS);
    const { data } = await cliente
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", adopterUserId)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon NO lee solicitudes de adopción", async () => {
    const anon = anonClient();
    const { data } = await anon.from("adoption_requests").select();
    expect(data).toHaveLength(0);
  });

  it("el adoptante crea una solicitud y solo él y la protectora la ven", async () => {
    const adoptante = await signInAs("adoptante@test.com", PASS);
    const { error } = await adoptante.from("adoption_requests").upsert(
      {
        animal_id: animalPublicadoId,
        adopter_id: adopterUserId,
        questionnaire: { vivienda: "piso" },
      },
      { onConflict: "animal_id,adopter_id" },
    );
    expect(error).toBeNull();

    const { data: propias } = await adoptante
      .from("adoption_requests")
      .select()
      .eq("animal_id", animalPublicadoId);
    expect(propias).toHaveLength(1);

    // La protectora del animal la ve
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const { data: comoShelter } = await clientA
      .from("adoption_requests")
      .select()
      .eq("animal_id", animalPublicadoId);
    expect(comoShelter).toHaveLength(1);

    // Otra protectora NO la ve
    const clientB = await signInAs("protectora-b@test.com", PASS);
    const { data: ajenas } = await clientB
      .from("adoption_requests")
      .select()
      .eq("animal_id", animalPublicadoId);
    expect(ajenas).toHaveLength(0);
  });

  it("PostGIS está activo (consulta de proximidad vía RPC)", async () => {
    const admin = adminClient();
    const { error } = await admin.rpc("shelters_nearby", {
      lat: 43.263,
      lng: -2.935,
      radius_m: 50000,
    });
    expect(error).toBeNull();
  });
});
