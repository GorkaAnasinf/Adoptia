import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

// (tabla, filtro) => resultado de conteo; "published" = animales publicados,
// "verified" = protectoras verificadas, "adopted" = adopciones.
const statsMock = vi.fn();
const rpcMock = vi.fn();
const historiasMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((tabla: string) => {
      if (tabla === "adoption_stories") {
        // cargarHistorias: select().eq().order().limit()
        return {
          select: () => ({
            eq: () => ({ order: () => ({ limit: () => historiasMock() }) }),
          }),
        };
      }
      return {
        select: vi.fn(() => ({
          not: vi.fn(() => statsMock(tabla, "published")),
          eq: vi.fn((_col: string, valor: string) => statsMock(tabla, valor)),
        })),
      };
    }),
    rpc: rpcMock,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import HomePage from "./page";

const adoptado = (nombre: string) => ({
  id: crypto.randomUUID(),
  name: nombre,
  slug: `${nombre.toLowerCase()}-xyz789`,
  species: "cat",
  shelter_name: "Protectora Bilbao",
  shelter_slug: "protectora-bilbao",
  city: "Bilbao",
  province: "Bizkaia",
  adopted_at: "2026-06-15T10:00:00Z",
  cover_url: null,
});

const reciente = (nombre: string) => ({
  id: crypto.randomUUID(),
  name: nombre,
  slug: `${nombre.toLowerCase()}-abc123`,
  species: "dog",
  sex: "female",
  size: "small",
  birth_date_approx: null,
  status: "available",
  published_at: new Date().toISOString(),
  shelter_name: "Protectora Bilbao",
  shelter_slug: "protectora-bilbao",
  city: "Bilbao",
  province: "Bizkaia",
  distance_m: null,
  cover_url: null,
  total_count: 2,
});

async function renderHome() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await HomePage()}
    </NextIntlClientProvider>,
  );
}

describe("Home", () => {
  beforeEach(() => {
    statsMock.mockReset();
    rpcMock.mockReset();
    statsMock.mockImplementation((tabla: string, filtro: string) => {
      if (filtro === "published") return { count: 12, error: null };
      if (tabla === "shelters") return { count: 4, error: null };
      return { count: 7, error: null };
    });
    rpcMock.mockImplementation((name: string) =>
      name === "adopted_animals_recent"
        ? { data: [adoptado("Nube")], error: null }
        : { data: [reciente("Pipa"), reciente("Golfo")], error: null },
    );
    historiasMock.mockReset().mockResolvedValue({ data: [], error: null });
  });

  it("muestra el titular de bienvenida desde messages/es.json", async () => {
    await renderHome();
    expect(
      screen.getByRole("heading", { level: 1, name: messages.home.title }),
    ).toBeInTheDocument();
  });

  it("el hero lleva foto de fondo decorativa (alt vacío, invisible para lectores)", async () => {
    await renderHome();
    const fondo = screen.getByTestId("hero-bg");
    expect(fondo).toHaveAttribute("alt", "");
    expect(fondo).toHaveAttribute("src", expect.stringContaining("hero-home"));
  });

  it("el hero incluye el buscador con especie, ciudad y ubicación", async () => {
    await renderHome();
    expect(screen.getByLabelText(messages.home.searchSpeciesLabel)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(messages.home.searchCityPlaceholder)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.home.searchButton })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.home.searchUseLocation }),
    ).toBeInTheDocument();
  });

  it("muestra los recién llegados con su botón de Adoptar y el enlace a ver todos", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { name: messages.home.recentTitle })).toBeInTheDocument();
    expect(screen.getByText("Pipa")).toBeInTheDocument();
    expect(screen.getByText("Golfo")).toBeInTheDocument();
    expect(screen.getAllByText(messages.busqueda.ctaAdoptar)).toHaveLength(2);
    expect(screen.getByRole("link", { name: messages.home.recentAll })).toHaveAttribute(
      "href",
      "/animales",
    );
  });

  it("sin recientes oculta la sección sin romper", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderHome();
    expect(
      screen.queryByRole("heading", { name: messages.home.recentTitle }),
    ).not.toBeInTheDocument();
  });

  it("explica cómo funciona en tres pasos, el tercero concierta una cita", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { name: messages.home.howTitle })).toBeInTheDocument();
    expect(screen.getByText(messages.home.how1Title)).toBeInTheDocument();
    expect(screen.getByText(messages.home.how2Title)).toBeInTheDocument();
    expect(screen.getByText(messages.home.how3Title)).toBeInTheDocument();
  });

  it("muestra los contadores reales de animales, protectoras y adopciones", async () => {
    await renderHome();
    const stats = screen.getByTestId("home-stats");
    expect(within(stats).getByText("12")).toBeInTheDocument();
    expect(within(stats).getByText("4")).toBeInTheDocument();
    expect(within(stats).getByText("7")).toBeInTheDocument();
    expect(stats).toHaveTextContent(messages.home.statsSheltersLabel);
    expect(stats).toHaveTextContent(messages.home.statsAdoptionsLabel);
  });

  it("si Supabase no está disponible la home sigue sin stats ni recientes", async () => {
    statsMock.mockImplementation(() => {
      throw new Error("sin conexión");
    });
    rpcMock.mockRejectedValue(new Error("sin conexión"));
    await renderHome();
    expect(
      screen.getByRole("heading", { level: 1, name: messages.home.title }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("home-stats")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: messages.home.recentTitle }),
    ).not.toBeInTheDocument();
  });

  it("muestra 'Ya están en casa' con las adopciones reales (nombre, protectora y enlace a la ficha)", async () => {
    await renderHome();
    expect(
      screen.getByRole("heading", { name: messages.home.storiesTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nube")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Nube/ }),
    ).toHaveAttribute("href", "/animales/nube-xyz789");
  });

  it("sin adopciones ni historias oculta la sección de historias felices", async () => {
    rpcMock.mockImplementation((name: string) =>
      name === "adopted_animals_recent"
        ? { data: [], error: null }
        : { data: [reciente("Pipa")], error: null },
    );
    await renderHome();
    expect(
      screen.queryByRole("heading", { name: messages.home.storiesTitle }),
    ).not.toBeInTheDocument();
  });

  it("con un testimonio aprobado muestra la frase del adoptante en vez del adoptado", async () => {
    historiasMock.mockResolvedValue({
      data: [
        {
          id: "st1",
          quote: "Llegó asustada y hoy es la reina del sofá.",
          photo_url: null,
          animals: { name: "Luna", slug: "luna-abc", animal_media: [] },
          shelters: { name: "Protectora Bilbao" },
        },
      ],
      error: null,
    });
    await renderHome();
    expect(
      screen.getByRole("heading", { name: messages.home.storiesTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(/reina del sofá/)).toBeInTheDocument();
    // El testimonio sustituye a la card de adoptado (Nube no aparece en la sección)
    expect(screen.queryByText("Nube")).not.toBeInTheDocument();
  });

  it("incluye el bloque para protectoras con overline, título y CTA al registro", async () => {
    await renderHome();
    expect(screen.getByText(messages.home.ctaSheltersOverline)).toBeInTheDocument();
    expect(screen.getByText(messages.home.ctaSheltersTitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.home.ctaShelters })).toHaveAttribute(
      "href",
      "/registro",
    );
  });
});
