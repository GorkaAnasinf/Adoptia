import { describe, expect, it } from "vitest";
import { festivosNacionales, viernesSanto } from "./festivos";

describe("viernesSanto", () => {
  // Fechas conocidas (Viernes Santo = 2 días antes del Domingo de Pascua).
  it.each([
    [2024, "2024-03-29"],
    [2025, "2025-04-18"],
    [2026, "2026-04-03"],
    [2027, "2027-03-26"],
  ])("calcula el Viernes Santo de %i", (year, esperado) => {
    expect(viernesSanto(year)).toBe(esperado);
  });
});

describe("festivosNacionales", () => {
  it("incluye los festivos nacionales fijos del año", () => {
    const f = festivosNacionales(2026);
    for (const fecha of [
      "2026-01-01",
      "2026-01-06",
      "2026-05-01",
      "2026-08-15",
      "2026-10-12",
      "2026-11-01",
      "2026-12-06",
      "2026-12-08",
      "2026-12-25",
    ]) {
      expect(f).toContain(fecha);
    }
  });

  it("incluye el Viernes Santo (movible) del año", () => {
    expect(festivosNacionales(2026)).toContain("2026-04-03");
  });

  it("todas las fechas pertenecen al año pedido y no hay duplicados", () => {
    const f = festivosNacionales(2027);
    expect(f.every((d) => d.startsWith("2027-"))).toBe(true);
    expect(new Set(f).size).toBe(f.length);
  });
});
