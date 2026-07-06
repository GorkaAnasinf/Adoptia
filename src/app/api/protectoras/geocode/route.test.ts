import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock del cliente SSR (sesión) ---
const getUserMock = vi.fn();
const profileRoleMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: profileRoleMock })),
      })),
    })),
  })),
}));

// --- Mock del cliente admin (caché) ---
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

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/protectoras/geocode", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const bodyValido = {
  address: "Calle Mayor 1",
  city: "Bilbao",
  province: "Bizkaia",
  postalCode: "48001",
};

describe("POST /api/protectoras/geocode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    profileRoleMock.mockResolvedValue({ data: { role: "shelter" } });
    cacheSelectSingle.mockResolvedValue({ data: null });
    cacheUpsert.mockResolvedValue({ error: null });
  });

  it("401 si no hay sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest(bodyValido));
    expect(res.status).toBe(401);
  });

  it("403 si el usuario no es protectora", async () => {
    profileRoleMock.mockResolvedValue({ data: { role: "adopter" } });
    const res = await POST(makeRequest(bodyValido));
    expect(res.status).toBe(403);
  });

  it("422 si el cuerpo es inválido", async () => {
    const res = await POST(makeRequest({ address: "" }));
    expect(res.status).toBe(422);
  });

  it("geocodifica con Nominatim y cachea el resultado", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([{ lat: "43.263", lon: "-2.935" }]), {
          status: 200,
        }),
      );
    const res = await POST(makeRequest(bodyValido));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.lat).toBeCloseTo(43.263);
    expect(json.data.lng).toBeCloseTo(-2.935);
    expect(json.data.source).toBe("nominatim");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(cacheUpsert).toHaveBeenCalledOnce();
  });

  it("usa la caché en la segunda llamada sin tocar Nominatim", async () => {
    cacheSelectSingle.mockResolvedValue({
      data: { lat: 43.263, lng: -2.935 },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const res = await POST(makeRequest(bodyValido));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.source).toBe("cache");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve lat/lng null (200) si Nominatim no encuentra la dirección", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    const res = await POST(makeRequest(bodyValido));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.lat).toBeNull();
    expect(json.data.lng).toBeNull();
    expect(cacheUpsert).not.toHaveBeenCalled();
  });
});
