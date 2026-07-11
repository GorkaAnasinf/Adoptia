import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    shelter: null as Record<string, unknown> | null,
    cercanos: [] as Record<string, unknown>[],
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: vi.fn(async () => ({ data: state.cercanos, error: null })),
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }),
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST, __resetRateLimitForTests } from "./route";

const FOSTER_ID = "11111111-1111-4111-8111-111111111111";

function req(body: unknown) {
  return new Request("http://localhost/api/acogida/contactar", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/acogida/contactar", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "owner1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({ email: "ane@test.com", fullName: "Ane" });
    state.shelter = {
      id: "s1",
      name: "Protectora Bilbao",
      email: "prote@test.com",
      phone: "944000001",
      status: "verified",
    };
    state.cercanos = [{ user_id: FOSTER_ID, full_name: "Ane" }];
  });

  it("401 sin sesión; 403 si la protectora no está verificada", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req({ foster_user_id: FOSTER_ID }))).status).toBe(401);

    getUserMock.mockResolvedValue({ data: { user: { id: "owner1" } } });
    state.shelter = { ...state.shelter!, status: "pending" };
    expect((await POST(req({ foster_user_id: FOSTER_ID }))).status).toBe(403);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("el email va AL ACOGEDOR con los datos de la protectora (no al revés)", async () => {
    const res = await POST(req({ foster_user_id: FOSTER_ID }));
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("ane@test.com"); // al acogedor
    expect(email.html).toContain("Protectora Bilbao");
    expect(email.html).toContain("prote@test.com");
    expect(email.html).toContain("no");
  });

  it("404 si el acogedor no está en el alcance de la protectora (RPC vacío)", async () => {
    state.cercanos = [];
    const res = await POST(req({ foster_user_id: FOSTER_ID }));
    expect(res.status).toBe(404);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("429 tras superar el rate limit por protectora", async () => {
    for (let i = 0; i < 10; i++) await POST(req({ foster_user_id: FOSTER_ID }));
    const res = await POST(req({ foster_user_id: FOSTER_ID }));
    expect(res.status).toBe(429);
  });
});
