import { describe, expect, it } from "vitest";
import { resumenHorario, tieneHorario } from "./opening-hours";

describe("resumenHorario", () => {
  it("devuelve una fila por día con las franjas o null (cerrado)", () => {
    const filas = resumenHorario({
      lun: [{ open: "10:00", close: "14:00" }],
      mar: [
        { open: "10:00", close: "14:00" },
        { open: "16:00", close: "18:00" },
      ],
    });
    expect(filas).toHaveLength(7);
    expect(filas[0]).toEqual({ dia: "lun", franjas: "10:00–14:00" });
    expect(filas[1].franjas).toBe("10:00–14:00, 16:00–18:00");
    expect(filas[2].franjas).toBeNull(); // miércoles cerrado
  });

  it("ignora franjas incompletas", () => {
    const filas = resumenHorario({ lun: [{ open: "", close: "" }] });
    expect(filas[0].franjas).toBeNull();
  });
});

describe("tieneHorario", () => {
  it("true si hay alguna franja, false si vacío", () => {
    expect(tieneHorario({ lun: [{ open: "10:00", close: "14:00" }] })).toBe(true);
    expect(tieneHorario({})).toBe(false);
    expect(tieneHorario(null)).toBe(false);
  });
});
