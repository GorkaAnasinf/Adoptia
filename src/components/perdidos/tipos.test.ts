import { describe, expect, it } from "vitest";
import { COLOR_AVISO } from "./tipos";

describe("COLOR_AVISO", () => {
  it("usa los roles del design system: granate para perdido, teal para encontrado", () => {
    // FEATURE-038: badge y marcador del mapa cuentan la misma historia.
    expect(COLOR_AVISO.lost).toBe("#9f402d");
    expect(COLOR_AVISO.found).toBe("#396662");
  });
});
