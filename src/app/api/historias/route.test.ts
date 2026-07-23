import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, insertMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
  state: {
    adopcion: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (tabla: string) => {
      if (tabla === "adoption_stories") return { insert: insertMock };
      // adoption_requests: select().eq().eq().eq().maybeSingle()
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: state.adopcion }) }),
            }),
          }),
        }),
      };
    },
  })),
}));

import { POST } from "./route";

const ANIMAL_ID = "22222222-2222-4222-8222-222222222222";

function req(body: unknown) {
  return new Request("http://localhost/api/historias", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const HISTORIA = {
  animal_id: ANIMAL_ID,
  quote: "Llegó asustada y hoy es la reina del sofá.",
  consent: true,
};

describe("POST /api/historias", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "adopter1" } } });
    insertMock.mockReset().mockResolvedValue({ error: null });
    state.adopcion = { id: "r1", animals: { shelter_id: "s1" } };
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(HISTORIA))).status).toBe(401);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("422 sin consentimiento o con frase demasiado corta", async () => {
    expect((await POST(req({ ...HISTORIA, consent: false }))).status).toBe(422);
    expect((await POST(req({ ...HISTORIA, quote: "corta" }))).status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("403 si no hay adopción completada del usuario para ese animal", async () => {
    state.adopcion = null;
    const res = await POST(req(HISTORIA));
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("forbidden");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("crea la historia pendiente con el shelter_id del animal adoptado", async () => {
    const res = await POST(req(HISTORIA));
    expect(res.status).toBe(201);
    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      animal_id: ANIMAL_ID,
      adopter_id: "adopter1",
      shelter_id: "s1",
      quote: HISTORIA.quote,
      consent: true,
    });
  });

  it("409 story_exists si ya compartió una historia de ese animal", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });
    const res = await POST(req(HISTORIA));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("story_exists");
  });
});
