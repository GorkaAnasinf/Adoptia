import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingleMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: maybeSingleMock })),
      })),
    })),
  })),
}));

// ImageResponse de next/og usa satori + wasm; en tests basta con verificar
// qué se construye, no el render real del PNG.
vi.mock("next/og", () => ({
  ImageResponse: vi.fn(function ImageResponseFake() {
    // Constructor: el objeto devuelto sustituye a la instancia.
    return new Response("png-fake", { headers: { "content-type": "image/png" } });
  }),
}));

import { ImageResponse } from "next/og";
import { GET } from "./route";

const ANIMAL = {
  name: "Pipa",
  species: "dog",
  status: "available",
  animal_media: [
    { url: "https://example.com/otra.jpg", is_cover: false, sort_order: 1 },
    { url: "https://example.com/pipa.jpg", is_cover: true, sort_order: 0 },
  ],
  shelters: { name: "Protectora Bilbao", status: "verified" },
};

function req(slug = "pipa-abc123") {
  return new Request(`http://localhost/api/og/${slug}`);
}

describe("GET /api/og/[slug]", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    vi.mocked(ImageResponse).mockClear();
  });

  it("devuelve una imagen con la foto de portada y el nombre del animal", async () => {
    maybeSingleMock.mockResolvedValue({ data: ANIMAL, error: null });
    const res = await GET(req(), { params: Promise.resolve({ slug: "pipa-abc123" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");

    const arbol = JSON.stringify(vi.mocked(ImageResponse).mock.calls[0][0]);
    expect(arbol).toContain("Pipa");
    expect(arbol).toContain("https://example.com/pipa.jpg");
  });

  it("responde 404 si el animal no existe o no es público", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const res = await GET(req("no-existe"), {
      params: Promise.resolve({ slug: "no-existe" }),
    });
    expect(res.status).toBe(404);
    expect(vi.mocked(ImageResponse)).not.toHaveBeenCalled();
  });

  it("sin foto de portada genera la imagen igualmente (fallback sin <img> externo)", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { ...ANIMAL, animal_media: [] },
      error: null,
    });
    const res = await GET(req(), { params: Promise.resolve({ slug: "pipa-abc123" }) });
    expect(res.status).toBe(200);
    const arbol = JSON.stringify(vi.mocked(ImageResponse).mock.calls[0][0]);
    expect(arbol).toContain("Pipa");
    expect(arbol).not.toContain("example.com");
  });
});
