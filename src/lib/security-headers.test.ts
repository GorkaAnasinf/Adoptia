import { describe, expect, it } from "vitest";
import { buildCsp, securityHeaders } from "./security-headers";

describe("Content-Security-Policy", () => {
  it("permite las tiles de OpenStreetMap en img-src (mapa Leaflet)", () => {
    const csp = buildCsp(true);
    const imgSrc = csp.split(";").find((d) => d.trim().startsWith("img-src"))!;
    expect(imgSrc).toContain("https://*.tile.openstreetmap.org");
  });

  it("mantiene Supabase en connect-src y en img-src", () => {
    const csp = buildCsp(true);
    expect(csp).toContain("connect-src");
    expect(csp).toContain("https://*.supabase.co");
  });

  it("mantiene Turnstile (Cloudflare) en script-src y frame-src", () => {
    const csp = buildCsp(true);
    expect(csp).toContain("https://challenges.cloudflare.com");
  });

  it("en producción no incluye los hosts del stack local", () => {
    expect(buildCsp(false)).not.toContain("127.0.0.1");
    expect(buildCsp(true)).toContain("127.0.0.1");
  });

  it("expone la cabecera CSP en securityHeaders", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp!.value).toContain("https://*.tile.openstreetmap.org");
  });
});
