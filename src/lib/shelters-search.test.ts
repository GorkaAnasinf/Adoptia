import { describe, expect, it } from "vitest";
import {
  buildQueryString,
  DEFAULT_CENTER,
  DEFAULT_RADIUS_KM,
  parseSheltersSearch,
  searchToRpcArgs,
} from "./shelters-search";

describe("parseSheltersSearch", () => {
  it("sin parámetros: sin ubicación y sin chips activos", () => {
    const s = parseSheltersSearch({});
    expect(s.lat).toBeUndefined();
    expect(s.lng).toBeUndefined();
    expect(s.perros).toBe(false);
    expect(s.gatos).toBe(false);
    expect(s.acogida).toBe(false);
    expect(s.voluntariado).toBe(false);
  });

  it("lee lat/lng válidos", () => {
    const s = parseSheltersSearch({ lat: "43.263", lng: "-2.935" });
    expect(s.lat).toBeCloseTo(43.263);
    expect(s.lng).toBeCloseTo(-2.935);
  });

  it("lat/lng fuera de rango se ignoran", () => {
    const s = parseSheltersSearch({ lat: "200", lng: "-2.935" });
    expect(s.lat).toBeUndefined();
    expect(s.lng).toBeUndefined();
  });

  it("lee chips perros/gatos/acogida/voluntariado", () => {
    const s = parseSheltersSearch({ perros: "si", acogida: "si" });
    expect(s.perros).toBe(true);
    expect(s.gatos).toBe(false);
    expect(s.acogida).toBe(true);
    expect(s.voluntariado).toBe(false);
  });
});

describe("searchToRpcArgs", () => {
  it("sin ubicación usa el centro por defecto (España) y radio amplio", () => {
    const args = searchToRpcArgs(parseSheltersSearch({}));
    expect(args.lat).toBe(DEFAULT_CENTER.lat);
    expect(args.lng).toBe(DEFAULT_CENTER.lng);
    expect(args.radius_m).toBe(DEFAULT_RADIUS_KM * 1000);
    expect(args.p_species).toBeNull();
    expect(args.p_accepts_volunteers).toBeNull();
    expect(args.p_accepts_fostering).toBeNull();
  });

  it("con ubicación del usuario la usa como centro", () => {
    const args = searchToRpcArgs(parseSheltersSearch({ lat: "43.263", lng: "-2.935" }));
    expect(args.lat).toBeCloseTo(43.263);
    expect(args.lng).toBeCloseTo(-2.935);
  });

  it("chip perros (sin gatos) filtra por especie perro", () => {
    const args = searchToRpcArgs(parseSheltersSearch({ perros: "si" }));
    expect(args.p_species).toBe("dog");
  });

  it("chip gatos (sin perros) filtra por especie gato", () => {
    const args = searchToRpcArgs(parseSheltersSearch({ gatos: "si" }));
    expect(args.p_species).toBe("cat");
  });

  it("perros Y gatos activos a la vez no filtra por especie (ambos)", () => {
    const args = searchToRpcArgs(parseSheltersSearch({ perros: "si", gatos: "si" }));
    expect(args.p_species).toBeNull();
  });

  it("acogida y voluntariado se traducen a los flags del RPC", () => {
    const args = searchToRpcArgs(parseSheltersSearch({ acogida: "si", voluntariado: "si" }));
    expect(args.p_accepts_fostering).toBe(true);
    expect(args.p_accepts_volunteers).toBe(true);
  });
});

describe("buildQueryString", () => {
  it("omite valores por defecto", () => {
    expect(buildQueryString(parseSheltersSearch({}))).toBe("");
  });

  it("serializa ubicación y chips activos", () => {
    const qs = buildQueryString(
      parseSheltersSearch({ lat: "43.263", lng: "-2.935", perros: "si", acogida: "si" }),
    );
    const params = new URLSearchParams(qs);
    expect(params.get("lat")).toBe("43.263");
    expect(params.get("lng")).toBe("-2.935");
    expect(params.get("perros")).toBe("si");
    expect(params.get("acogida")).toBe("si");
    expect(params.has("gatos")).toBe(false);
  });
});
