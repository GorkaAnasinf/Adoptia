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
  cover_url: "https://example.com/cover.jpg",
  city: "Bilbao",
  province: "Bizkaia",
  description: "Rescatamos perros y gatos.",
  disponibles: [{ count: 3 }],
  adopciones: [{ count: 7 }],
};

describe("cargarProtectorasDirectorio", () => {
  it("consulta shelters verificadas ordenadas por nombre, con cover y dos conteos", async () => {
    const { supabase, calls } = fakeSupabase([fila]);
    await cargarProtectorasDirectorio(supabase as never);
    expect(calls.from[0]).toEqual(["shelters"]);
    expect(calls.eq).toContainEqual(["status", "verified"]);
    expect(calls.order[0][0]).toBe("name");
    const select = String(calls.select[0][0]);
    expect(select).toContain("cover_url");
    expect(select).toContain("disponibles:animals(count)");
    expect(select).toContain("adopciones:animals(count)");
  });

  it("cuenta disponibles publicados y adoptados por separado", async () => {
    const { supabase, calls } = fakeSupabase([fila]);
    await cargarProtectorasDirectorio(supabase as never);
    expect(calls.eq).toContainEqual(["disponibles.status", "available"]);
    expect(calls.not).toContainEqual(["disponibles.published_at", "is", null]);
    expect(calls.eq).toContainEqual(["adopciones.status", "adopted"]);
  });

  it("mapea los conteos a available_count y adopted_count (0 si faltan)", async () => {
    const { supabase } = fakeSupabase([
      fila,
      { ...fila, id: "s2", disponibles: [], adopciones: [] },
    ]);
    const result = await cargarProtectorasDirectorio(supabase as never);
    expect(result[0].available_count).toBe(3);
    expect(result[0].adopted_count).toBe(7);
    expect(result[0].cover_url).toBe("https://example.com/cover.jpg");
    expect(result[1].available_count).toBe(0);
    expect(result[1].adopted_count).toBe(0);
  });

  it("con error de BD devuelve lista vacía sin lanzar", async () => {
    const { supabase } = fakeSupabase(null, { message: "boom" });
    await expect(cargarProtectorasDirectorio(supabase as never)).resolves.toEqual([]);
  });
});
