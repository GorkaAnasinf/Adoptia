import { describe, expect, it } from "vitest";
import { passwordStrength } from "./password";

describe("passwordStrength", () => {
  it("devuelve 0 para contraseñas de menos de 8 caracteres", () => {
    expect(passwordStrength("corta")).toBe(0);
  });

  it("devuelve 1 para 8+ caracteres de un solo tipo", () => {
    expect(passwordStrength("aaaaaaaa")).toBe(1);
  });

  it("devuelve 2 al mezclar letras y números", () => {
    expect(passwordStrength("secreta123")).toBe(2);
  });

  it("devuelve 3 con 12+ caracteres mezclando tipos", () => {
    expect(passwordStrength("Secreta-123-Larga")).toBe(3);
  });
});
