import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    need: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.need }) }),
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST, __resetRateLimitForTests } from "./route";

const NEED_ID = "44444444-4444-4444-8444-444444444444";

function req(body: unknown) {
  return new Request("http://localhost/api/necesidades/contactar", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const AYUDA = {
  need_id: NEED_ID,
  mensaje: "Tengo dos sacos de pienso de cachorro sin abrir, os los acerco",
};

describe("POST /api/necesidades/contactar", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock
      .mockReset()
      .mockResolvedValue({ data: { user: { id: "u1", email: "vecino@test.com" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({ email: null, fullName: "Vecina Ana" });
    state.need = {
      id: NEED_ID,
      descripcion: "Pienso de cachorro",
      categoria: "comida",
      status: "abierta",
      shelters: { name: "Protectora Murcia", email: "prote@test.com" },
    };
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(AYUDA))).status).toBe(401);
  });

  it("422 con mensaje demasiado corto", async () => {
    expect((await POST(req({ need_id: NEED_ID, mensaje: "hola" }))).status).toBe(422);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("404 si la necesidad no existe o no está abierta (RLS la oculta)", async () => {
    state.need = null;
    expect((await POST(req(AYUDA))).status).toBe(404);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("el email va A LA PROTECTORA con el mensaje y Reply-To del remitente", async () => {
    const res = await POST(req(AYUDA));
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("prote@test.com");
    expect(email.replyTo).toBe("vecino@test.com");
    expect(email.html).toContain("Pienso de cachorro");
    expect(email.html).toContain(AYUDA.mensaje);
    expect(email.html).toContain("Vecina Ana");
  });

  it("409 si la protectora no tiene email", async () => {
    state.need = { ...state.need!, shelters: { name: "X", email: null } };
    expect((await POST(req(AYUDA))).status).toBe(409);
  });

  it("429 tras superar el rate limit", async () => {
    for (let i = 0; i < 5; i++) await POST(req(AYUDA));
    expect((await POST(req(AYUDA))).status).toBe(429);
  });
});
