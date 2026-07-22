import { describe, expect, it } from "vitest";
import {
  celdasMes,
  fechaISO,
  resolverDiaAgenda,
  validarFranjas,
  type FranjaSemanal,
  type OverrideDia,
} from "./agenda";

const patron = (weekday: number): FranjaSemanal[] => [
  { weekday, start_time: "10:00:00", end_time: "13:00:00", slot_minutes: 30, active: true },
];

describe("resolverDiaAgenda", () => {
  it("sin patrón ni override → sin_configurar", () => {
    expect(resolverDiaAgenda([], null)).toEqual({ tipo: "sin_configurar" });
  });

  it("solo patrón semanal activo → patron con franjas normalizadas a HH:MM", () => {
    const estado = resolverDiaAgenda(patron(3), null);
    expect(estado).toEqual({
      tipo: "patron",
      franjas: [{ start: "10:00", end: "13:00", minutes: 30 }],
    });
  });

  it("ignora las franjas del patrón inactivas", () => {
    const franjas = patron(3).map((f) => ({ ...f, active: false }));
    expect(resolverDiaAgenda(franjas, null)).toEqual({ tipo: "sin_configurar" });
  });

  it("override closed → cerrado, aunque exista patrón", () => {
    const override: OverrideDia = { date: "2026-08-15", closed: true, slots: [], note: "Vacaciones" };
    expect(resolverDiaAgenda(patron(3), override)).toEqual({ tipo: "cerrado", note: "Vacaciones" });
  });

  it("override con slots → especial, sustituye al patrón", () => {
    const override: OverrideDia = {
      date: "2026-08-15",
      closed: false,
      slots: [{ start: "16:00", end: "18:00", minutes: 60 }],
      note: null,
    };
    expect(resolverDiaAgenda(patron(3), override)).toEqual({
      tipo: "especial",
      franjas: [{ start: "16:00", end: "18:00", minutes: 60 }],
      note: null,
    });
  });

  it("override sin closed y sin slots → cae al patrón semanal", () => {
    const override: OverrideDia = { date: "2026-08-15", closed: false, slots: [], note: null };
    expect(resolverDiaAgenda(patron(3), override)).toEqual({
      tipo: "patron",
      franjas: [{ start: "10:00", end: "13:00", minutes: 30 }],
    });
  });
});

describe("validarFranjas", () => {
  it("acepta franjas válidas sin solape", () => {
    expect(
      validarFranjas([
        { start: "10:00", end: "12:00", minutes: 30 },
        { start: "16:00", end: "18:00", minutes: 60 },
      ]),
    ).toEqual({ ok: true });
  });

  it("rechaza fin <= inicio", () => {
    expect(validarFranjas([{ start: "12:00", end: "10:00", minutes: 30 }])).toEqual({
      ok: false,
      error: "horas",
    });
  });

  it("rechaza franjas solapadas (aunque estén desordenadas)", () => {
    expect(
      validarFranjas([
        { start: "16:00", end: "18:00", minutes: 30 },
        { start: "11:00", end: "17:00", minutes: 30 },
      ]),
    ).toEqual({ ok: false, error: "solape" });
  });

  it("permite franjas contiguas (fin == inicio siguiente)", () => {
    expect(
      validarFranjas([
        { start: "10:00", end: "12:00", minutes: 30 },
        { start: "12:00", end: "14:00", minutes: 30 },
      ]),
    ).toEqual({ ok: true });
  });
});

describe("fechaISO", () => {
  it("formatea con mes 0-indexado y sin desfase de zona horaria", () => {
    expect(fechaISO(2026, 7, 5)).toBe("2026-08-05");
    expect(fechaISO(2026, 0, 1)).toBe("2026-01-01");
    expect(fechaISO(2026, 11, 31)).toBe("2026-12-31");
  });
});

describe("celdasMes", () => {
  it("rellena el arranque hasta el primer día (Lunes=0) y cuadra a múltiplo de 7", () => {
    // Agosto 2026: el día 1 cae en sábado → 5 huecos previos (L,M,X,J,V).
    const celdas = celdasMes(2026, 7);
    expect(celdas.length % 7).toBe(0);
    expect(celdas.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(celdas[5]).toBe(1);
    expect(celdas.filter((c) => c !== null)).toHaveLength(31);
  });
});
