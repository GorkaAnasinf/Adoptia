import { describe, expect, it } from "vitest";
import {
  animalDraftSchema,
  animalPublishSchema,
  animalToRow,
  datosDuplicados,
  esTransicionValida,
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

describe("esTransicionValida", () => {
  it("permite en adopción → reservado → adoptado", () => {
    expect(esTransicionValida("available", "reserved")).toBe(true);
    expect(esTransicionValida("reserved", "adopted")).toBe(true);
  });

  it("rechaza saltar de adoptado a reservado", () => {
    expect(esTransicionValida("adopted", "reserved")).toBe(false);
  });

  it("mantener el mismo estado siempre es válido", () => {
    expect(esTransicionValida("reserved", "reserved")).toBe(true);
  });
});

describe("animalToRow", () => {
  it("mapea camelCase a columnas snake_case y normaliza vacíos", () => {
    const row = animalToRow(
      { name: "Luna", species: "dog", goodWithDogs: true, breed: "  " },
      "s1",
    );
    expect(row.shelter_id).toBe("s1");
    expect(row.good_with_dogs).toBe(true);
    expect(row.breed).toBeNull();
    expect(row.sex).toBe("unknown");
  });

  it("urgent por defecto es false y se respeta cuando se marca", () => {
    expect(animalToRow({ name: "Luna" }, "s1").urgent).toBe(false);
    expect(animalToRow({ name: "Luna", urgent: true }, "s1").urgent).toBe(true);
  });
});

describe("datosDuplicados", () => {
  it("copia todo menos slug, fotos y estado; queda como borrador (copia)", () => {
    const original = {
      id: "a1",
      slug: "luna-abc123",
      name: "Luna",
      species: "dog",
      status: "adopted",
      published_at: "2026-01-01",
      description: "cariñosa",
    };
    const copia = datosDuplicados(original, "s1");
    expect(copia.name).toBe("Luna (copia)");
    expect(copia.status).toBe("available");
    expect(copia.published_at).toBeNull();
    expect(copia.slug).not.toBe(original.slug);
    expect(copia.slug).toMatch(/^luna-[0-9a-f]{6}$/);
    expect(copia).not.toHaveProperty("id");
    expect(copia.description).toBe("cariñosa");
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
