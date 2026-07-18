import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    archivados: [] as { id: string }[],
    caducadas: [] as { id: string }[],
    llamadas: {} as Record<string, Record<string, unknown>>,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (tabla: string) => ({
      update: (payload: Record<string, unknown>) => ({
        eq: (col: string, v: string) => ({
          lt: (col2: string, v2: string) => ({
            select: async () => {
              state.llamadas[tabla] = { payload, [col]: v, [col2]: v2 };
              return {
                data: tabla === "lost_found_posts" ? state.archivados : state.caducadas,
                error: null,
              };
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
    state.caducadas = [];
    state.llamadas = {};
  });

  afterEach(() => vi.unstubAllEnvs());

  it("401 sin secreto", async () => {
    expect((await GET(req("malo"))).status).toBe(401);
    expect(Object.keys(state.llamadas)).toHaveLength(0);
  });

  it("archiva solo avisos abiertos con más de 60 días sin actividad", async () => {
    state.archivados = [{ id: "p1" }, { id: "p2" }];
    const res = await GET(req());
    expect(res.status).toBe(200);
    const avisos = state.llamadas.lost_found_posts;
    expect(avisos.payload).toEqual({ status: "archived" });
    expect(avisos.status).toBe("open");
    const limite = new Date(avisos.last_activity_at as string).getTime();
    const esperado = Date.now() - 60 * 24 * 3600 * 1000;
    expect(Math.abs(limite - esperado)).toBeLessThan(5000);
    expect((await res.json()).data.archivados).toBe(2);
  });

  it("caduca solo ofertas de donación abiertas sin renovar en 60 días (FEATURE-032)", async () => {
    state.caducadas = [{ id: "d1" }];
    const res = await GET(req());
    expect(res.status).toBe(200);
    const ofertas = state.llamadas.donation_offers;
    expect(ofertas.payload).toEqual({ status: "caducada" });
    expect(ofertas.status).toBe("abierta");
    const limite = new Date(ofertas.renovada_at as string).getTime();
    const esperado = Date.now() - 60 * 24 * 3600 * 1000;
    expect(Math.abs(limite - esperado)).toBeLessThan(5000);
    expect((await res.json()).data.donacionesCaducadas).toBe(1);
  });
});
