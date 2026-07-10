import { describe, expect, it } from "vitest";
import {
  accionSolicitudSchema,
  cuestionarioSchema,
  experienciaSchema,
  hogarSchema,
  motivacionSchema,
  viviendaSchema,
} from "./solicitud";

describe("viviendaSchema", () => {
  it("acepta piso en propiedad sin permiten_animales", () => {
    const res = viviendaSchema.safeParse({ vivienda: "piso", regimen: "propiedad" });
    expect(res.success).toBe(true);
  });

  it("exige permiten_animales si el régimen es alquiler", () => {
    const res = viviendaSchema.safeParse({ vivienda: "piso", regimen: "alquiler" });
    expect(res.success).toBe(false);
  });

  it("acepta alquiler con permiten_animales indicado", () => {
    const res = viviendaSchema.safeParse({
      vivienda: "piso",
      regimen: "alquiler",
      permiten_animales: true,
    });
    expect(res.success).toBe(true);
  });

  it("rechaza vivienda fuera del enum", () => {
    const res = viviendaSchema.safeParse({ vivienda: "castillo", regimen: "propiedad" });
    expect(res.success).toBe(false);
  });
});

describe("hogarSchema", () => {
  it("acepta convivientes, ninos_edades y otros_animales", () => {
    const res = hogarSchema.safeParse({
      convivientes: 3,
      ninos_edades: [5, 9],
      otros_animales: "un gato",
    });
    expect(res.success).toBe(true);
  });

  it("acepta sin niños (array vacío)", () => {
    const res = hogarSchema.safeParse({ convivientes: 1, ninos_edades: [] });
    expect(res.success).toBe(true);
  });

  it("rechaza convivientes negativos", () => {
    const res = hogarSchema.safeParse({ convivientes: -1, ninos_edades: [] });
    expect(res.success).toBe(false);
  });
});

describe("experienciaSchema", () => {
  it("acepta horas_solo dentro de 0-24", () => {
    const res = experienciaSchema.safeParse({
      experiencia: "he tenido perros 10 años",
      horas_solo: 4,
      todos_de_acuerdo: true,
    });
    expect(res.success).toBe(true);
  });

  it("rechaza horas_solo negativas", () => {
    const res = experienciaSchema.safeParse({
      experiencia: "x",
      horas_solo: -1,
      todos_de_acuerdo: true,
    });
    expect(res.success).toBe(false);
  });

  it("rechaza horas_solo mayores de 24", () => {
    const res = experienciaSchema.safeParse({
      experiencia: "x",
      horas_solo: 25,
      todos_de_acuerdo: true,
    });
    expect(res.success).toBe(false);
  });

  it("acepta el límite exacto 24", () => {
    const res = experienciaSchema.safeParse({
      experiencia: "x",
      horas_solo: 24,
      todos_de_acuerdo: true,
    });
    expect(res.success).toBe(true);
  });
});

describe("motivacionSchema", () => {
  it("exige aceptar el consentimiento RGPD", () => {
    const res = motivacionSchema.safeParse({ message: "quiero adoptar", aceptaRgpd: false });
    expect(res.success).toBe(false);
  });

  it("acepta con RGPD aceptado", () => {
    const res = motivacionSchema.safeParse({ message: "quiero adoptar", aceptaRgpd: true });
    expect(res.success).toBe(true);
  });
});

describe("cuestionarioSchema (combinado)", () => {
  const base = {
    vivienda: "casa_jardin" as const,
    regimen: "propiedad" as const,
    convivientes: 2,
    ninos_edades: [] as number[],
    otros_animales: "",
    experiencia: "primera vez",
    horas_solo: 3,
    todos_de_acuerdo: true,
    message: "estoy lista",
    aceptaRgpd: true,
  };

  it("acepta un cuestionario completo válido", () => {
    expect(cuestionarioSchema.safeParse(base).success).toBe(true);
  });

  it("propaga el fallo de alquiler sin permiso del casero", () => {
    const res = cuestionarioSchema.safeParse({
      ...base,
      regimen: "alquiler",
      permiten_animales: undefined,
    });
    expect(res.success).toBe(false);
  });

  it("propaga el fallo de horas_solo fuera de rango", () => {
    const res = cuestionarioSchema.safeParse({ ...base, horas_solo: 30 });
    expect(res.success).toBe(false);
  });
});

describe("accionSolicitudSchema", () => {
  it("acepta approve sin motivo", () => {
    expect(accionSolicitudSchema.safeParse({ accion: "approve" }).success).toBe(true);
  });

  it("acepta complete sin motivo", () => {
    expect(accionSolicitudSchema.safeParse({ accion: "complete" }).success).toBe(true);
  });

  it("rechaza reject sin motivo", () => {
    expect(accionSolicitudSchema.safeParse({ accion: "reject" }).success).toBe(false);
  });

  it("rechaza reject con motivo vacío", () => {
    expect(accionSolicitudSchema.safeParse({ accion: "reject", motivo: "  " }).success).toBe(
      false,
    );
  });

  it("acepta reject con motivo no vacío", () => {
    expect(
      accionSolicitudSchema.safeParse({ accion: "reject", motivo: "No cumple requisitos" })
        .success,
    ).toBe(true);
  });

  it("rechaza acciones fuera del enum", () => {
    expect(accionSolicitudSchema.safeParse({ accion: "cancel" }).success).toBe(false);
  });

  it("acepta note con texto (puede ir vacío)", () => {
    expect(accionSolicitudSchema.safeParse({ accion: "note", nota: "Familia muy implicada" }).success).toBe(
      true,
    );
    expect(accionSolicitudSchema.safeParse({ accion: "note", nota: "" }).success).toBe(true);
  });

  it("rechaza note sin el campo nota", () => {
    expect(accionSolicitudSchema.safeParse({ accion: "note" }).success).toBe(false);
  });
});
