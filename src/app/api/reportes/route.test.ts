import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  state: {
    insertError: null as { message: string } | null,
    lastInsert: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      insert: (fila: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            state.lastInsert = fila;
            if (state.insertError) return { data: null, error: state.insertError };
            return { data: { id: "r1", status: "pending" }, error: null };
          },
        }),
      }),
    }),
  })),
}));

import { POST, __resetRateLimitForTests } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/reportes", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const ANIMAL_ID = "11111111-1111-4111-8111-111111111111";

describe("POST /api/reportes", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    state.insertError = null;
    state.lastInsert = null;
  });

  it("401 sin sesión (reportar requiere cuenta)", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(req({ animal_id: ANIMAL_ID, reason: "spam" }));
    expect(res.status).toBe(401);
  });

  it("422 sin categoría válida", async () => {
    const res = await POST(req({ animal_id: ANIMAL_ID, reason: "no-existe" }));
    expect(res.status).toBe(422);
  });

  it("201: crea el reporte a nombre del usuario", async () => {
    const res = await POST(
      req({ animal_id: ANIMAL_ID, reason: "posible_fraude", details: "Piden Bizum" }),
    );
    expect(res.status).toBe(201);
    expect(state.lastInsert).toMatchObject({
      reporter_id: "u1",
      animal_id: ANIMAL_ID,
      reason: "posible_fraude",
    });
  });

  it("429 cuando el trigger de BD corta el tope diario", async () => {
    state.insertError = { message: "reports_limit" };
    const res = await POST(req({ animal_id: ANIMAL_ID, reason: "spam" }));
    expect(res.status).toBe(429);
  });

  it("429 por rate limit en memoria tras ráfaga", async () => {
    for (let i = 0; i < 10; i++) {
      await POST(req({ animal_id: ANIMAL_ID, reason: "spam" }));
    }
    const res = await POST(req({ animal_id: ANIMAL_ID, reason: "spam" }));
    expect(res.status).toBe(429);
  });
});
