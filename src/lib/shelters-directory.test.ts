import { describe, expect, it, vi } from "vitest";
import { cargarProtectorasDirectorio } from "./shelters-directory";

type Row = Record<string, unknown>;

/** Cliente Supabase falso y encadenable que registra los filtros aplicados. */
function fakeSupabase(rows: Row[] | null, error: unknown = null) {
  const calls: Record<string, unknown[][]> = { from: [], select: [], eq: [], not: [], order: [] };
  const builder = {
    select: vi.fn((...a: unknown[]) => {
      calls.select.push(a);
      return builder;
    }),
    eq: vi.fn((...a: unknown[]) => {
      calls.eq.push(a);
      return builder;
    }),
    not: vi.fn((...a: unknown[]) => {
      calls.not.push(a);
      return builder;
    }),
    order: vi.fn((...a: unknown[]) => {
      calls.order.push(a);
      return Promise.resolve({ data: rows, error });
    }),
  };
  const supabase = {
    from: vi.fn((...a: unknown[]) => {
      calls.from.push(a);
      return builder;
    }),
  };
  return { supabase, calls };
}

const fila: Row = {
  id: "s1",
  name: "Protectora Bilbao",
  slug: "protectora-bilbao",
  logo_url: null,
  city: "Bilbao",
  province: "Bizkaia",
  description: "Rescatamos perros y gatos.",
  animals: [{ count: 3 }],
};

describe("cargarProtectorasDirectorio", () => {
  it("consulta shelters verificadas ordenadas por nombre", async () => {
    const { supabase, calls } = fakeSupabase([fila]);
    await cargarProtectorasDirectorio(supabase as never);
    expect(calls.from[0]).toEqual(["shelters"]);
    expect(calls.eq).toContainEqual(["status", "verified"]);
    expect(calls.order[0][0]).toBe("name");
  });

  it("cuenta solo animales disponibles y publicados", async () => {
    const { supabase, calls } = fakeSupabase([fila]);
    await cargarProtectorasDirectorio(supabase as never);
    expect(calls.eq).toContainEqual(["animals.status", "available"]);
    expect(calls.not).toContainEqual(["animals.published_at", "is", null]);
  });

  it("mapea el conteo anidado a available_count (0 si falta)", async () => {
    const { supabase } = fakeSupabase([fila, { ...fila, id: "s2", animals: [] }]);
    const result = await cargarProtectorasDirectorio(supabase as never);
    expect(result[0].available_count).toBe(3);
    expect(result[1].available_count).toBe(0);
  });

  it("con error de BD devuelve lista vacía sin lanzar", async () => {
    const { supabase } = fakeSupabase(null, { message: "boom" });
    await expect(cargarProtectorasDirectorio(supabase as never)).resolves.toEqual([]);
  });
});
