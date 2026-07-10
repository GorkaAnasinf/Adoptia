import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheSelectSingle = vi.fn();
const cacheUpsert = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: cacheSelectSingle })),
      })),
      upsert: cacheUpsert,
    })),
  })),
}));

import { GET, __resetRateLimitForTests } from "./route";

function makeRequest(q: string | null, ip = "203.0.113.1") {
  const url = q === null ? "http://localhost:3000/api/geocode" : `http://localhost:3000/api/geocode?q=${encodeURIComponent(q)}`;
  return new Request(url, { headers: { "x-forwarded-for": ip } });
}

describe("GET /api/geocode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    __resetRateLimitForTests();
    cacheSelectSingle.mockResolvedValue({ data: null });
    cacheUpsert.mockResolvedValue({ error: null });
  });

  it("422 si falta el parámetro q", async () => {
    const res = await GET(makeRequest(null));
    expect(res.status).toBe(422);
  });

  it("422 si q está vacío", async () => {
    const res = await GET(makeRequest("   "));
    expect(res.status).toBe(422);
  });

  it("geocodifica con Nominatim y cachea el resultado", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify([{ lat: "43.263", lon: "-2.935" }]), { status: 200 }));
    const res = await GET(makeRequest("Bilbao"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.lat).toBeCloseTo(43.263);
    expect(json.data.lng).toBeCloseTo(-2.935);
    expect(json.data.source).toBe("nominatim");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(cacheUpsert).toHaveBeenCalledOnce();
  });

  it("usa la caché en la segunda llamada sin tocar Nominatim", async () => {
    cacheSelectSingle.mockResolvedValue({ data: { lat: 43.263, lng: -2.935 } });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const res = await GET(makeRequest("Bilbao", "203.0.113.2"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.source).toBe("cache");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve lat/lng null (200) si Nominatim no encuentra la ciudad", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    const res = await GET(makeRequest("Ciudad Inventada Xyz", "203.0.113.3"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.lat).toBeNull();
    expect(json.data.lng).toBeNull();
    expect(cacheUpsert).not.toHaveBeenCalled();
  });

  it("no lanza si Nominatim falla: trata como no encontrado", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const res = await GET(makeRequest("Bilbao", "203.0.113.4"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.lat).toBeNull();
  });

  it("429 al superar el límite de peticiones por IP", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([{ lat: "43.263", lon: "-2.935" }]), { status: 200 }));
    const ip = "203.0.113.5";
    let ultimo: Response | undefined;
    for (let i = 0; i < 25; i++) {
      ultimo = await GET(makeRequest(`Bilbao ${i}`, ip));
    }
    expect(ultimo?.status).toBe(429);
  });

  it("una IP distinta no se ve afectada por el límite de otra", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([{ lat: "43.263", lon: "-2.935" }]), { status: 200 }));
    for (let i = 0; i < 25; i++) {
      await GET(makeRequest(`Bilbao ${i}`, "203.0.113.6"));
    }
    const res = await GET(makeRequest("Madrid", "203.0.113.7"));
    expect(res.status).toBe(200);
  });
});
