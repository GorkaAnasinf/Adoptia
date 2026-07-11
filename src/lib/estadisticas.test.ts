import { describe, expect, it } from "vitest";
import { serieVisitas, tiempoMedioHastaAdopcion } from "./estadisticas";

describe("tiempoMedioHastaAdopcion", () => {
  it("promedia solo adoptados con fecha de publicación", () => {
    const media = tiempoMedioHastaAdopcion([
      { status: "adopted", published_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-11T00:00:00Z" }, // 10 días
      { status: "adopted", published_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-21T00:00:00Z" }, // 20 días
      { status: "available", published_at: "2026-06-01T00:00:00Z", updated_at: "2026-07-01T00:00:00Z" },
      { status: "adopted", published_at: null, updated_at: "2026-07-01T00:00:00Z" },
    ]);
    expect(media).toBe(15);
  });

  it("sin adoptados devuelve null (estado vacío, no gráfica rota)", () => {
    expect(tiempoMedioHastaAdopcion([])).toBeNull();
    expect(
      tiempoMedioHastaAdopcion([
        { status: "available", published_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-02T00:00:00Z" },
      ]),
    ).toBeNull();
  });

  it("descarta intervalos negativos (datos corruptos)", () => {
    expect(
      tiempoMedioHastaAdopcion([
        { status: "adopted", published_at: "2026-06-10T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" },
      ]),
    ).toBeNull();
  });
});

describe("serieVisitas", () => {
  it("rellena los huecos a cero y respeta el orden cronológico", () => {
    const hoy = new Date("2026-07-10T12:00:00Z");
    const serie = serieVisitas([{ day: "2026-07-09", views: 5 }], 3, hoy);
    expect(serie).toEqual([
      { day: "2026-07-08", views: 0 },
      { day: "2026-07-09", views: 5 },
      { day: "2026-07-10", views: 0 },
    ]);
  });
});
