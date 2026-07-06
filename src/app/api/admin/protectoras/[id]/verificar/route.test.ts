import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  state: {
    role: "admin" as string | null,
    shelter: { name: "Refugio Esperanza", email: "gestor@refugio.org" } as
      | { name: string; email: string }
      | null,
    updateError: null as unknown,
    lastUpdate: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () =>
            table === "profiles"
              ? { data: state.role ? { role: state.role } : null }
              : { data: state.shelter },
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: async () => {
          state.lastUpdate = payload;
          return { error: state.updateError };
        },
      }),
    }),
  })),
}));

vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/admin/protectoras/s1/verificar", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = { params: Promise.resolve({ id: "s1" }) };

describe("POST /api/admin/protectoras/[id]/verificar", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "admin1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    state.role = "admin";
    state.shelter = { name: "Refugio Esperanza", email: "gestor@refugio.org" };
    state.updateError = null;
    state.lastUpdate = null;
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(req({ accion: "verify" }), params);
    expect(res.status).toBe(401);
  });

  it("403 si no es admin", async () => {
    state.role = "shelter";
    const res = await POST(req({ accion: "verify" }), params);
    expect(res.status).toBe(403);
  });

  it("verifica: status verified y envía email de verificación", async () => {
    const res = await POST(req({ accion: "verify" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ status: "verified" });
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("gestor@refugio.org");
  });

  it("400 si se rechaza sin motivo", async () => {
    const res = await POST(req({ accion: "reject" }), params);
    expect(res.status).toBe(400);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("rechaza: status suspended + motivo + email de rechazo", async () => {
    const res = await POST(req({ accion: "reject", motivo: "CIF no coincide" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({
      status: "suspended",
      verification_note: "CIF no coincide",
    });
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].html).toContain("CIF no coincide");
  });
});
