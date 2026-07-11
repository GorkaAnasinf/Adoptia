import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    cita: null as Record<string, unknown> | null,
    lastUpdate: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.cita }) }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: () => ({
          select: () => ({
            single: async () => {
              state.lastUpdate = payload;
              return { data: { id: "cita1", ...payload }, error: null };
            },
          }),
        }),
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { PATCH } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/citas/cita1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = { params: Promise.resolve({ id: "cita1" }) };

describe("PATCH /api/citas/[id]", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "owner1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({ email: "marta@test.com", fullName: "Marta" });
    state.cita = {
      id: "cita1",
      status: "confirmed",
      adopter_id: "adopter1",
      starts_at: "2026-08-01T10:00:00.000Z",
      adoption_requests: { animals: { name: "Pipa" } },
      shelters: { name: "Protectora Bilbao", email: "prote@test.com", owner_id: "owner1" },
    };
    state.lastUpdate = null;
  });

  it("401 sin sesión y 404 si no existe", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await PATCH(req({ accion: "done" }), params)).status).toBe(401);

    getUserMock.mockResolvedValue({ data: { user: { id: "owner1" } } });
    state.cita = null;
    expect((await PATCH(req({ accion: "done" }), params)).status).toBe(404);
  });

  it("422 si se cancela sin motivo", async () => {
    const res = await PATCH(req({ accion: "cancel" }), params);
    expect(res.status).toBe(422);
  });

  it("la protectora cancela con motivo: status cancelled y email al adoptante", async () => {
    const res = await PATCH(req({ accion: "cancel", motivo: "Cerramos por obras" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ status: "cancelled", cancel_reason: "Cerramos por obras", cancelled_by: "owner1" });
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("marta@test.com");
    expect(enviarEmailMock.mock.calls[0][0].html).toContain("Cerramos por obras");
  });

  it("el adoptante cancela: email a la protectora", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "adopter1" } } });
    const res = await PATCH(req({ accion: "cancel", motivo: "Me ha surgido un viaje" }), params);
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("prote@test.com");
  });

  it("un tercero no puede tocar la cita", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "intruso" } } });
    const res = await PATCH(req({ accion: "cancel", motivo: "x" }), params);
    expect(res.status).toBe(403);
  });

  it("done y no_show son solo de la protectora", async () => {
    expect((await PATCH(req({ accion: "done" }), params)).status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ status: "done" });

    getUserMock.mockResolvedValue({ data: { user: { id: "adopter1" } } });
    expect((await PATCH(req({ accion: "no_show" }), params)).status).toBe(403);
  });

  it("no_show registra la ausencia sin emails", async () => {
    const res = await PATCH(req({ accion: "no_show" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ status: "no_show" });
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("una cita cancelada no admite más acciones", async () => {
    state.cita = { ...(state.cita as Record<string, unknown>), status: "cancelled" };
    const res = await PATCH(req({ accion: "cancel", motivo: "otra vez" }), params);
    expect(res.status).toBe(409);
  });
});
