import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, insertMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  insertMock: vi.fn(),
  state: {
    shelter: null as Record<string, unknown> | null,
    cercanos: [] as Record<string, unknown>[],
    animal: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: vi.fn(async () => ({ data: state.cercanos, error: null })),
    from: (tabla: string) => {
      if (tabla === "foster_proposals") return { insert: insertMock };
      if (tabla === "animals") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: state.animal }) }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }),
        }),
      };
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }),
  })),
}));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST, __resetRateLimitForTests } from "./route";

const FOSTER_ID = "11111111-1111-4111-8111-111111111111";
const ANIMAL_ID = "22222222-2222-4222-8222-222222222222";

function req(body: unknown) {
  return new Request("http://localhost/api/acogida/contactar", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const PROPUESTA = {
  foster_user_id: FOSTER_ID,
  duracion: "2 semanas",
  mensaje: "Camada de cachorros, ¿puedes ayudarnos?",
};

describe("POST /api/acogida/contactar", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "owner1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({ email: "ane@test.com", fullName: "Ane" });
    insertMock.mockReset().mockResolvedValue({ error: null });
    state.shelter = {
      id: "s1",
      name: "Protectora Bilbao",
      email: "prote@test.com",
      phone: "944000001",
      status: "verified",
    };
    state.cercanos = [{ user_id: FOSTER_ID, full_name: "Ane" }];
    state.animal = { id: ANIMAL_ID, name: "Trufa" };
  });

  it("401 sin sesión; 403 si la protectora no está verificada", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(PROPUESTA))).status).toBe(401);

    getUserMock.mockResolvedValue({ data: { user: { id: "owner1" } } });
    state.shelter = { ...state.shelter!, status: "pending" };
    expect((await POST(req(PROPUESTA))).status).toBe(403);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("422 sin duración o sin mensaje", async () => {
    const sinDuracion = await POST(req({ foster_user_id: FOSTER_ID, mensaje: "hola" }));
    expect(sinDuracion.status).toBe(422);
    const sinMensaje = await POST(req({ foster_user_id: FOSTER_ID, duracion: "1 semana" }));
    expect(sinMensaje.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("persiste la propuesta y el email va AL ACOGEDOR con animal, duración y mensaje", async () => {
    const res = await POST(req({ ...PROPUESTA, animal_id: ANIMAL_ID }));
    expect(res.status).toBe(200);

    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      shelter_id: "s1",
      foster_user_id: FOSTER_ID,
      animal_id: ANIMAL_ID,
      duracion: "2 semanas",
      mensaje: PROPUESTA.mensaje,
    });

    expect(enviarEmailMock).toHaveBeenCalledOnce();
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("ane@test.com"); // al acogedor, nunca al revés
    expect(email.html).toContain("Protectora Bilbao");
    expect(email.html).toContain("prote@test.com");
    expect(email.html).toContain("Trufa");
    expect(email.html).toContain("2 semanas");
    expect(email.html).toContain(PROPUESTA.mensaje);
  });

  it("404 si el animal indicado no es de la protectora", async () => {
    state.animal = null;
    const res = await POST(req({ ...PROPUESTA, animal_id: ANIMAL_ID }));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("animal_not_found");
    expect(insertMock).not.toHaveBeenCalled();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("409 proposal_exists si ya hay una propuesta activa con ese acogedor", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });
    const res = await POST(req(PROPUESTA));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("proposal_exists");
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("404 si el acogedor no está en el alcance de la protectora (RPC vacío)", async () => {
    state.cercanos = [];
    const res = await POST(req(PROPUESTA));
    expect(res.status).toBe(404);
    expect(insertMock).not.toHaveBeenCalled();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("429 tras superar el rate limit por protectora", async () => {
    for (let i = 0; i < 10; i++) await POST(req(PROPUESTA));
    const res = await POST(req(PROPUESTA));
    expect(res.status).toBe(429);
  });
});
