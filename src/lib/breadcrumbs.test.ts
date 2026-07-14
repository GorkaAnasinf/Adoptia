import { describe, expect, it } from "vitest";
import { crumbsFromPathname } from "./breadcrumbs";

// t simulada: devuelve la clave (para asertar el mapeo)
const t = (k: string) => k;

describe("crumbsFromPathname", () => {
  it("/panel → una miga (Panel), sin enlace en la última", () => {
    const c = crumbsFromPathname("/panel", t);
    expect(c).toEqual([{ label: "crumbPanel" }]);
  });

  it("/panel/alta → Panel (con enlace) › Alta", () => {
    const c = crumbsFromPathname("/panel/alta", t);
    expect(c).toEqual([
      { label: "crumbPanel", href: "/panel" },
      { label: "crumbAlta" },
    ]);
  });

  it("/admin/protectoras → Administración › Protectoras", () => {
    const c = crumbsFromPathname("/admin/protectoras", t);
    expect(c).toEqual([
      { label: "crumbAdmin", href: "/admin" },
      { label: "crumbProtectoras" },
    ]);
  });

  it("segmento desconocido cae al propio segmento", () => {
    const c = crumbsFromPathname("/panel/xyz", t);
    expect(c[1]).toEqual({ label: "xyz" });
  });

  it("mapea segmentos públicos (animales, mapa, perdidos-encontrados, guias)", () => {
    expect(crumbsFromPathname("/animales", t)).toEqual([{ label: "crumbAnimales" }]);
    expect(crumbsFromPathname("/mapa", t)).toEqual([{ label: "crumbMapa" }]);
    expect(crumbsFromPathname("/perdidos-encontrados", t)).toEqual([{ label: "crumbPerdidos" }]);
    expect(crumbsFromPathname("/guias", t)).toEqual([{ label: "crumbGuias" }]);
  });
});
