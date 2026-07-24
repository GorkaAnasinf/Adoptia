import { describe, expect, it } from "vitest";
import {
  cifValido,
  entidadSchema,
  perfilSchema,
  socialLinksSchema,
  ubicacionSchema,
} from "./shelter";

describe("cifValido", () => {
  it("acepta un CIF español con dígito de control correcto", () => {
    // B (S.L., control numérico) + 9800000 → control 3
    expect(cifValido("B98000003")).toBe(true);
  });

  it("acepta CIF en minúsculas y con espacios alrededor", () => {
    expect(cifValido("  b98000003 ")).toBe(true);
  });

  it("rechaza CIF con dígito de control incorrecto", () => {
    expect(cifValido("B98000004")).toBe(false);
  });

  it("rechaza formato inválido (letra inicial no permitida, longitud)", () => {
    expect(cifValido("Z98000003")).toBe(false);
    expect(cifValido("B9800000")).toBe(false);
    expect(cifValido("12345678A")).toBe(false);
  });
});

describe("entidadSchema (paso 1)", () => {
  const valido = {
    name: "Refugio Esperanza",
    cif: "B98000003",
    email: "hola@refugio.org",
    phone: "600123456",
    website: "https://refugio.org",
  };

  it("valida los datos de entidad correctos", () => {
    expect(entidadSchema.safeParse(valido).success).toBe(true);
  });

  it("acepta web vacía (opcional)", () => {
    const r = entidadSchema.safeParse({ ...valido, website: "" });
    expect(r.success).toBe(true);
  });

  it("rechaza CIF inválido", () => {
    const r = entidadSchema.safeParse({ ...valido, cif: "B98000004" });
    expect(r.success).toBe(false);
  });

  it("rechaza email mal formado", () => {
    const r = entidadSchema.safeParse({ ...valido, email: "no-es-email" });
    expect(r.success).toBe(false);
  });

  it("rechaza teléfono español inválido", () => {
    expect(entidadSchema.safeParse({ ...valido, phone: "12345" }).success).toBe(false);
    expect(entidadSchema.safeParse({ ...valido, phone: "100123456" }).success).toBe(false);
  });

  it("acepta teléfono con prefijo +34 y espacios", () => {
    expect(entidadSchema.safeParse({ ...valido, phone: "+34 600 123 456" }).success).toBe(true);
  });
});

describe("ubicacionSchema (paso 2)", () => {
  const valido = {
    address: "Calle Mayor 1",
    city: "Bilbao",
    province: "Bizkaia",
    postalCode: "48001",
    lat: 43.263,
    lng: -2.935,
  };

  it("valida ubicación con coordenadas", () => {
    expect(ubicacionSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza código postal que no sean 5 dígitos", () => {
    expect(ubicacionSchema.safeParse({ ...valido, postalCode: "480" }).success).toBe(false);
    expect(ubicacionSchema.safeParse({ ...valido, postalCode: "abcde" }).success).toBe(false);
  });

  it("exige coordenadas (pin colocado)", () => {
    const { lat, lng, ...sinCoords } = valido;
    void lat;
    void lng;
    expect(ubicacionSchema.safeParse(sinCoords).success).toBe(false);
  });
});

describe("socialLinksSchema", () => {
  it("acepta redes con URLs válidas y parciales", () => {
    expect(
      socialLinksSchema.safeParse({ instagram: "https://instagram.com/refugio" }).success,
    ).toBe(true);
    expect(socialLinksSchema.safeParse({}).success).toBe(true);
  });

  it("rechaza URL inválida", () => {
    expect(socialLinksSchema.safeParse({ instagram: "no-url" }).success).toBe(false);
  });
});

describe("perfilSchema (paso 3)", () => {
  const base = {
    description: "Somos un refugio sin ánimo de lucro.",
    socialLinks: {},
    acceptsVolunteers: true,
    acceptsFostering: false,
  };

  it("valida el perfil público mínimo", () => {
    expect(perfilSchema.safeParse(base).success).toBe(true);
  });

  it("acepta portada y año de fundación válidos (FEATURE-028)", () => {
    const r = perfilSchema.safeParse({
      ...base,
      coverUrl: "https://x.supabase.co/storage/v1/object/public/shelter-media/s1/cover.webp",
      foundedYear: 2005,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza años de fundación fuera de rango", () => {
    expect(perfilSchema.safeParse({ ...base, foundedYear: 1899 }).success).toBe(false);
    const futuro = new Date().getFullYear() + 1;
    expect(perfilSchema.safeParse({ ...base, foundedYear: futuro }).success).toBe(false);
    expect(perfilSchema.safeParse({ ...base, foundedYear: 2005.5 }).success).toBe(false);
  });

  it("admite el año actual y ausencia de año", () => {
    const actual = new Date().getFullYear();
    expect(perfilSchema.safeParse({ ...base, foundedYear: actual }).success).toBe(true);
    expect(perfilSchema.safeParse(base).success).toBe(true);
  });
});
