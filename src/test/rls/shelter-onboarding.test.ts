import { beforeAll, describe, expect, it } from "vitest";
import {
  ANON_KEY,
  TEST_URL,
  adminClient,
  anonClient,
  ensureUser,
  rlsDisponible,
  signInAs,
  upsertShelterFixture,
} from "./helpers";

/**
 * RLS de FEATURE-002 — onboarding y verificación.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("RLS onboarding de protectoras", () => {
  const PASS = "password-de-test-123";
  let ownerId: string;
  let adminId: string;
  let shelterId: string;

  beforeAll(async () => {
    const admin = adminClient();

    ownerId = await ensureUser("onboarding-owner@test.com", PASS);
    adminId = await ensureUser("onboarding-admin@test.com", PASS);

    // Promociona el usuario admin
    const { error: eRole } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", adminId);
    if (eRole) throw eRole;

    const { data, error } = await upsertShelterFixture({
      owner_id: ownerId,
      name: "Refugio Onboarding",
      slug: "refugio-onboarding",
      cif: "B98000003",
      email: "entidad-onboarding@test.com",
      status: "pending",
    });
    if (error) throw error;
    shelterId = data.id;
  });

  it("la protectora NO puede cambiar su propio status (trigger lo bloquea)", async () => {
    const owner = await signInAs("onboarding-owner@test.com", PASS);
    const { error } = await owner
      .from("shelters")
      .update({ status: "verified" })
      .eq("id", shelterId)
      .select();
    expect(error).not.toBeNull(); // el trigger lanza excepción, no filtra en silencio
  });

  it("la protectora SÍ puede editar campos no privilegiados (descripción)", async () => {
    const owner = await signInAs("onboarding-owner@test.com", PASS);
    const { data, error } = await owner
      .from("shelters")
      .update({ description: "Somos un refugio actualizado" })
      .eq("id", shelterId)
      .select();
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("un admin SÍ puede verificar (cambiar status)", async () => {
    const adminUser = await signInAs("onboarding-admin@test.com", PASS);
    const { data, error } = await adminUser
      .from("shelters")
      .update({ status: "verified" })
      .eq("id", shelterId)
      .select();
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].status).toBe("verified");

    // Deja el estado en pending para no contaminar otros tests
    await adminClient().from("shelters").update({ status: "pending" }).eq("id", shelterId);
  });

  it("un segundo shelter con el mismo CIF falla (único)", async () => {
    const admin = adminClient();
    const otro = await ensureUser("onboarding-otro@test.com", PASS);
    const { error } = await admin.from("shelters").insert({
      owner_id: otro,
      name: "Duplicado CIF",
      slug: "duplicado-cif",
      cif: "B98000003",
      email: "otro-distinto@test.com",
    });
    expect(error).not.toBeNull();
    expect(error!.code).toBe("23505"); // unique_violation
  });

  it("un segundo shelter con el mismo email de entidad falla (único)", async () => {
    const admin = adminClient();
    const otro = await ensureUser("onboarding-otro2@test.com", PASS);
    const { error } = await admin.from("shelters").insert({
      owner_id: otro,
      name: "Duplicado email",
      slug: "duplicado-email",
      cif: "B67375459",
      email: "entidad-onboarding@test.com",
    });
    expect(error).not.toBeNull();
    expect(error!.code).toBe("23505");
  });

  it("anon NO ve una protectora pending (no aparece en listados públicos)", async () => {
    const anon = anonClient();
    const { data } = await anon.from("shelters").select().eq("id", shelterId);
    expect(data ?? []).toHaveLength(0);
  });

  it("anon NO puede leer la caché de geocoding", async () => {
    const anon = anonClient();
    const { data } = await anon.from("geocode_cache").select();
    expect(data ?? []).toHaveLength(0);
  });

  it("el bucket de logos existe y es público de lectura", async () => {
    const admin = adminClient();
    const { data } = await admin.storage.getBucket("logos");
    expect(data?.public).toBe(true);
  });

  it("anon NO ve una protectora suspended (pierde visibilidad pública)", async () => {
    const admin = adminClient();
    await admin.from("shelters").update({ status: "suspended" }).eq("id", shelterId);
    const anon = anonClient();
    const { data } = await anon.from("shelters").select().eq("id", shelterId);
    expect(data ?? []).toHaveLength(0);
    // Restaura el estado para no contaminar otros tests
    await admin.from("shelters").update({ status: "pending" }).eq("id", shelterId);
  });

  // El helper .upload() de supabase-js cuelga en Node; usamos fetch directo
  // con el token del usuario (igual que el navegador) para ejercer la política.
  async function subirLogoComo(email: string, ruta: string): Promise<number> {
    const client = await signInAs(email, PASS);
    const {
      data: { session },
    } = await client.auth.getSession();
    const res = await fetch(`${TEST_URL}/storage/v1/object/logos/${ruta}`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${session!.access_token}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    return res.status;
  }

  it("la protectora SÍ puede subir su logo a su propia carpeta {shelter_id}/", async () => {
    const status = await subirLogoComo("onboarding-owner@test.com", `${shelterId}/logo.png`);
    expect(status).toBe(200);
  });

  it("una protectora NO puede subir a la carpeta de otra protectora", async () => {
    await ensureUser("onboarding-nonowner@test.com", PASS);
    const status = await subirLogoComo("onboarding-nonowner@test.com", `${shelterId}/hack.png`);
    expect(status).toBeGreaterThanOrEqual(400); // la política deniega
  });

  it("el dueño NO puede subir fuera de la carpeta de su shelter", async () => {
    const status = await subirLogoComo("onboarding-owner@test.com", "carpeta-ajena/logo.png");
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
