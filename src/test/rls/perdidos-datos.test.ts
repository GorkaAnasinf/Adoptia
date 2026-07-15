// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs } from "./helpers";

/**
 * FEATURE-023 — Datos identificativos del aviso y fecha real del suceso.
 * Requieren `npx supabase start`.
 */
describe.skipIf(!rlsDisponible)("FEATURE-023 datos identificativos", () => {
  const PASS = "password-de-test-123";
  let autorId: string;
  let postId: string;

  const hace = (dias: number) =>
    new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

  beforeAll(async () => {
    const admin = adminClient();
    autorId = await ensureUser("fd-autor@test.com", PASS);
    await admin.from("lost_found_posts").delete().eq("user_id", autorId);
  });

  it("un aviso guarda los datos identificativos, y el listado público los devuelve", async () => {
    const autor = await signInAs("fd-autor@test.com", PASS);
    const { data, error } = await autor
      .from("lost_found_posts")
      .insert({
        user_id: autorId,
        type: "lost",
        species: "dog",
        name: "Kira",
        description: "Se escapó por la noche",
        location: "POINT(-2.9346 43.2631)",
        city: "Bilbao",
        breed: "Podenco",
        sex: "female",
        size: "medium",
        color: "Canela con el pecho blanco",
        has_collar: true,
        collar_description: "Rojo, con placa sin nombre",
        has_microchip: true,
        occurred_on: hace(3),
      })
      .select()
      .single();
    expect(error).toBeNull();
    postId = data!.id;

    const { data: lista, error: errLista } = await anonClient().rpc("lost_found_list");
    expect(errLista).toBeNull();
    const aviso = (lista as Record<string, unknown>[]).find((p) => p.id === postId);
    expect(aviso).toBeDefined();
    expect(aviso!.breed).toBe("Podenco");
    expect(aviso!.sex).toBe("female");
    expect(aviso!.size).toBe("medium");
    expect(aviso!.has_collar).toBe(true);
    expect(aviso!.has_microchip).toBe(true);
    expect(aviso!.occurred_on).toBe(hace(3));
  });

  it("todo lo identificativo es opcional: se puede publicar sin saber nada del animal", async () => {
    const autor = await signInAs("fd-autor@test.com", PASS);
    const { data, error } = await autor
      .from("lost_found_posts")
      .insert({
        user_id: autorId,
        type: "found",
        species: "cat",
        description: "Gato en el portal, no se deja coger",
        location: "POINT(-2.93 43.26)",
        occurred_on: hace(0),
      })
      .select("id, breed, sex, size, has_collar, has_microchip")
      .single();
    expect(error).toBeNull();
    // null = "no lo sé", la convención de las compatibilidades de `animals`.
    expect(data!.breed).toBeNull();
    expect(data!.sex).toBeNull();
    expect(data!.size).toBeNull();
    expect(data!.has_collar).toBeNull();
    expect(data!.has_microchip).toBeNull();
  });

  it("publicar sin indicar la fecha del suceso la deja en hoy, sin romper", async () => {
    // El formulario de FEATURE-012 y el seed no conocían este campo: `not null`
    // sin default los habría roto a todos.
    const autor = await signInAs("fd-autor@test.com", PASS);
    const { data, error } = await autor
      .from("lost_found_posts")
      .insert({
        user_id: autorId,
        type: "lost",
        species: "other",
        description: "Sin fecha explícita",
        location: "POINT(-2.93 43.26)",
      })
      .select("occurred_on")
      .single();
    expect(error).toBeNull();
    expect(data!.occurred_on).toBe(hace(0));
  });

  it("no se admite una fecha de suceso futura", async () => {
    const autor = await signInAs("fd-autor@test.com", PASS);
    const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const { error } = await autor.from("lost_found_posts").insert({
      user_id: autorId,
      type: "lost",
      species: "dog",
      description: "x",
      location: "POINT(-2.93 43.26)",
      occurred_on: manana,
    });
    expect(error).not.toBeNull();
  });

  it("los avisos sembrados antes de la migración tienen fecha de suceso coherente", async () => {
    // El seed viene de `db reset`: ninguna fila puede haberse quedado sin
    // `occurred_on` al aplicarse el `not null`.
    const { data } = await adminClient()
      .from("lost_found_posts")
      .select("id, occurred_on, created_at")
      .limit(50);
    for (const fila of (data ?? []) as { occurred_on: string; created_at: string }[]) {
      expect(fila.occurred_on).not.toBeNull();
      expect(new Date(fila.occurred_on).getTime()).toBeLessThanOrEqual(Date.now());
    }
  });

  it("los datos identificativos de un aviso archivado ajeno no son públicos", async () => {
    const admin = adminClient();
    await admin.from("lost_found_posts").update({ status: "archived" }).eq("id", postId);

    const { data } = await anonClient()
      .from("lost_found_posts")
      .select("id, breed, color, has_microchip")
      .eq("id", postId);
    expect(data ?? []).toHaveLength(0);

    await admin.from("lost_found_posts").update({ status: "open" }).eq("id", postId);
  });

  it("no existe ninguna columna con el número de microchip", async () => {
    // Criterio de aceptación con dientes: identifica al dueño en el registro
    // autonómico. Si alguien la añade "por comodidad", este test lo caza.
    const { data } = await adminClient().rpc("lost_found_list");
    const columnas = Object.keys((data as Record<string, unknown>[])[0] ?? {});
    expect(columnas.some((c) => /chip.*(number|num|code|id)|microchip_n/i.test(c))).toBe(false);
  });
});
