import { beforeEach, describe, expect, it, vi } from "vitest";

const { maybeSingleMock, upsertMock } = vi.hoisted(() => ({
  maybeSingleMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      upsert: upsertMock,
    }),
  })),
}));

import { buscarCiudad } from "./geocode-ciudad";

describe("buscarCiudad", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: null });
    upsertMock.mockReset().mockResolvedValue({ error: null });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([{ lat: "37.98", lon: "-1.13" }]))),
    );
  });

  it("devuelve la caché sin llamar a Nominatim", async () => {
    maybeSingleMock.mockResolvedValue({ data: { lat: 43.26, lng: -2.94 } });
    const r = await buscarCiudad("Bilbao");
    expect(r).toEqual({ lat: 43.26, lng: -2.94 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sin caché consulta Nominatim (host fijo) y guarda el resultado", async () => {
    const r = await buscarCiudad("  Murcia  Centro ");
    expect(r).toEqual({ lat: 37.98, lng: -1.13 });
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("nominatim.openstreetmap.org");
    expect(url).toContain("murcia%20centro");
    expect(upsertMock).toHaveBeenCalledWith(
      { query_norm: "murcia centro", lat: 37.98, lng: -1.13 },
      { onConflict: "query_norm" },
    );
  });

  it("ciudad desconocida o red caída → null, nunca lanza", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]))));
    expect(await buscarCiudad("Xyzland")).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("down"))));
    expect(await buscarCiudad("Bilbao")).toBeNull();

    expect(await buscarCiudad("   ")).toBeNull();
  });
});
