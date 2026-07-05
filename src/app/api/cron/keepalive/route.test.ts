import { beforeEach, describe, expect, it, vi } from "vitest";

const countMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: countMock,
    })),
  })),
}));

import { GET } from "./route";

function makeRequest(auth?: string) {
  return new Request("http://localhost:3000/api/cron/keepalive", {
    headers: auth ? { authorization: auth } : {},
  });
}

describe("GET /api/cron/keepalive", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "secreto-de-test");
    countMock.mockReset();
    countMock.mockResolvedValue({ count: 0, error: null });
  });

  it("devuelve 401 sin cabecera de autorización", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("devuelve 401 con un secreto incorrecto", async () => {
    const res = await GET(makeRequest("Bearer otro-secreto"));
    expect(res.status).toBe(401);
  });

  it("devuelve 200 y consulta la base de datos con el secreto correcto", async () => {
    const res = await GET(makeRequest("Bearer secreto-de-test"));
    expect(res.status).toBe(200);
    expect(countMock).toHaveBeenCalled();
  });

  it("devuelve 500 si la consulta a la base de datos falla", async () => {
    countMock.mockResolvedValue({ count: null, error: { message: "boom" } });
    const res = await GET(makeRequest("Bearer secreto-de-test"));
    expect(res.status).toBe(500);
  });
});
