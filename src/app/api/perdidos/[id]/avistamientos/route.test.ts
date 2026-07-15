import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    aviso: null as Record<string, unknown> | null,
    insertado: null as Record<string, unknown> | null,
    insertError: null as { message: string } | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (tabla: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.aviso }) }),
      }),
      insert: (fila: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            if (state.insertError) return { data: null, error: state.insertError };
            state.insertado = { tabla, ...fila };
            return { data: { id: "s1", ...fila }, error: null };
          },
        }),
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST, __resetRateLimitForTests } from "./route";

const AVISO_ID = "22222222-2222-4222-8222-222222222222";

function cuerpo(extra: Record<string, unknown> = {}) {
  return {
    lat: 43.2673891,
    lng: -2.9401237,
    seen_at: new Date(Date.now() - 3600_000).toISOString(),
    nota: "Bebiendo en la fuente del parque",
    ...extra,
  };
}

function req(body: unknown) {
  return new Request(`http://localhost/api/perdidos/${AVISO_ID}/avistamientos`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const ctx = { params: Promise.resolve({ id: AVISO_ID }) };

describe("POST /api/perdidos/[id]/avistamientos", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "vecino1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({
      email: "autor@test.com",
      fullName: "Miren",
    });
    state.aviso = { id: AVISO_ID, user_id: "autor1", name: "Kira", type: "lost", status: "open" };
    state.insertado = null;
    state.insertError = null;
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(cuerpo()), ctx)).status).toBe(401);
    expect(state.insertado).toBeNull();
  });

  it("422 con coordenadas fuera de rango o fecha futura", async () => {
    expect((await POST(req(cuerpo({ lat: 120 })), ctx)).status).toBe(422);
    expect((await POST(req(cuerpo({ lng: 200 })), ctx)).status).toBe(422);
    expect(
      (await POST(req(cuerpo({ seen_at: new Date(Date.now() + 86_400_000).toISOString() })), ctx))
        .status,
    ).toBe(422);
    expect(state.insertado).toBeNull();
  });

  it("422 si el avistamiento es de hace más de 90 días", async () => {
    const viejo = new Date(Date.now() - 91 * 24 * 3600 * 1000).toISOString();
    expect((await POST(req(cuerpo({ seen_at: viejo })), ctx)).status).toBe(422);
  });

  it("404 si el aviso no existe; 409 si no está abierto", async () => {
    state.aviso = null;
    expect((await POST(req(cuerpo()), ctx)).status).toBe(404);

    state.aviso = { id: AVISO_ID, user_id: "autor1", name: "Kira", type: "lost", status: "resolved" };
    expect((await POST(req(cuerpo()), ctx)).status).toBe(409);
    expect(state.insertado).toBeNull();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("201: guarda el avistamiento a nombre del llamante y avisa al autor", async () => {
    const res = await POST(req(cuerpo()), ctx);
    expect(res.status).toBe(201);
    expect(state.insertado!.tabla).toBe("lost_found_sightings");
    expect(state.insertado!.user_id).toBe("vecino1");
    expect(state.insertado!.post_id).toBe(AVISO_ID);
    expect(state.insertado!.location).toBe("POINT(-2.9401237 43.2673891)");

    expect(enviarEmailMock).toHaveBeenCalledOnce();
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("autor@test.com");
    expect(email.html).toContain("Kira");
    expect(email.html).toContain("fuente del parque");

    // Ni el email del autor ni la identidad del reportante viajan de vuelta.
    expect(JSON.stringify(await res.json())).not.toContain("autor@test.com");
  });

  it("el avistamiento se guarda aunque el email al autor falle", async () => {
    enviarEmailMock.mockRejectedValue(new Error("smtp caído"));
    const res = await POST(req(cuerpo()), ctx);
    expect(res.status).toBe(201);
    expect(state.insertado).not.toBeNull();
  });

  it("429 al superar 3 avistamientos por hora", async () => {
    for (let i = 0; i < 3; i++) await POST(req(cuerpo()), ctx);
    expect((await POST(req(cuerpo()), ctx)).status).toBe(429);
  });
});
