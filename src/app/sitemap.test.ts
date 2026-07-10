import { beforeEach, describe, expect, it, vi } from "vitest";

const animalesMock = vi.fn();
const sheltersMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((tabla: string) => ({
      select: vi.fn(() => {
        const resultado = tabla === "animals" ? animalesMock() : sheltersMock();
        return {
          not: vi.fn(() => resultado),
          eq: vi.fn(() => resultado),
        };
      }),
    })),
  })),
}));

import sitemap from "./sitemap";

describe("sitemap.xml", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://adoptia.example");
    animalesMock.mockReturnValue({
      data: [{ slug: "pipa-abc123", updated_at: "2026-07-01T00:00:00Z" }],
      error: null,
    });
    sheltersMock.mockReturnValue({
      data: [{ slug: "protectora-bilbao", updated_at: "2026-06-01T00:00:00Z" }],
      error: null,
    });
  });

  it("incluye rutas estáticas públicas, animales publicados y protectoras verificadas", async () => {
    const entradas = await sitemap();
    const urls = entradas.map((e) => e.url);
    expect(urls).toContain("https://adoptia.example/");
    expect(urls).toContain("https://adoptia.example/animales");
    expect(urls).toContain("https://adoptia.example/mapa");
    expect(urls).toContain("https://adoptia.example/animales/pipa-abc123");
    expect(urls).toContain("https://adoptia.example/protectoras/protectora-bilbao");
  });

  it("no incluye rutas privadas (panel, admin, cuenta)", async () => {
    const entradas = await sitemap();
    const urls = entradas.map((e) => e.url).join(" ");
    expect(urls).not.toContain("/panel");
    expect(urls).not.toContain("/admin");
    expect(urls).not.toContain("/cuenta");
  });

  it("si la BD falla, devuelve al menos las rutas estáticas", async () => {
    animalesMock.mockReturnValue({ data: null, error: new Error("boom") });
    sheltersMock.mockReturnValue({ data: null, error: new Error("boom") });
    const entradas = await sitemap();
    const urls = entradas.map((e) => e.url);
    expect(urls).toContain("https://adoptia.example/animales");
    expect(urls.some((u) => u.includes("/animales/"))).toBe(false);
  });
});
