import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  state: {
    shelter: null as Record<string, unknown> | null,
    animals: [] as Record<string, unknown>[],
    solicitudes: [] as Record<string, unknown>[],
    favoritos: [] as Record<string, unknown>[],
  },
}));

// Builder encadenable que ignora los filtros y resuelve con los datos del state.
function tablaAnimals() {
  const chain = {
    select: () => chain,
    eq: () => chain,
    ilike: () => chain,
    order: () => chain,
    limit: async () => ({ data: state.animals, error: null }),
  };
  return chain;
}
function tablaLista(datos: () => Record<string, unknown>[]) {
  const chain = {
    select: () => chain,
    ilike: () => chain,
    limit: async () => ({ data: datos(), error: null }),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (tabla: string) => {
      if (tabla === "shelters") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }) };
      }
      if (tabla === "animals") return tablaAnimals();
      if (tabla === "adoption_requests") return tablaLista(() => state.solicitudes);
      if (tabla === "favorites") return tablaLista(() => state.favoritos);
      throw new Error(`tabla inesperada: ${tabla}`);
    },
  })),
}));

import { GET } from "./route";

function req(q: string) {
  return new Request(`http://localhost/api/buscar?q=${encodeURIComponent(q)}`);
}

describe("GET /api/buscar", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    state.shelter = null;
    state.animals = [];
    state.solicitudes = [];
    state.favoritos = [];
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await GET(req("luna"))).status).toBe(401);
  });

  it("con término demasiado corto devuelve resultados vacíos sin consultar", async () => {
    const res = await GET(req("a"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.results).toEqual([]);
  });

  it("protectora: devuelve sus animales por nombre con enlace a la ficha", async () => {
    state.shelter = { id: "s1" };
    state.animals = [{ id: "a1", name: "Luna", status: "available" }];
    const res = await GET(req("lun"));
    const { results } = (await res.json()).data;
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      type: "animal",
      title: "Luna",
      href: "/panel/animales/a1",
    });
  });

  it("adoptante: devuelve solicitudes y favoritos por nombre del animal", async () => {
    state.shelter = null;
    state.solicitudes = [{ id: "r1", status: "pending", animals: { name: "Pipa", slug: "pipa-abc" } }];
    state.favoritos = [{ animal_id: "a9", animals: { name: "Pipo", slug: "pipo-xyz" } }];
    const res = await GET(req("pip"));
    const { results } = (await res.json()).data;
    expect(results).toHaveLength(2);
    expect(results.find((r: { type: string }) => r.type === "solicitud")).toMatchObject({
      title: "Pipa",
      href: "/mi-cuenta/solicitudes",
    });
    expect(results.find((r: { type: string }) => r.type === "favorito")).toMatchObject({
      title: "Pipo",
      href: "/animales/pipo-xyz",
    });
  });
});
