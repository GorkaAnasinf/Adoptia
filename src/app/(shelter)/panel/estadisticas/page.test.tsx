import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const state = vi.hoisted(() => ({
  shelter: { id: "s1" } as Record<string, unknown> | null,
  animales: [] as Record<string, unknown>[],
  vistas: [] as Record<string, unknown>[],
  solicitudes: [] as Record<string, unknown>[],
  eventos: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabase/server", () => {
  const thenable = (payload: unknown) => {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "in", "gte"]) b[m] = () => b;
    b.then = (resolve: (v: unknown) => void) => resolve(payload);
    return b;
  };
  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
      from: vi.fn((tabla: string) => {
        if (tabla === "shelters") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
          };
        }
        if (tabla === "animals") return thenable({ data: state.animales });
        if (tabla === "page_views") return thenable({ data: state.vistas });
        if (tabla === "events") return thenable({ data: state.eventos });
        return thenable({ data: state.solicitudes });
      }),
    })),
  };
});

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
  getFormatter: vi.fn(async () => {
    const { createFormatter } = await import("next-intl");
    return createFormatter({ locale: "es" });
  }),
}));

import EstadisticasPage from "./page";

const hoy = new Date().toISOString();
const ANIMAL = {
  id: "a1",
  name: "Luna",
  slug: "luna-demo",
  status: "available",
  published_at: hoy,
  updated_at: hoy,
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await EstadisticasPage()}
    </NextIntlClientProvider>,
  );
}

describe("Panel de estadísticas", () => {
  beforeEach(() => {
    state.shelter = { id: "s1" };
    state.animales = [ANIMAL];
    state.vistas = [{ animal_id: "a1", day: hoy.slice(0, 10), views: 7 }];
    state.solicitudes = [{ animal_id: "a1" }, { animal_id: "a1" }];
    state.eventos = [];
  });

  it("muestra resumen de visitas, solicitudes y estado de tiempo medio", async () => {
    await renderPagina();
    const resumen = screen.getByTestId("stats-resumen");
    expect(resumen).toHaveTextContent("7");
    expect(resumen).toHaveTextContent("2");
    expect(resumen).toHaveTextContent(messages.stats.tiempoMedioVacio);
    expect(screen.getByTestId("stats-grafica")).toBeInTheDocument();
  });

  it("calcula el tiempo medio con animales adoptados", async () => {
    state.animales = [
      ANIMAL,
      {
        id: "a2",
        name: "Toby",
        slug: "toby-demo",
        status: "adopted",
        published_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-11T00:00:00Z",
      },
    ];
    await renderPagina();
    expect(screen.getByTestId("stats-resumen")).toHaveTextContent("10");
  });

  it("fila por animal con enlace, visitas y solicitudes", async () => {
    await renderPagina();
    expect(screen.getByRole("link", { name: "Luna" })).toHaveAttribute("href", "/animales/luna-demo");
    const fila = screen.getByRole("link", { name: "Luna" }).closest("tr");
    expect(fila).toHaveTextContent("7");
    expect(fila).toHaveTextContent("2");
  });

  it("sin visitas, la gráfica muestra el estado vacío", async () => {
    state.animales = [{ ...ANIMAL, published_at: null }];
    state.vistas = [];
    state.solicitudes = [];
    await renderPagina();
    expect(screen.getByText(messages.stats.graficaVacia)).toBeInTheDocument();
  });

  it("muestra la tarjeta de jornadas con adopciones y asistentes", async () => {
    state.eventos = [
      { adoptions_count: 3, attended_count: 20 },
      { adoptions_count: 1, attended_count: 12 },
    ];
    await renderPagina();
    const jornadas = screen.getByTestId("stats-jornadas");
    expect(jornadas).toHaveTextContent("2"); // jornadas celebradas
    expect(jornadas).toHaveTextContent("4"); // adopciones (3+1)
    expect(jornadas).toHaveTextContent("32"); // asistentes (20+12)
    expect(jornadas).toHaveTextContent(messages.jornadas.statsAdopciones);
  });

  it("sin animales ni jornadas muestra estado vacío explicativo", async () => {
    state.animales = [];
    state.eventos = [];
    await renderPagina();
    expect(screen.getByText(messages.stats.vacioTitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.stats.vacioCta })).toHaveAttribute(
      "href",
      "/panel/animales",
    );
  });
});
