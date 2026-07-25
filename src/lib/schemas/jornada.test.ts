import { describe, expect, it } from "vitest";
import { jornadaEsPublicable, jornadaSchema } from "./jornada";

const base = () => ({
  title: "Jornada en la plaza",
  description: "Ven a conocerlos",
  starts_at: "2026-08-01T10:00",
  ends_at: "2026-08-01T13:00",
  address: "Plaza Mayor",
  city: "Almería",
  lat: 36.84,
  lng: -2.46,
  capacity: 50,
  animal_ids: [],
  poster_url: null,
});

describe("jornadaSchema", () => {
  it("acepta una jornada válida y aplica defaults", () => {
    const r = jornadaSchema.safeParse({
      title: "Solo lo mínimo",
      starts_at: "2026-08-01T10:00",
      ends_at: "2026-08-01T13:00",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.description).toBe("");
      expect(r.data.lat).toBeNull();
      expect(r.data.capacity).toBeNull();
      expect(r.data.animal_ids).toEqual([]);
    }
  });

  it("rechaza título vacío o de más de 120 caracteres", () => {
    expect(jornadaSchema.safeParse({ ...base(), title: "" }).success).toBe(false);
    expect(jornadaSchema.safeParse({ ...base(), title: "a".repeat(121) }).success).toBe(false);
  });

  it("rechaza que el fin sea anterior o igual al inicio", () => {
    const r = jornadaSchema.safeParse({ ...base(), ends_at: "2026-08-01T09:00" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toContain("ends_at");
    expect(jornadaSchema.safeParse({ ...base(), ends_at: base().starts_at }).success).toBe(false);
  });

  it("rechaza fechas no parseables", () => {
    expect(jornadaSchema.safeParse({ ...base(), starts_at: "no-es-fecha" }).success).toBe(false);
  });

  it("rechaza aforo cero o negativo pero acepta nulo", () => {
    expect(jornadaSchema.safeParse({ ...base(), capacity: 0 }).success).toBe(false);
    expect(jornadaSchema.safeParse({ ...base(), capacity: -3 }).success).toBe(false);
    expect(jornadaSchema.safeParse({ ...base(), capacity: null }).success).toBe(true);
  });

  it("rechaza coordenadas fuera de rango", () => {
    expect(jornadaSchema.safeParse({ ...base(), lat: 200 }).success).toBe(false);
    expect(jornadaSchema.safeParse({ ...base(), lng: -400 }).success).toBe(false);
  });

  it("rechaza ids de animal que no son uuid", () => {
    expect(jornadaSchema.safeParse({ ...base(), animal_ids: ["no-uuid"] }).success).toBe(false);
  });
});

describe("jornadaEsPublicable", () => {
  it("es publicable solo con ubicación completa", () => {
    expect(jornadaEsPublicable({ lat: 36.84, lng: -2.46 })).toBe(true);
    expect(jornadaEsPublicable({ lat: null, lng: -2.46 })).toBe(false);
    expect(jornadaEsPublicable({ lat: 36.84, lng: null })).toBe(false);
    expect(jornadaEsPublicable({ lat: null, lng: null })).toBe(false);
  });
});
