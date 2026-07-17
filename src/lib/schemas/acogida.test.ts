import { describe, expect, it } from "vitest";
import { propuestaAcogidaSchema } from "./acogida";

const VALIDA = {
  foster_user_id: "11111111-1111-4111-8111-111111111111",
  duracion: "2 semanas",
  mensaje: "Camada de cachorros",
};

describe("propuestaAcogidaSchema", () => {
  it("acepta una propuesta válida, con o sin animal", () => {
    expect(propuestaAcogidaSchema.safeParse(VALIDA).success).toBe(true);
    expect(
      propuestaAcogidaSchema.safeParse({
        ...VALIDA,
        animal_id: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(true);
  });

  it("rechaza sin duración, sin mensaje o con ids inválidos", () => {
    expect(propuestaAcogidaSchema.safeParse({ ...VALIDA, duracion: "  " }).success).toBe(false);
    expect(propuestaAcogidaSchema.safeParse({ ...VALIDA, mensaje: "" }).success).toBe(false);
    expect(propuestaAcogidaSchema.safeParse({ ...VALIDA, foster_user_id: "nope" }).success).toBe(
      false,
    );
    expect(propuestaAcogidaSchema.safeParse({ ...VALIDA, animal_id: "nope" }).success).toBe(false);
  });

  it("recorta y limita longitudes (120 duración, 1000 mensaje)", () => {
    const parsed = propuestaAcogidaSchema.parse({ ...VALIDA, duracion: "  1 mes  " });
    expect(parsed.duracion).toBe("1 mes");
    expect(
      propuestaAcogidaSchema.safeParse({ ...VALIDA, duracion: "x".repeat(121) }).success,
    ).toBe(false);
    expect(
      propuestaAcogidaSchema.safeParse({ ...VALIDA, mensaje: "x".repeat(1001) }).success,
    ).toBe(false);
  });
});
