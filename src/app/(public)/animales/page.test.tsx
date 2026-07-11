import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc: rpcMock })),
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

  it("pinta las tarjetas devueltas por el RPC y el recuento", async () => {
    rpcMock.mockResolvedValue({
      data: [
        fila({ name: "Pipa", total_count: 2 }),
        fila({ name: "Golfo", total_count: 2 }),
      ],
      error: null,
    });
    await renderPagina();
    expect(screen.getByRole("heading", { level: 1, name: "Animales en adopción" })).toBeInTheDocument();
    expect(screen.getByText("Pipa")).toBeInTheDocument();
    expect(screen.getByText("Golfo")).toBeInTheDocument();
    expect(screen.getByText("2 animales")).toBeInTheDocument();
  });

  it("pasa los filtros de la URL al RPC", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderPagina({ especie: "cat", pagina: "2" });
    expect(rpcMock).toHaveBeenCalledWith(
      "animals_search",
      expect.objectContaining({ p_species: "cat", p_offset: 24 }),
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

  it("pagina conservando los filtros en los enlaces", async () => {
    rpcMock.mockResolvedValue({
      data: Array.from({ length: 24 }, (_, i) => fila({ name: `Animal ${i}`, total_count: 60 })),
      error: null,
    });
    await renderPagina({ especie: "dog" });
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    const siguiente = screen.getByRole("link", { name: "Siguiente" });
    expect(siguiente).toHaveAttribute("href", "/animales?especie=dog&pagina=2");
    expect(screen.queryByRole("link", { name: "Anterior" })).not.toBeInTheDocument();
  });

  it("en páginas intermedias enlaza a anterior y siguiente", async () => {
    rpcMock.mockResolvedValue({
      data: Array.from({ length: 24 }, (_, i) => fila({ name: `Animal ${i}`, total_count: 60 })),
      error: null,
    });
    await renderPagina({ pagina: "2" });
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/animales");
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/animales?pagina=3",
    );
  });
});
