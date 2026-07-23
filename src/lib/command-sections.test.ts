import { describe, expect, it } from "vitest";
import { filtrarSecciones, normaliza, SECCIONES } from "./command-sections";

// Etiqueta de prueba: devuelve un texto legible por clave.
const ETIQUETAS: Record<string, string> = {
  navHome: "Inicio",
  navAnimals: "Mis animales",
  navRequests: "Solicitudes",
  navAppointments: "Citas",
  navAgenda: "Agenda",
  navFosterHomes: "Acogidas",
  navStories: "Historias",
  navNeeds: "Necesidades",
  navDonationBoard: "Donaciones",
  navPublicProfile: "Perfil público",
  navStats: "Estadísticas",
};
const etiqueta = (k: string) => ETIQUETAS[k] ?? k;

describe("normaliza", () => {
  it("pasa a minúsculas y quita acentos", () => {
    expect(normaliza("Estadísticas")).toBe("estadisticas");
    expect(normaliza("  ACOGIDA  ")).toBe("acogida");
  });
});

describe("filtrarSecciones", () => {
  it("con término vacío devuelve todas las secciones del rol", () => {
    expect(filtrarSecciones("shelter", "", etiqueta)).toHaveLength(SECCIONES.shelter.length);
  });

  it("filtra por el label traducido, sin sensibilidad a acentos ni mayúsculas", () => {
    const r = filtrarSecciones("shelter", "estadi", etiqueta);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ href: "/panel/estadisticas", label: "Estadísticas" });
  });

  it("cada rol solo ve sus propias secciones", () => {
    const adopter = filtrarSecciones("adopter", "", (k) => k);
    expect(adopter.every((s) => s.href.startsWith("/mi-cuenta"))).toBe(true);
    const shelter = filtrarSecciones("shelter", "", (k) => k);
    expect(shelter.every((s) => s.href.startsWith("/panel"))).toBe(true);
  });

  it("sin coincidencias devuelve lista vacía", () => {
    expect(filtrarSecciones("shelter", "zzzzz", etiqueta)).toHaveLength(0);
  });
});
