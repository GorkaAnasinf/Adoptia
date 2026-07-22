import { describe, expect, it } from "vitest";
import { LIMITE_RANGO_DIAS, plantillaSchema, rangoCierreSchema } from "./agenda";

const base = { desde: "2026-08-01", hasta: "2026-08-15", nota: "Vacaciones" };

describe("rangoCierreSchema", () => {
  it("acepta un rango válido con nota", () => {
    expect(rangoCierreSchema.safeParse(base).success).toBe(true);
  });

  it("acepta sin nota", () => {
    const { nota, ...sinNota } = base;
    void nota;
    expect(rangoCierreSchema.safeParse(sinNota).success).toBe(true);
  });

  it("rechaza hasta anterior a desde", () => {
    const r = rangoCierreSchema.safeParse({ ...base, desde: "2026-08-15", hasta: "2026-08-01" });
    expect(r.success).toBe(false);
  });

  it("rechaza un rango que excede el límite de días", () => {
    const r = rangoCierreSchema.safeParse({ desde: "2026-01-01", hasta: "2030-01-01" });
    expect(r.success).toBe(false);
  });

  it("acepta justo el límite", () => {
    const desde = new Date("2026-01-01T00:00:00Z");
    const hasta = new Date(desde);
    hasta.setUTCDate(hasta.getUTCDate() + (LIMITE_RANGO_DIAS - 1));
    const r = rangoCierreSchema.safeParse({
      desde: "2026-01-01",
      hasta: hasta.toISOString().slice(0, 10),
    });
    expect(r.success).toBe(true);
  });

  it("rechaza una nota demasiado larga", () => {
    const r = rangoCierreSchema.safeParse({ ...base, nota: "x".repeat(201) });
    expect(r.success).toBe(false);
  });
});

describe("plantillaSchema", () => {
  const franja = { start: "10:00", end: "13:00", minutes: 30 };

  it("acepta una plantilla con nombre y franjas válidas", () => {
    expect(plantillaSchema.safeParse({ nombre: "Mañanas L-V", slots: [franja] }).success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    expect(plantillaSchema.safeParse({ nombre: "", slots: [franja] }).success).toBe(false);
  });

  it("rechaza nombre demasiado largo", () => {
    expect(plantillaSchema.safeParse({ nombre: "x".repeat(61), slots: [franja] }).success).toBe(false);
  });

  it("rechaza sin franjas", () => {
    expect(plantillaSchema.safeParse({ nombre: "Vacía", slots: [] }).success).toBe(false);
  });

  it("rechaza una franja con fin anterior al inicio", () => {
    const r = plantillaSchema.safeParse({
      nombre: "Mala",
      slots: [{ start: "13:00", end: "10:00", minutes: 30 }],
    });
    expect(r.success).toBe(false);
  });
});
