import { describe, expect, it } from "vitest";
import {
  animalDraftSchema,
  animalPublishSchema,
  generarSlug,
  validarPublicacion,
} from "./animal";

describe("animalDraftSchema (borrador)", () => {
  it("acepta un borrador con solo el nombre", () => {
    const res = animalDraftSchema.safeParse({ name: "Luna" });
    expect(res.success).toBe(true);
  });

  it("rechaza un borrador sin nombre", () => {
    const res = animalDraftSchema.safeParse({ name: "  " });
    expect(res.success).toBe(false);
  });

  it("acepta compatibilidades tri-estado (true/false/null)", () => {
    const res = animalDraftSchema.safeParse({
      name: "Luna",
      goodWithKids: null,
      goodWithDogs: true,
      goodWithCats: false,
    });
    expect(res.success).toBe(true);
  });
});

describe("animalPublishSchema (publicar)", () => {
  const completo = {
    name: "Luna",
    species: "dog",
    sex: "female",
    size: "medium",
    description: "Perra cariñosa y tranquila.",
  };

  it("acepta una ficha con los mínimos", () => {
    expect(animalPublishSchema.safeParse(completo).success).toBe(true);
  });

  it("rechaza si falta especie, tamaño o descripción", () => {
    for (const campo of ["species", "size", "description"] as const) {
      const parcial = { ...completo };
      delete (parcial as Record<string, unknown>)[campo];
      expect(animalPublishSchema.safeParse(parcial).success).toBe(false);
    }
  });
});

describe("validarPublicacion (incluye fotos)", () => {
  const completo = {
    name: "Luna",
    species: "dog",
    sex: "female",
    size: "medium",
    description: "Perra cariñosa.",
  };

  it("exige al menos una foto", () => {
    const res = validarPublicacion(completo, 0);
    expect(res.ok).toBe(false);
    expect(res.errores).toContain("foto_requerida");
  });

  it("es publicable con mínimos + 1 foto", () => {
    expect(validarPublicacion(completo, 1).ok).toBe(true);
  });
});

describe("generarSlug", () => {
  it("genera nombre-hash6 sin acentos ni símbolos", () => {
    const slug = generarSlug("Río Ñandú!");
    expect(slug).toMatch(/^rio-nandu-[0-9a-f]{6}$/);
  });

  it("dos slugs del mismo nombre difieren en el hash", () => {
    expect(generarSlug("Luna")).not.toBe(generarSlug("Luna"));
  });

  it("nombre vacío usa base por defecto", () => {
    expect(generarSlug("   ")).toMatch(/^animal-[0-9a-f]{6}$/);
  });
});
