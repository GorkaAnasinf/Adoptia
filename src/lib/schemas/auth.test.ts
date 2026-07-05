import { describe, expect, it } from "vitest";
import { loginSchema, registroSchema } from "./auth";

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    const r = loginSchema.safeParse({
      email: "hola@example.com",
      password: "secreta-123",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza un email inválido", () => {
    const r = loginSchema.safeParse({ email: "no-es-email", password: "x".repeat(8) });
    expect(r.success).toBe(false);
  });

  it("rechaza contraseñas de menos de 8 caracteres", () => {
    const r = loginSchema.safeParse({ email: "hola@example.com", password: "corta" });
    expect(r.success).toBe(false);
  });
});

describe("registroSchema", () => {
  it("acepta un registro válido", () => {
    const r = registroSchema.safeParse({
      fullName: "Ana García",
      email: "ana@example.com",
      password: "secreta-123",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const r = registroSchema.safeParse({
      fullName: "",
      email: "ana@example.com",
      password: "secreta-123",
    });
    expect(r.success).toBe(false);
  });
});
