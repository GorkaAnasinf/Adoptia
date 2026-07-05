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
  const base = {
    fullName: "Ana García",
    email: "ana@example.com",
    password: "secreta-123",
    role: "adopter",
    acceptTerms: true,
  };

  it("acepta un registro válido de adoptante", () => {
    expect(registroSchema.safeParse(base).success).toBe(true);
  });

  it("acepta un registro válido de protectora", () => {
    expect(registroSchema.safeParse({ ...base, role: "shelter" }).success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    expect(registroSchema.safeParse({ ...base, fullName: "" }).success).toBe(false);
  });

  it("rechaza roles que no sean adopter o shelter (admin prohibido)", () => {
    expect(registroSchema.safeParse({ ...base, role: "admin" }).success).toBe(false);
  });

  it("rechaza el registro sin aceptar la política de privacidad", () => {
    expect(registroSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
  });
});
