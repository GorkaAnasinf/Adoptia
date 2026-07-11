import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  state: {
    role: "admin" as string,
    animal: {
      id: "a1",
      name: "Pipa",
      shelters: { name: "Protectora Bilbao", email: "prote@test.com" },
    } as Record<string, unknown> | null,
    lastUpdate: null as Record<string, unknown> | null,
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
      if (tabla === "audit_log") {
        return {
          insert: async (fila: Record<string, unknown>) => {
            state.auditadas.push(fila);
            return { error: null };
          },
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.animal }) }) }),
        update: (payload: Record<string, unknown>) => ({
          eq: async () => {
            state.lastUpdate = payload;
            return { error: null };
          },
        }),
      };
    },
  })),
}));

vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/admin/animales/a1/moderar", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = { params: Promise.resolve({ id: "a1" }) };

describe("POST /api/admin/animales/[id]/moderar", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "admin1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    state.role = "admin";
    state.animal = {
      id: "a1",
      name: "Pipa",
      shelters: { name: "Protectora Bilbao", email: "prote@test.com" },
    };
    state.lastUpdate = null;
    state.auditadas = [];
  });

  it("403 si no es admin (aunque tenga sesión)", async () => {
    state.role = "shelter";
    const res = await POST(req({ accion: "unpublish", motivo: "x" }), params);
    expect(res.status).toBe(403);
    expect(state.lastUpdate).toBeNull();
  });

  it("422 si se despublica sin motivo", async () => {
    const res = await POST(req({ accion: "unpublish" }), params);
    expect(res.status).toBe(422);
  });

  it("despublica: quita published_at, guarda el motivo, audita y avisa a la protectora", async () => {
    const res = await POST(req({ accion: "unpublish", motivo: "Fotos inadecuadas" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({
      published_at: null,
      moderation_note: "Fotos inadecuadas",
    });
    expect(state.auditadas).toHaveLength(1);
    expect(state.auditadas[0]).toMatchObject({
      admin_id: "admin1",
      action: "unpublish_animal",
      target_id: "a1",
      reason: "Fotos inadecuadas",
    });
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("prote@test.com");
    expect(enviarEmailMock.mock.calls[0][0].html).toContain("Fotos inadecuadas");
  });

  it("republica: restaura published_at, limpia la nota y audita sin email", async () => {
    const res = await POST(req({ accion: "republish" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ moderation_note: null });
    expect(state.lastUpdate!.published_at).not.toBeNull();
    expect(state.auditadas[0]).toMatchObject({ action: "republish_animal" });
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("404 si la ficha no existe", async () => {
    state.animal = null;
    const res = await POST(req({ accion: "republish" }), params);
    expect(res.status).toBe(404);
  });
});
