import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, rpcMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  rpcMock: vi.fn(),
  state: {
    shelter: null as Record<string, unknown> | null,
    donorRow: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }),
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.donorRow }) }),
      }),
    }),
  })),
}));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST, __resetRateLimitForTests } from "./route";

const OFFER_ID = "55555555-5555-4555-8555-555555555555";

function req(body: unknown) {
  return new Request("http://localhost/api/donaciones/contactar", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const CONTACTO = {
  offer_id: OFFER_ID,
  mensaje: "Nos interesa el pienso, ¿podemos pasar a recogerlo el sábado?",
};

describe("POST /api/donaciones/contactar", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock
      .mockReset()
      .mockResolvedValue({ data: { user: { id: "prot-1", email: "prot@test.com" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock
      .mockReset()
      .mockResolvedValue({ email: "donante@test.com", fullName: "Dani Donante" });
    rpcMock.mockReset().mockResolvedValue({
      data: [
        {
          id: OFFER_ID,
          full_name: "Dani Donante",
          categoria: "comida",
          descripcion: "Dos sacos de pienso sin abrir",
          city: "Bilbao",
          distance_km: 3.2,
        },
      ],
    });
    state.shelter = {
      id: "sh-1",
      name: "Refugio Esperanza",
      email: "refugio@test.com",
      phone: "600111222",
      status: "verified",
    };
    state.donorRow = { user_id: "don-1" };
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(CONTACTO))).status).toBe(401);
  });

  it("403 si el llamante no tiene protectora verificada", async () => {
    state.shelter = { ...state.shelter!, status: "pending" };
    expect((await POST(req(CONTACTO))).status).toBe(403);
    state.shelter = null;
    expect((await POST(req(CONTACTO))).status).toBe(403);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("422 con mensaje demasiado corto", async () => {
    expect((await POST(req({ offer_id: OFFER_ID, mensaje: "hola" }))).status).toBe(422);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("404 si la oferta no está al alcance de la protectora (RPC no la devuelve)", async () => {
    rpcMock.mockResolvedValue({ data: [] });
    expect((await POST(req(CONTACTO))).status).toBe(404);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("el email va AL DONANTE con los datos de la protectora y Reply-To de la protectora", async () => {
    const res = await POST(req(CONTACTO));
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("donante@test.com");
    expect(email.replyTo).toBe("refugio@test.com");
    expect(email.html).toContain("Refugio Esperanza");
    expect(email.html).toContain(CONTACTO.mensaje);
    expect(email.html).toContain("Dos sacos de pienso sin abrir");
  });

  it("409 si el donante no tiene email", async () => {
    obtenerContactoMock.mockResolvedValue({ email: null, fullName: null });
    expect((await POST(req(CONTACTO))).status).toBe(409);
  });

  it("502 si el email falla", async () => {
    enviarEmailMock.mockRejectedValue(new Error("smtp caído"));
    expect((await POST(req(CONTACTO))).status).toBe(502);
  });

  it("429 tras superar el rate limit", async () => {
    for (let i = 0; i < 10; i++) await POST(req(CONTACTO));
    expect((await POST(req(CONTACTO))).status).toBe(429);
  });
});
