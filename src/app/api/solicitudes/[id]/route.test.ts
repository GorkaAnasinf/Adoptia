import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    request: {
      id: "req1",
      status: "pending",
      animal_id: "animal1",
      adopter_id: "adopter1",
      animals: { id: "animal1", name: "Pipa", status: "available", shelter_id: "shelter1", shelters: { owner_id: "owner1" } },
    } as Record<string, unknown> | null,
    otherPending: [] as Record<string, unknown>[],
    updateError: null as { code: string; message: string } | null,
    lastUpdate: null as Record<string, unknown> | null,
    animalUpdateError: null as { message: string } | null,
    lastAnimalUpdate: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "adoption_requests") {
        return {
          select: () => ({
            eq: (col: string) => {
              if (col === "id") {
                return { maybeSingle: async () => ({ data: state.request }) };
              }
              // otras solicitudes pendientes del mismo animal (para "complete")
              return {
                eq: () => ({
                  neq: async () => ({ data: state.otherPending }),
                }),
              };
            },
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: () => ({
              select: () => ({
                single: async () => {
                  state.lastUpdate = payload;
                  if (state.updateError) return { data: null, error: state.updateError };
                  return { data: { id: "req1", status: payload.status }, error: null };
                },
              }),
            }),
          }),
        };
      }
      if (table === "animals") {
        return {
          update: (payload: Record<string, unknown>) => ({
            eq: async () => {
              state.lastAnimalUpdate = payload;
              return { error: state.animalUpdateError };
            },
          }),
        };
      }
      throw new Error(`tabla no mockeada: ${table}`);
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/adopter-contact", () => ({
  obtenerContactoAdoptante: obtenerContactoMock,
}));

vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { PATCH } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/solicitudes/req1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = { params: Promise.resolve({ id: "req1" }) };

describe("PATCH /api/solicitudes/[id]", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "owner1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockImplementation(async (_admin: unknown, id: string) => {
      if (id === "adopter1") return { email: "marta@test.com", fullName: "Marta" };
      if (id === "adopter2") return { email: "juan@test.com", fullName: "Juan" };
      return { email: null, fullName: null };
    });
    state.request = {
      id: "req1",
      status: "pending",
      animal_id: "animal1",
      adopter_id: "adopter1",
      animals: {
        id: "animal1",
        name: "Pipa",
        status: "available",
        shelter_id: "shelter1",
        shelters: { owner_id: "owner1" },
      },
    };
    state.otherPending = [];
    state.updateError = null;
    state.lastUpdate = null;
    state.animalUpdateError = null;
    state.lastAnimalUpdate = null;
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(req({ accion: "approve" }), params);
    expect(res.status).toBe(401);
  });

  it("404 si la solicitud no existe", async () => {
    state.request = null;
    const res = await PATCH(req({ accion: "approve" }), params);
    expect(res.status).toBe(404);
  });

  it("403 si quien llama no es la protectora dueña", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "otro-usuario" } } });
    const res = await PATCH(req({ accion: "approve" }), params);
    expect(res.status).toBe(403);
  });

  it("422 si se rechaza sin motivo", async () => {
    const res = await PATCH(req({ accion: "reject" }), params);
    expect(res.status).toBe(422);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("aprueba: status approved, animal pasa a reserved y se envía email", async () => {
    const res = await PATCH(req({ accion: "approve" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ status: "approved" });
    expect(state.lastAnimalUpdate).toMatchObject({ status: "reserved" });
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("marta@test.com");
  });

  it("rechaza con motivo: status rejected y email con el motivo", async () => {
    const res = await PATCH(req({ accion: "reject", motivo: "No hay jardín suficiente" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ status: "rejected" });
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].html).toContain("No hay jardín suficiente");
  });

  it("marcar adoptado: animal a adopted y solicitudes pendientes restantes se rechazan con email", async () => {
    state.otherPending = [{ id: "req2", adopter_id: "adopter2" }];
    const res = await PATCH(req({ accion: "complete" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ status: "completed" });
    expect(state.lastAnimalUpdate).toMatchObject({ status: "adopted" });
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("juan@test.com");
  });

  it("404 si no es protectora ni admite acción sobre solicitud ya resuelta más allá de complete", async () => {
    state.request = {
      ...(state.request as Record<string, unknown>),
      status: "withdrawn",
    };
    const res = await PATCH(req({ accion: "approve" }), params);
    expect(res.status).toBe(409);
  });
});
