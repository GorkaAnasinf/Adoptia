import { describe, expect, it } from "vitest";
import { normalizePhoton } from "./geocoding";

const feature = (props: Record<string, unknown>, coords: [number, number] = [-2.935, 43.263]) => ({
  geometry: { coordinates: coords },
  properties: props,
});

describe("normalizePhoton", () => {
  it("mapea una dirección española completa", () => {
    const [s] = normalizePhoton([
      feature({
        countrycode: "ES",
        street: "Calle Iparraguirre",
        housenumber: "12",
        postcode: "48009",
        city: "Bilbao",
        county: "Bizkaia",
        state: "País Vasco",
      }),
    ]);
    expect(s.address).toBe("Calle Iparraguirre 12");
    expect(s.city).toBe("Bilbao");
    expect(s.province).toBe("Bizkaia");
    expect(s.postalCode).toBe("48009");
    expect(s.lat).toBe(43.263);
    expect(s.lng).toBe(-2.935);
    expect(s.label).toContain("Bilbao");
  });

  it("descarta resultados fuera de España", () => {
    expect(
      normalizePhoton([feature({ countrycode: "FR", name: "Paris", city: "Paris" })]),
    ).toHaveLength(0);
  });

  it("descarta features sin coordenadas o sin dirección/ciudad útiles", () => {
    expect(normalizePhoton([{ properties: { countrycode: "ES", name: "x" } }])).toHaveLength(0);
    expect(normalizePhoton([feature({ countrycode: "ES" })])).toHaveLength(0);
  });

  it("usa name como dirección cuando no hay street", () => {
    const [s] = normalizePhoton([
      feature({ countrycode: "ES", name: "Parque de Doña Casilda", city: "Bilbao" }),
    ]);
    expect(s.address).toBe("Parque de Doña Casilda");
  });

  it("en modo place trata el name como ciudad (sin dirección)", () => {
    const [s] = normalizePhoton(
      [feature({ countrycode: "ES", name: "Sarriguren", county: "Navarra", osm_key: "place" })],
      "place",
    );
    expect(s.city).toBe("Sarriguren");
    expect(s.address).toBe("");
    expect(s.province).toBe("Navarra");
  });
});
