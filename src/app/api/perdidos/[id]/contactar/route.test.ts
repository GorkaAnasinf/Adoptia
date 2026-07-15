import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: { aviso: null as Record<string, unknown> | null },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.aviso }) }),
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST, __resetRateLimitForTests } from "./route";

const AVISO_ID = "22222222-2222-4222-8222-222222222222";
const MENSAJE = "Creo que he visto a tu perra esta mañana cerca del río.";

function req(body: unknown) {
  return new Request(`http://localhost/api/perdidos/${AVISO_ID}/contactar`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const ctx = { params: Promise.resolve({ id: AVISO_ID }) };

describe("POST /api/perdidos/[id]/contactar", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock.mockReset().mockResolvedValue({
      data: { user: { id: "vecino1", email: "vecino@test.com" } },
    });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({
      email: "autor@test.com",
      fullName: "Miren",
    });
    state.aviso = {
      id: AVISO_ID,
      user_id: "autor1",
      name: "Kira",
      type: "lost",
      status: "open",
      allow_contact: true,
    };
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req({ mensaje: MENSAJE }), ctx)).status).toBe(401);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("422 si el mensaje es demasiado corto o falta", async () => {
    expect((await POST(req({ mensaje: "hola" }), ctx)).status).toBe(422);
    expect((await POST(req({}), ctx)).status).toBe(422);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("404 si el aviso no existe o no es visible", async () => {
    state.aviso = null;
    expect((await POST(req({ mensaje: MENSAJE }), ctx)).status).toBe(404);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("409 si el aviso no está abierto o el autor no quiere que le escriban", async () => {
    state.aviso = { ...state.aviso!, status: "archived" };
    expect((await POST(req({ mensaje: MENSAJE }), ctx)).status).toBe(409);

    state.aviso = { ...state.aviso!, status: "open", allow_contact: false };
    const res = await POST(req({ mensaje: MENSAJE }), ctx);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("contacto_cerrado");
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("el mensaje llega AL AUTOR y su email no se devuelve al llamante", async () => {
    const res = await POST(req({ mensaje: MENSAJE }), ctx);
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("autor@test.com");
    expect(email.replyTo).toBe("vecino@test.com"); // el remitente cede el suyo
    expect(email.html).toContain("Kira");
    expect(email.html).toContain("río");

    const cuerpo = JSON.stringify(await res.json());
    expect(cuerpo).not.toContain("autor@test.com");
  });

  it("escapa el HTML del mensaje (no se inyecta markup en el email)", async () => {
    await POST(req({ mensaje: `<img src=x onerror=alert(1)> lo vi en el parque` }), ctx);
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img");
  });

  it("429 al superar 5 mensajes por hora", async () => {
    for (let i = 0; i < 5; i++) await POST(req({ mensaje: MENSAJE }), ctx);
    const res = await POST(req({ mensaje: MENSAJE }), ctx);
    expect(res.status).toBe(429);
    expect(enviarEmailMock).toHaveBeenCalledTimes(5);
  });

  it("502 si el email no sale", async () => {
    enviarEmailMock.mockRejectedValue(new Error("smtp caído"));
    expect((await POST(req({ mensaje: MENSAJE }), ctx)).status).toBe(502);
  });
});
