import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { parseSheltersSearch } from "@/lib/shelters-search";
import { MapaFiltros } from "./MapaFiltros";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/mapa",
}));

function renderFiltros(params: Record<string, string> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <MapaFiltros search={parseSheltersSearch(params)} />
    </NextIntlClientProvider>,
  );
}

describe("MapaFiltros", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.restoreAllMocks();
  });

  it("activar el chip 'perros' actualiza la URL", async () => {
    renderFiltros();
    await userEvent.click(screen.getByRole("button", { name: "Perros" }));
    expect(replaceMock).toHaveBeenCalledWith("/mapa?perros=si", { scroll: false });
  });

  it("los chips son combinables (perros + acogida)", async () => {
    renderFiltros({ perros: "si" });
    await userEvent.click(screen.getByRole("button", { name: "Acogida" }));
    expect(replaceMock).toHaveBeenCalledWith("/mapa?perros=si&acogida=si", { scroll: false });
  });

  it("'Usar mi ubicación' pide geolocalización y navega con lat/lng", async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: 43.2631, longitude: -2.9351 } } as GeolocationPosition),
    );
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });

    renderFiltros();
    await userEvent.click(screen.getByRole("button", { name: /usar mi ubicación/i }));
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/mapa?lat=43.263&lng=-2.935", { scroll: false });
    vi.unstubAllGlobals();
  });

  it("geolocalización denegada muestra error y el buscador de ciudad sigue funcionando", async () => {
    const getCurrentPosition = vi.fn((_ok: PositionCallback, err: PositionErrorCallback) =>
      err({ code: 1, message: "denegado" } as GeolocationPositionError),
    );
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { lat: 43.263, lng: -2.935 } }), { status: 200 }),
    );

    renderFiltros();
    await userEvent.click(screen.getByRole("button", { name: /usar mi ubicación/i }));
    expect(await screen.findByText(/no se pudo obtener tu ubicación/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/ciudad/i), "Bilbao");
    await userEvent.click(screen.getByRole("button", { name: /buscar/i }));
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/mapa?lat=43.263&lng=-2.935", { scroll: false }),
    );
    vi.unstubAllGlobals();
  });

  it("ciudad no encontrada muestra mensaje claro", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { lat: null, lng: null } }), { status: 200 }),
    );
    renderFiltros();
    await userEvent.type(screen.getByLabelText(/ciudad/i), "Ciudad Inventada");
    await userEvent.click(screen.getByRole("button", { name: /buscar/i }));
    expect(await screen.findByText(/no hemos encontrado esa ciudad/i)).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
