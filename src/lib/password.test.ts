import { describe, expect, it } from "vitest";
import { cumpleRequisitos, passwordStrength } from "./password";

describe("cumpleRequisitos", () => {
  it("rechaza si falta algún tipo de carácter o longitud", () => {
    expect(cumpleRequisitos("corta1!")).toBe(false); // <8
    expect(cumpleRequisitos("todominuscula1!")).toBe(false); // sin mayúscula
    expect(cumpleRequisitos("TODOMAYUS1!")).toBe(false); // sin minúscula
    expect(cumpleRequisitos("SinDigitos!!")).toBe(false); // sin dígito
    expect(cumpleRequisitos("SinSimbolo123")).toBe(false); // sin símbolo
  });

  it("acepta una contraseña con los cuatro tipos y 8+ caracteres", () => {
    expect(cumpleRequisitos("Secreta1!")).toBe(true);
  });
});

describe("passwordStrength", () => {
  it("devuelve 0 si no cumple los requisitos", () => {
    expect(passwordStrength("secreta")).toBe(0);
    expect(passwordStrength("Secreta1")).toBe(0); // sin símbolo
  });

  it("devuelve 1 para una contraseña válida corta", () => {
    expect(passwordStrength("Secret1!")).toBe(1);
  });

  it("devuelve 2 para 10+ caracteres válidos", () => {
    expect(passwordStrength("Secreta12!")).toBe(2);
  });

  it("devuelve 3 para 14+ caracteres válidos", () => {
    expect(passwordStrength("Secreta-Larga1!")).toBe(3);
  });
});
