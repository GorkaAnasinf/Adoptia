import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc: rpcMock })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/animales",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => {
    // Traductor real (soporta plurales ICU) sobre messages/es.json
    const { createTranslator } = await import("next-intl");
    return createTranslator({
      locale: "es",
      messages,
      namespace: ns as never,
    });
  }),
}));

import AnimalesPage from "./page";

const fila = (extra: Record<string, unknown>) => ({
  id: crypto.randomUUID(),
  name: "Pipa",
  slug: `pipa-${Math.random().toString(36).slice(2, 8)}`,
  species: "dog",
  sex: "female",
  size: "small",
  birth_date_approx: "2024-06-01",
  status: "available",
  published_at: "2026-07-01T00:00:00Z",
  shelter_name: "Protectora Bilbao",
  shelter_slug: "protectora-bilbao",
  city: "Bilbao",
  province: "Bizkaia",
  distance_m: null,
  cover_url: null,
  total_count: 1,
  ...extra,
});

async function renderPagina(params: Record<string, string> = {}) {
  const ui = await AnimalesPage({ searchParams: Promise.resolve(params) });
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Página /animales", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("pinta las tarjetas devueltas por el RPC y el recuento junto al título", async () => {
    rpcMock.mockResolvedValue({
      data: [
        fila({ name: "Pipa", total_count: 2 }),
        fila({ name: "Golfo", total_count: 2 }),
      ],
      error: null,
    });
    await renderPagina();
    expect(
      screen.getByRole("heading", { level: 1, name: "Peludos buscando un hogar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 resultados encontrados")).toBeInTheDocument();
    expect(screen.getByText("Pipa")).toBeInTheDocument();
    expect(screen.getByText("Golfo")).toBeInTheDocument();
  });

  it("la cabecera ofrece crear alerta, deshabilitado sin filtros guardables", async () => {
    rpcMock.mockResolvedValue({
      data: [fila({ name: "Pipa", total_count: 1 })],
      error: null,
    });
    await renderPagina();
    expect(
      screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto }),
    ).toBeDisabled();
    expect(screen.getByText(messages.busqueda.alertaSinFiltros)).toBeInTheDocument();
  });

  it("con un filtro guardable la cabecera habilita crear alerta", async () => {
    rpcMock.mockResolvedValue({
      data: [fila({ name: "Pipa", total_count: 1 })],
      error: null,
    });
    await renderPagina({ especie: "dog" });
    expect(
      screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto }),
    ).toBeEnabled();
  });

  it("pasa los filtros de la URL al RPC", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderPagina({ especie: "cat", pagina: "2" });
    expect(rpcMock).toHaveBeenCalledWith(
      "animals_search",
      expect.objectContaining({ p_species: "cat", p_limit: 12, p_offset: 12 }),
    );
  });

  it("sin resultados muestra el estado vacío", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getByText("No hay animales con esos filtros")).toBeInTheDocument();
  });

  it("si el RPC falla muestra el estado vacío en vez de romper", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    await renderPagina();
    expect(screen.getByText("No hay animales con esos filtros")).toBeInTheDocument();
  });

  it("pagina con números conservando los filtros y ofrece Ver más resultados", async () => {
    rpcMock.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => fila({ name: `Animal ${i}`, total_count: 36 })),
      error: null,
    });
    await renderPagina({ especie: "dog" });
    // 36 resultados a 12 por página → 3 páginas: 1 (actual), 2 y 3 numeradas
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "href",
      "/animales?especie=dog&pagina=2",
    );
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute(
      "href",
      "/animales?especie=dog&pagina=3",
    );
    expect(screen.getByRole("link", { name: messages.busqueda.verMas })).toHaveAttribute(
      "href",
      "/animales?especie=dog&pagina=2",
    );
  });

  it("en la última página no aparece Ver más resultados", async () => {
    rpcMock.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => fila({ name: `Animal ${i}`, total_count: 36 })),
      error: null,
    });
    await renderPagina({ pagina: "3" });
    expect(
      screen.queryByRole("link", { name: messages.busqueda.verMas }),
    ).not.toBeInTheDocument();
    // La página 1 sigue enlazada (sin parámetro pagina)
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/animales");
  });

  it("la paginación lleva flechas anterior/siguiente con destino correcto", async () => {
    rpcMock.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => fila({ name: `Animal ${i}`, total_count: 36 })),
      error: null,
    });
    await renderPagina({ pagina: "2" });
    expect(
      screen.getByRole("link", { name: messages.busqueda.paginaAnterior }),
    ).toHaveAttribute("href", "/animales");
    expect(
      screen.getByRole("link", { name: messages.busqueda.paginaSiguiente }),
    ).toHaveAttribute("href", "/animales?pagina=3");
  });

  it("en la primera página no aparece la flecha de anterior", async () => {
    rpcMock.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => fila({ name: `Animal ${i}`, total_count: 24 })),
      error: null,
    });
    await renderPagina();
    expect(
      screen.queryByRole("link", { name: messages.busqueda.paginaAnterior }),
    ).not.toBeInTheDocument();
  });

  it("en la última página no aparece la flecha de siguiente", async () => {
    rpcMock.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => fila({ name: `Animal ${i}`, total_count: 24 })),
      error: null,
    });
    await renderPagina({ pagina: "2" });
    expect(
      screen.queryByRole("link", { name: messages.busqueda.paginaSiguiente }),
    ).not.toBeInTheDocument();
  });

  it("el resumen móvil de filtros muestra cuántos hay activos", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderPagina({ especie: "dog", ninos: "si" });
    expect(screen.getByText("Filtros (2)")).toBeInTheDocument();
  });

  it("sin ubicación el slider de distancia explica cómo activarse", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getAllByText(messages.busqueda.distanciaAyuda).length).toBeGreaterThan(0);
  });

  it("con una sola página no hay paginación", async () => {
    rpcMock.mockResolvedValue({
      data: [fila({ total_count: 1 })],
      error: null,
    });
    await renderPagina();
    expect(screen.queryByRole("link", { name: "1" })).not.toBeInTheDocument();
  });
});
