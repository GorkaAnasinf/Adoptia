import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    archivados: [] as { id: string }[],
    filtros: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({
      update: (payload: Record<string, unknown>) => ({
        eq: (col: string, v: string) => ({
          lt: (col2: string, v2: string) => ({
            select: async () => {
              state.filtros = { payload, [col]: v, [col2]: v2 };
              return { data: state.archivados, error: null };
            },
          }),
        }),
      }),
    }),
  })),
}));

import { GET } from "./route";

function req(secret = "s3cr3t") {
  return new Request("http://localhost/api/cron/avisos", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("GET /api/cron/avisos", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    state.archivados = [];
    state.filtros = null;
  });

  afterEach(() => vi.unstubAllEnvs());

  it("401 sin secreto", async () => {
    expect((await GET(req("malo"))).status).toBe(401);
    expect(state.filtros).toBeNull();
  });

  it("archiva solo avisos abiertos con más de 60 días sin actividad", async () => {
    state.archivados = [{ id: "p1" }, { id: "p2" }];
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(state.filtros!.payload).toEqual({ status: "archived" });
    expect(state.filtros!.status).toBe("open");
    const limite = new Date(state.filtros!.last_activity_at as string).getTime();
    const esperado = Date.now() - 60 * 24 * 3600 * 1000;
    expect(Math.abs(limite - esperado)).toBeLessThan(5000);
    expect((await res.json()).data.archivados).toBe(2);
  });
});
