import { describe, expect, it, vi } from "vitest";
import robots from "./robots";

describe("robots.txt", () => {
  it("bloquea panel/admin/cuenta/api y enlaza el sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://adoptia.example");
    const resultado = robots();
    const regla = Array.isArray(resultado.rules) ? resultado.rules[0] : resultado.rules;
    expect(regla?.disallow).toEqual(
      expect.arrayContaining(["/panel", "/admin", "/cuenta", "/api"]),
    );
    expect(regla?.allow).toBe("/");
    expect(resultado.sitemap).toBe("https://adoptia.example/sitemap.xml");
  });
});
