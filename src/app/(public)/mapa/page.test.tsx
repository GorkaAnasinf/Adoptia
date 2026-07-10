import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc: rpcMock })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/mapa",
}));

vi.mock("@/components/map/MapaProtectoras", () => ({
  MapaProtectoras: () => <div data-testid="mapa-stub" />,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import MapaPage from "./page";

const fila = (extra: Record<string, unknown>) => ({
  id: crypto.randomUUID(),
  name: "Protectora Bilbao",
  slug: "protectora-bilbao",
  city: "Bilbao",
  distance_m: 1200,
  animal_count: 3,
  lat: 43.26,
  lng: -2.94,
  ...extra,
});

async function renderPagina(params: Record<string, string> = {}) {
  const ui = await MapaPage({ searchParams: Promise.resolve(params) });
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Página /mapa", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("pinta el listado de protectoras devuelto por el RPC", async () => {
    rpcMock.mockResolvedValue({ data: [fila({})], error: null });
    await renderPagina();
    expect(screen.getAllByText("Protectora Bilbao").length).toBeGreaterThan(0);
  });

  it("pasa los chips activos y la ubicación al RPC", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await renderPagina({ perros: "si", lat: "43.263", lng: "-2.935" });
    expect(rpcMock).toHaveBeenCalledWith(
      "shelters_nearby",
      expect.objectContaining({ p_species: "dog", lat: 43.263, lng: -2.935 }),
    );
  });

  it("si el RPC falla muestra el estado vacío en vez de romper", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    await renderPagina();
    expect(screen.getAllByText("Aún no hay protectoras en tu zona").length).toBeGreaterThan(0);
  });
});
