import { render, screen } from "@testing-library/react";
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
  published_at: "2026-07-01T00:00:00Z",
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

  it("muestra el CTA principal de ver animales", async () => {
    await renderHome();
    expect(screen.getByRole("link", { name: messages.home.cta })).toBeInTheDocument();
  });

  it("el buscador rápido enlaza al listado filtrado por especie", async () => {
    await renderHome();
    expect(screen.getByRole("link", { name: messages.home.quickDogs })).toHaveAttribute(
      "href",
      "/animales?especie=dog",
    );
    expect(screen.getByRole("link", { name: messages.home.quickCats })).toHaveAttribute(
      "href",
      "/animales?especie=cat",
    );
    expect(screen.getByRole("link", { name: messages.home.quickAll })).toHaveAttribute(
      "href",
      "/animales",
    );
  });

  it("muestra los recién llegados devueltos por el RPC", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { name: messages.home.recentTitle })).toBeInTheDocument();
    expect(screen.getByText("Pipa")).toBeInTheDocument();
    expect(screen.getByText("Golfo")).toBeInTheDocument();
  });

  it("sin recientes oculta la sección sin romper", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderHome();
    expect(screen.queryByRole("heading", { name: messages.home.recentTitle })).not.toBeInTheDocument();
  });

  it("explica cómo funciona en tres pasos", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { name: messages.home.howTitle })).toBeInTheDocument();
    expect(screen.getByText(messages.home.how1Title)).toBeInTheDocument();
    expect(screen.getByText(messages.home.how2Title)).toBeInTheDocument();
    expect(screen.getByText(messages.home.how3Title)).toBeInTheDocument();
  });

  it("muestra el contador de animales leído de Supabase", async () => {
    await renderHome();
    expect(screen.getByTestId("animal-count")).toHaveTextContent("12");
  });

  it("oculta el contador si Supabase no está disponible", async () => {
    statsMock.mockImplementation(() => {
      throw new Error("sin conexión");
    });
    await renderHome();
    expect(screen.queryByTestId("animal-count")).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-stats")).not.toBeInTheDocument();
  });

  it("muestra los contadores reales de animales, protectoras y adopciones", async () => {
    await renderHome();
    const stats = screen.getByTestId("home-stats");
    expect(stats).toHaveTextContent("12");
    expect(stats).toHaveTextContent("4");
    expect(stats).toHaveTextContent("7");
    expect(stats).toHaveTextContent(messages.home.statsSheltersLabel);
    expect(stats).toHaveTextContent(messages.home.statsAdoptionsLabel);
  });

  it("incluye el bloque para protectoras con su CTA", async () => {
    await renderHome();
    expect(screen.getByText(messages.home.ctaSheltersTitle)).toBeInTheDocument();
    // CTA en el hero y en el bloque final: ambos llevan al registro
    for (const enlace of screen.getAllByRole("link", { name: messages.home.ctaShelters })) {
      expect(enlace).toHaveAttribute("href", "/registro");
    }
  });
});
