import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  extraerTOC,
  leerGuia,
  listarGuias,
  minutosDeLectura,
  parseFrontmatter,
  slugDeTitulo,
} from "./guias";

describe("parseFrontmatter", () => {
  it("separa metadatos y cuerpo", () => {
    const { meta, cuerpo } = parseFrontmatter("---\ntitulo: Hola\ncategoria: Test\n---\nCuerpo aquí");
    expect(meta.titulo).toBe("Hola");
    expect(meta.categoria).toBe("Test");
    expect(cuerpo).toBe("Cuerpo aquí");
  });

  it("sin frontmatter devuelve todo como cuerpo", () => {
    const { meta, cuerpo } = parseFrontmatter("Solo texto");
    expect(meta).toEqual({});
    expect(cuerpo).toBe("Solo texto");
  });
});

describe("minutosDeLectura", () => {
  it("~200 palabras por minuto, mínimo 1", () => {
    expect(minutosDeLectura("hola mundo")).toBe(1);
    expect(minutosDeLectura(Array(600).fill("palabra").join(" "))).toBe(3);
  });
});

describe("guías reales (src/content/guias)", () => {
  it("hay al menos 4 guías con metadatos completos", () => {
    const guias = listarGuias();
    expect(guias.length).toBeGreaterThanOrEqual(4);
    for (const g of guias) {
      expect(g.titulo.length).toBeGreaterThan(5);
      expect(g.descripcion.length).toBeGreaterThan(20);
      expect(g.categoria.length).toBeGreaterThan(2);
      expect(g.minutosLectura).toBeGreaterThanOrEqual(1);
    }
  });

  it("leerGuia carga una guía por slug y rechaza slugs sospechosos", () => {
    const primera = listarGuias()[0];
    const guia = leerGuia(primera.slug);
    expect(guia?.cuerpo.length).toBeGreaterThan(200);
    expect(leerGuia("../../../etc/passwd")).toBeNull();
    expect(leerGuia("no-existe")).toBeNull();
  });

  it("toda guía tiene TOC (h2) y su id es un ancla válida", () => {
    for (const g of listarGuias()) {
      const toc = extraerTOC(leerGuia(g.slug)!.cuerpo);
      expect(toc.length).toBeGreaterThanOrEqual(2);
      for (const h of toc) expect(h.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe("slugDeTitulo", () => {
  it("normaliza acentos y símbolos", () => {
    expect(slugDeTitulo("¿Cuánto cuesta? ¡Mucho!")).toBe("cuanto-cuesta-mucho");
  });
});
