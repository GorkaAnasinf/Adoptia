import { describe, expect, it } from "vitest";
import { matchProvincia, PROVINCIAS } from "./provincias";

describe("matchProvincia", () => {
  it("reconoce una provincia exacta (ignorando acentos/mayúsculas)", () => {
    expect(matchProvincia("navarra")).toBe("Navarra");
    expect(matchProvincia("BIZKAIA")).toBe("Bizkaia");
  });

  it("descarta comarcas o valores que no son provincia", () => {
    expect(matchProvincia("Iruñerria")).toBe("");
    expect(matchProvincia("Comunidad Foral")).toBe("");
    expect(matchProvincia("")).toBe("");
    expect(matchProvincia(null)).toBe("");
  });

  it("extrae la provincia contenida en un texto más largo", () => {
    expect(matchProvincia("Provincia de Sevilla")).toBe("Sevilla");
  });

  it("la lista tiene 52 provincias", () => {
    expect(PROVINCIAS).toHaveLength(52);
  });
});
