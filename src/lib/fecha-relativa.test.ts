import { describe, expect, it } from "vitest";
import { fechaRelativa } from "./fecha-relativa";

describe("fechaRelativa", () => {
  const ahora = new Date("2026-07-13T12:00:00Z");
  const dias = (n: number) =>
    new Date(ahora.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  it("hoy cuando es el mismo día", () => {
    expect(fechaRelativa(dias(0), ahora)).toBe("hoy");
  });

  it("ayer para un día atrás", () => {
    expect(fechaRelativa(dias(1), ahora)).toBe("ayer");
  });

  it("hace N días para menos de un mes", () => {
    expect(fechaRelativa(dias(2), ahora)).toBe("hace 2 días");
    expect(fechaRelativa(dias(10), ahora)).toBe("hace 10 días");
  });

  it("hace N meses a partir de ~30 días", () => {
    expect(fechaRelativa(dias(60), ahora)).toBe("hace 2 meses");
  });

  it("hace N años a partir de ~365 días", () => {
    expect(fechaRelativa(dias(400), ahora)).toBe("hace 1 año");
  });

  it("cadena vacía para fecha inválida o nula", () => {
    expect(fechaRelativa("", ahora)).toBe("");
    expect(fechaRelativa("no-es-fecha", ahora)).toBe("");
  });
});
