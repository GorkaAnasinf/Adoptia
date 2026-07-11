import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, updateUserMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  updateUserMock: vi.fn(),
  state: {
    role: "admin" as string,
    auditadas: [] as Record<string, unknown>[],
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (tabla: string) => {
      if (tabla === "profiles") {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: { role: state.role } }) }) }),
        };
      }
      return {
        insert: async (fila: Record<string, unknown>) => {
          state.auditadas.push(fila);
          return { error: null };
        },
      };
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { updateUserById: updateUserMock } },
  })),
}));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/admin/usuarios/u9/suspender", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = { params: Promise.resolve({ id: "u9" }) };

describe("POST /api/admin/usuarios/[id]/suspender", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "admin1" } } });
    updateUserMock.mockReset().mockResolvedValue({ data: {}, error: null });
    state.role = "admin";
    state.auditadas = [];
  });

  it("403 si no es admin", async () => {
    state.role = "adopter";
    const res = await POST(req({ accion: "suspend", motivo: "x" }), params);
    expect(res.status).toBe(403);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("suspende: banea en GoTrue y audita con motivo", async () => {
    const res = await POST(req({ accion: "suspend", motivo: "Suplantación de identidad" }), params);
    expect(res.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("u9", { ban_duration: "87600h" });
    expect(state.auditadas[0]).toMatchObject({
      action: "suspend_user",
      target_id: "u9",
      reason: "Suplantación de identidad",
    });
  });

  it("reactiva: quita el ban y audita", async () => {
    const res = await POST(req({ accion: "reactivate" }), params);
    expect(res.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("u9", { ban_duration: "none" });
    expect(state.auditadas[0]).toMatchObject({ action: "reactivate_user" });
  });

  it("422 si se suspende sin motivo; 409 si intenta suspenderse a sí mismo", async () => {
    expect((await POST(req({ accion: "suspend" }), params)).status).toBe(422);

    const propio = { params: Promise.resolve({ id: "admin1" }) };
    expect((await POST(req({ accion: "suspend", motivo: "x" }), propio)).status).toBe(409);
  });
});
