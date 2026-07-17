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
 * Tests del RPC `shelter_public_stats` (FEATURE-028, perfil público).
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 *
 * El RPC es `security definer` porque las adopciones se despublican
 * (`published_at = null`) y la RLS pública no deja contarlas: debe exponer
 * SOLO agregados y SOLO de protectoras verificadas (u owner/admin).
 */
describe.skipIf(!rlsDisponible)("RPC shelter_public_stats", () => {
  const PASS = "password-de-test-123";
  let verificadaId: string;
  let pendienteId: string;

  beforeAll(async () => {
    const admin = adminClient();

    const verificadaUser = await ensureUser("stats-verificada@test.com", PASS);
    const pendienteUser = await ensureUser("stats-pendiente@test.com", PASS);

    const upsertShelter = async (fila: Record<string, unknown>) => {
      const { data, error } = await upsertShelterFixture(fila);
      if (error) throw error;
      return data.id as string;
    };

    verificadaId = await upsertShelter({
      owner_id: verificadaUser,
      name: "Stats Verificada",
      slug: "stats-verificada",
      status: "verified",
      city: "Bilbao",
    });
    pendienteId = await upsertShelter({
      owner_id: pendienteUser,
      name: "Stats Pendiente",
      slug: "stats-pendiente",
      status: "pending",
      city: "Bilbao",
    });

    const publicado = new Date().toISOString();
    const animales: Record<string, unknown>[] = [
      // Disponible y publicado → cuenta en `disponibles`
      {
        shelter_id: verificadaId,
        name: "Stats Disponible",
        slug: "stats-disponible",
        species: "dog",
        sex: "male",
        size: "medium",
        status: "available",
        published_at: publicado,
      },
      // Borrador disponible → NO cuenta en `disponibles`
      {
        shelter_id: verificadaId,
        name: "Stats Borrador",
        slug: "stats-borrador",
        species: "dog",
        sex: "male",
        size: "medium",
        status: "available",
        published_at: null,
      },
      // Adoptado y despublicado → cuenta en `adopciones` pese a la RLS pública
      {
        shelter_id: verificadaId,
        name: "Stats Adoptado Oculto",
        slug: "stats-adoptado-oculto",
        species: "cat",
        sex: "female",
        size: "small",
        status: "adopted",
        published_at: null,
      },
      // Adoptado publicado → también cuenta en `adopciones`
      {
        shelter_id: verificadaId,
        name: "Stats Adoptado Visible",
        slug: "stats-adoptado-visible",
        species: "dog",
        sex: "female",
        size: "large",
        status: "adopted",
        published_at: publicado,
      },
      // De la pendiente: nunca visible vía RPC para anon
      {
        shelter_id: pendienteId,
        name: "Stats Adoptado Pendiente",
        slug: "stats-adoptado-pendiente",
        species: "dog",
        sex: "male",
        size: "medium",
        status: "adopted",
        published_at: publicado,
      },
    ];
    for (const a of animales) {
      const { error } = await admin.from("animals").upsert(a, { onConflict: "slug" });
      if (error) throw error;
    }
  });

  it("anon obtiene los conteos agregados de una protectora verificada", async () => {
    const anon = anonClient();
    const { data, error } = await anon.rpc("shelter_public_stats", {
      p_shelter_id: verificadaId,
    });
    expect(error).toBeNull();
    const filas = data as { adopciones: number; disponibles: number }[];
    expect(filas).toHaveLength(1);
    expect(filas[0].adopciones).toBe(2); // incluye el adoptado despublicado
    expect(filas[0].disponibles).toBe(1); // el borrador no cuenta
  });

  it("anon NO obtiene datos de una protectora pendiente", async () => {
    const anon = anonClient();
    const { data, error } = await anon.rpc("shelter_public_stats", {
      p_shelter_id: pendienteId,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("la dueña de una protectora pendiente SÍ ve sus propios conteos (preview)", async () => {
    const owner = await signInAs("stats-pendiente@test.com", PASS);
    const { data, error } = await owner.rpc("shelter_public_stats", {
      p_shelter_id: pendienteId,
    });
    expect(error).toBeNull();
    const filas = data as { adopciones: number; disponibles: number }[];
    expect(filas).toHaveLength(1);
    expect(filas[0].adopciones).toBe(1);
    expect(filas[0].disponibles).toBe(0);
  });

  it("el RPC no filtra filas de animales, solo agregados (sin columnas de animal)", async () => {
    const anon = anonClient();
    const { data } = await anon.rpc("shelter_public_stats", {
      p_shelter_id: verificadaId,
    });
    const fila = (data as Record<string, unknown>[])[0];
    expect(Object.keys(fila).sort()).toEqual(["adopciones", "disponibles"]);
  });
});
