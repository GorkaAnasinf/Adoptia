import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../../messages/es.json";

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

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

vi.mock("next/og", () => ({
  ImageResponse: vi.fn(function ImageResponseFake(_el: unknown, opts: Record<string, unknown>) {
    return new Response("png-fake", {
      headers: {
        "content-type": "image/png",
        "x-size": `${opts.width}x${opts.height}`,
      },
    });
  }),
}));

import { ImageResponse } from "next/og";
import { GET } from "./route";

const ANIMAL = {
  id: "a1",
  name: "Pipa",
  species: "dog",
  status: "available",
  animal_media: [{ url: "https://example.com/pipa.jpg", is_cover: true, sort_order: 0 }],
  shelters: { name: "Protectora Bilbao", status: "verified" },
};

function req(url = "http://localhost/api/og/social/pipa-abc123") {
  return new Request(url);
}
const params = { params: Promise.resolve({ slug: "pipa-abc123" }) };

describe("GET /api/og/social/[slug]", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: ANIMAL, error: null });
    vi.mocked(ImageResponse).mockClear();
  });

  it("genera 1080×1080 por defecto con los datos del animal y marca Adoptia", async () => {
    const res = await GET(req(), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-size")).toBe("1080x1080");
    const arbol = JSON.stringify(vi.mocked(ImageResponse).mock.calls[0][0]);
    expect(arbol).toContain("Pipa");
    expect(arbol).toContain("Protectora Bilbao");
    expect(arbol).toContain("Adoptia");
    expect(arbol).toContain("https://example.com/pipa.jpg");
  });

  it("con ?f=story genera 1080×1920", async () => {
    const res = await GET(req("http://localhost/api/og/social/pipa-abc123?f=story"), params);
    expect(res.headers.get("x-size")).toBe("1080x1920");
  });

  it("404 si el animal no es público", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const res = await GET(req(), params);
    expect(res.status).toBe(404);
  });
});
