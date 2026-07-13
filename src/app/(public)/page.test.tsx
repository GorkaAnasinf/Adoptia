import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

// (tabla, filtro) => resultado de conteo; "published" = animales publicados,
// "verified" = protectoras verificadas, "adopted" = adopciones.
const statsMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((tabla: string) => ({
      select: vi.fn(() => ({
        not: vi.fn(() => statsMock(tabla, "published")),
        eq: vi.fn((_col: string, valor: string) => statsMock(tabla, valor)),
      })),
    })),
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
    rpcMock.mockResolvedValue({ data: [reciente("Pipa"), reciente("Golfo")], error: null });
  });

  it("muestra el titular de bienvenida desde messages/es.json", async () => {
    await renderHome();
    expect(
      screen.getByRole("heading", { level: 1, name: messages.home.title }),
    ).toBeInTheDocument();
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
