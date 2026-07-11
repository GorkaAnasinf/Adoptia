import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    matches: [] as Record<string, unknown>[],
    favoritosAdoptados: [] as Record<string, unknown>[],
    alertasMarcadas: [] as string[],
    favoritosMarcados: [] as Record<string, unknown>[],
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    rpc: vi.fn(async () => ({ data: state.matches, error: null })),
    from: (tabla: string) => ({
      select: () => ({
        eq: () => ({
          is: async () => ({ data: state.favoritosAdoptados, error: null }),
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        in: (_col: string, ids: string[]) => {
          state.alertasMarcadas.push(...ids);
          return Promise.resolve({ error: null });
        },
        eq: (col: string, v: string) => {
          if (tabla === "favorites") {
            return {
              eq: (col2: string, v2: string) => {
                state.favoritosMarcados.push({ [col]: v, [col2]: v2, ...payload });
                return Promise.resolve({ error: null });
              },
            };
          }
          return Promise.resolve({ error: null });
        },
      }),
    }),
  })),
}));

vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { GET } from "./route";

function req(secret = "s3cr3t") {
  return new Request("http://localhost/api/cron/alertas", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("GET /api/cron/alertas", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockImplementation(async (_a: unknown, id: string) => ({
      email: `${id}@test.com`,
      fullName: id,
    }));
    state.matches = [];
    state.favoritosAdoptados = [];
    state.alertasMarcadas = [];
    state.favoritosMarcados = [];
  });

  afterEach(() => vi.unstubAllEnvs());

  it("401 sin secreto", async () => {
    expect((await GET(req("malo"))).status).toBe(401);
  });

  it("agrupa varias coincidencias del mismo usuario en UN email y marca las alertas", async () => {
    state.matches = [
      { search_id: "s1", user_id: "u1", search_name: "Perros", unsubscribe_token: "tok1", animal_id: "a1", animal_name: "Luna", animal_slug: "luna" },
      { search_id: "s1", user_id: "u1", search_name: "Perros", unsubscribe_token: "tok1", animal_id: "a2", animal_name: "Rocky", animal_slug: "rocky" },
      { search_id: "s2", user_id: "u1", search_name: "Gatos", unsubscribe_token: "tok2", animal_id: "a3", animal_name: "Misu", animal_slug: "misu" },
    ];
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("u1@test.com");
    for (const nombre of ["Luna", "Rocky", "Misu"]) expect(email.html).toContain(nombre);
    expect(email.html).toContain("/alertas/baja?token=tok1");
    expect(new Set(state.alertasMarcadas)).toEqual(new Set(["s1", "s2"]));
  });

  it("usuarios distintos reciben emails separados", async () => {
    state.matches = [
      { search_id: "s1", user_id: "u1", search_name: "A", unsubscribe_token: "t1", animal_id: "a1", animal_name: "Luna", animal_slug: "luna" },
      { search_id: "s2", user_id: "u2", search_name: "B", unsubscribe_token: "t2", animal_id: "a1", animal_name: "Luna", animal_slug: "luna" },
    ];
    await GET(req());
    expect(enviarEmailMock).toHaveBeenCalledTimes(2);
  });

  it("avisa una sola vez de favoritos adoptados y los marca", async () => {
    state.favoritosAdoptados = [
      { user_id: "u3", animal_id: "a9", animals: { name: "Toby", slug: "toby", status: "adopted" } },
    ];
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("u3@test.com");
    expect(enviarEmailMock.mock.calls[0][0].html).toContain("Toby");
    expect(state.favoritosMarcados[0]).toMatchObject({ user_id: "u3", animal_id: "a9" });
  });

  it("sin coincidencias no envía nada", async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });
});
