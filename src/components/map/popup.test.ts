import { describe, expect, it } from "vitest";
import type { ShelterMapResult } from "./ListaProtectoras";
import { formatDistancia, popupHtml } from "./popup";

const base: ShelterMapResult = {
  id: "s1",
  name: "Refugio Cervantes",
  slug: "refugio-cervantes",
  city: "Toledo",
  distance_m: 70700,
  animal_count: 6,
  lat: 39.86,
  lng: -4.02,
};

const textos = { animales: "6 animales", verProtectora: "Ver protectora" };

describe("formatDistancia", () => {
  it("formatea metros por debajo del kilómetro y km con un decimal por encima", () => {
    expect(formatDistancia(900)).toBe("900 m");
    expect(formatDistancia(70700)).toBe("70.7 km");
  });

  it("sin distancia devuelve null", () => {
    expect(formatDistancia(null)).toBeNull();
  });
});

describe("popupHtml", () => {
  it("incluye nombre, ciudad con distancia, animales y CTA al perfil", () => {
    const html = popupHtml(base, textos);
    expect(html).toContain("Refugio Cervantes");
    expect(html).toContain("Toledo · 70.7 km");
    expect(html).toContain("6 animales");
    expect(html).toContain('href="/protectoras/refugio-cervantes"');
    expect(html).toContain("Ver protectora");
  });

  it("sin distancia muestra solo la ciudad", () => {
    const html = popupHtml({ ...base, distance_m: null }, textos);
    expect(html).toContain("Toledo");
    expect(html).not.toContain("km");
  });

  it("escapa HTML malicioso en los datos de la protectora", () => {
    const html = popupHtml(
      { ...base, name: '<img src=x onerror=alert(1)>', city: "<script>" },
      textos,
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img");
  });
});
