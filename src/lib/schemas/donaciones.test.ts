import { describe, expect, it } from "vitest";
import { contactoDonacionSchema, donacionOfertaSchema } from "./donaciones";

const OFERTA = {
  categoria: "comida",
  descripcion: "Dos sacos de pienso sin abrir y un transportín mediano",
  city: "Bilbao",
  radius_km: 25,
};

describe("donacionOfertaSchema (FEATURE-032)", () => {
  it("acepta una oferta válida", () => {
    expect(donacionOfertaSchema.safeParse(OFERTA).success).toBe(true);
  });

  it("rechaza categoría desconocida, descripción vacía o demasiado larga y radio fuera de rango", () => {
    expect(donacionOfertaSchema.safeParse({ ...OFERTA, categoria: "dinero" }).success).toBe(false);
    expect(donacionOfertaSchema.safeParse({ ...OFERTA, descripcion: "  " }).success).toBe(false);
    expect(
      donacionOfertaSchema.safeParse({ ...OFERTA, descripcion: "x".repeat(1001) }).success,
    ).toBe(false);
    expect(donacionOfertaSchema.safeParse({ ...OFERTA, radius_km: 0 }).success).toBe(false);
    expect(donacionOfertaSchema.safeParse({ ...OFERTA, radius_km: 500 }).success).toBe(false);
  });
});

describe("contactoDonacionSchema (FEATURE-032)", () => {
  const CONTACTO = {
    offer_id: "44444444-4444-4444-8444-444444444444",
    mensaje: "Nos interesa el pienso, ¿podéis acercarlo el sábado?",
  };

  it("acepta un contacto válido", () => {
    expect(contactoDonacionSchema.safeParse(CONTACTO).success).toBe(true);
  });

  it("rechaza offer_id no uuid y mensaje corto o desmedido", () => {
    expect(contactoDonacionSchema.safeParse({ ...CONTACTO, offer_id: "123" }).success).toBe(false);
    expect(contactoDonacionSchema.safeParse({ ...CONTACTO, mensaje: "hola" }).success).toBe(false);
    expect(
      contactoDonacionSchema.safeParse({ ...CONTACTO, mensaje: "x".repeat(1001) }).success,
    ).toBe(false);
  });
});
