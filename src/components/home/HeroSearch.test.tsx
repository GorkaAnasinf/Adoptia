import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { HeroSearch } from "./HeroSearch";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderBuscador() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <HeroSearch />
    </NextIntlClientProvider>,
  );
}

describe("HeroSearch — buscador del hero", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sin ciudad navega al listado filtrado solo por especie", async () => {
    renderBuscador();
    fireEvent.change(screen.getByLabelText(messages.home.searchSpeciesLabel), {
      target: { value: "dog" },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.home.searchButton }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/animales?especie=dog"));
  });

  it("sin ciudad ni especie lleva al listado completo", async () => {
    renderBuscador();
    fireEvent.click(screen.getByRole("button", { name: messages.home.searchButton }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/animales"));
  });

  it("con ciudad geocodifica y navega ordenado por cercanía", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { lat: 43.263, lng: -2.935 } }),
    });
    renderBuscador();
    fireEvent.change(screen.getByLabelText(messages.home.searchSpeciesLabel), {
      target: { value: "cat" },
    });
    fireEvent.change(screen.getByPlaceholderText(messages.home.searchCityPlaceholder), {
      target: { value: "Bilbao" },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.home.searchButton }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/animales?especie=cat&lat=43.263&lng=-2.935&orden=cercanos"),
    );
    expect(fetch).toHaveBeenCalledWith("/api/geocode?q=Bilbao");
  });

  it("ciudad no encontrada muestra error accesible y no navega", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { lat: null, lng: null } }),
    });
    renderBuscador();
    fireEvent.change(screen.getByPlaceholderText(messages.home.searchCityPlaceholder), {
      target: { value: "Villainventada" },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.home.searchButton }));
    expect(await screen.findByRole("alert")).toHaveTextContent(messages.home.searchCityNotFound);
    expect(push).not.toHaveBeenCalled();
  });

  it("«Usar mi ubicación» navega con las coordenadas del navegador", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok: (pos: { coords: { latitude: number; longitude: number } }) => void) =>
          ok({ coords: { latitude: 40.4168, longitude: -3.7038 } }),
      },
    });
    renderBuscador();
    fireEvent.click(screen.getByRole("button", { name: messages.home.searchUseLocation }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/animales?lat=40.4168&lng=-3.7038&orden=cercanos"),
    );
  });

  it("permiso de ubicación denegado muestra mensaje amable", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (_ok: unknown, ko: (e: unknown) => void) => ko(new Error("denegado")),
      },
    });
    renderBuscador();
    fireEvent.click(screen.getByRole("button", { name: messages.home.searchUseLocation }));
    expect(await screen.findByRole("alert")).toHaveTextContent(messages.home.searchGeoDenied);
    expect(push).not.toHaveBeenCalled();
  });
});
