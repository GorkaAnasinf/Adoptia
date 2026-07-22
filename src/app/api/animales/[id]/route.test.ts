import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  state: {
    // animal completo y publicable por defecto
    animal: {
      id: "a1",
      name: "Luna",
      species: "dog",
      sex: "female",
      size: "medium",
      description: "Perra dulce y sociable.",
      published_at: null,
      shelters: { status: "verified" },
      animal_media: [{ type: "photo" }],
    } as Record<string, unknown> | null,
    lastUpdate: null as Record<string, unknown> | null,
    deleted: false,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.animal }) }) }),
      update: (payload: Record<string, unknown>) => ({
        eq: () => ({ select: () => ({ maybeSingle: async () => {
          state.lastUpdate = payload;
          return { data: state.animal ? { id: "a1" } : null };
        } }) }),
      }),
      delete: () => ({
        eq: () => ({ select: () => ({ maybeSingle: async () => {
          state.deleted = true;
          return { data: state.animal ? { id: "a1" } : null };
        } }) }),
      }),
    }),
  })),
}));

import { DELETE, PATCH } from "./route";

function patchReq(body: unknown) {
  return new Request("http://localhost/api/animales/a1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = { params: Promise.resolve({ id: "a1" }) };

describe("/api/animales/[id]", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    state.animal = {
      id: "a1", name: "Luna", species: "dog", sex: "female", size: "medium",
      description: "Perra dulce y sociable.", published_at: null,
      shelters: { status: "verified" }, animal_media: [{ type: "photo" }],
    };
    state.lastUpdate = null;
    state.deleted = false;
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(patchReq({ accion: "unpublish" }), params);
    expect(res.status).toBe(401);
  });

  it("400 con body inválido", async () => {
    const res = await PATCH(patchReq({ accion: "nope" }), params);
    expect(res.status).toBe(400);
  });

  it("PATCH unpublish pone published_at a null", async () => {
    state.animal!.published_at = "2026-01-01";
    const res = await PATCH(patchReq({ accion: "unpublish" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ published_at: null });
  });

  it("PATCH publish con protectora no verificada → 403", async () => {
    state.animal!.shelters = { status: "pending" };
    const res = await PATCH(patchReq({ accion: "publish" }), params);
    expect(res.status).toBe(403);
    expect(state.lastUpdate).toBeNull();
  });

  it("PATCH publish con ficha incompleta (sin foto) → 422", async () => {
    state.animal!.animal_media = [];
    const res = await PATCH(patchReq({ accion: "publish" }), params);
    expect(res.status).toBe(422);
    expect(state.lastUpdate).toBeNull();
  });

  it("PATCH publish válido pone published_at no nulo", async () => {
    const res = await PATCH(patchReq({ accion: "publish" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate!.published_at).not.toBeNull();
  });

  it("404 si el animal no existe / no es suyo", async () => {
    state.animal = null;
    const res = await PATCH(patchReq({ accion: "unpublish" }), params);
    expect(res.status).toBe(404);
  });

  it("DELETE borra el animal", async () => {
    const res = await DELETE(new Request("http://localhost/api/animales/a1", { method: "DELETE" }), params);
    expect(res.status).toBe(200);
    expect(state.deleted).toBe(true);
  });
});
