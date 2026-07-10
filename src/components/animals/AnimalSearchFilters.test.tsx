import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { parseAnimalSearch } from "@/lib/animal-search";
import { AnimalSearchFilters } from "./AnimalSearchFilters";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/animales",
}));

function renderFilters(params: Record<string, string> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalSearchFilters search={parseAnimalSearch(params)} />
    </NextIntlClientProvider>,
  );
}

describe("AnimalSearchFilters", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("elegir especie actualiza la URL y resetea la página", async () => {
    renderFilters({ pagina: "3" });
    await userEvent.click(screen.getByRole("button", { name: "Gato" }));
    expect(replaceMock).toHaveBeenCalledWith("/animales?especie=cat", { scroll: false });
  });

  it("los filtros activos se pueden quitar volviendo a pulsar el chip", async () => {
    renderFilters({ especie: "dog" });
    await userEvent.click(screen.getByRole("button", { name: "Perro" }));
    expect(replaceMock).toHaveBeenCalledWith("/animales", { scroll: false });
  });

  it("el tamaño es combinable (multi-selección)", async () => {
    renderFilters({ tamano: "small" });
    await userEvent.click(screen.getByRole("button", { name: "Mediano" }));
    expect(replaceMock).toHaveBeenCalledWith("/animales?tamano=small%2Cmedium", {
      scroll: false,
    });
  });

  it("'Más cercanos' está deshabilitado sin ubicación", () => {
    renderFilters();
    expect(screen.getByRole("button", { name: /más cercanos/i })).toBeDisabled();
  });

  it("con ubicación, 'Más cercanos' ordena por cercanía", async () => {
    renderFilters({ lat: "43.263", lng: "-2.935" });
    const boton = screen.getByRole("button", { name: /más cercanos/i });
    expect(boton).toBeEnabled();
    await userEvent.click(boton);
    expect(replaceMock).toHaveBeenCalledWith(
      "/animales?lat=43.263&lng=-2.935&orden=cercanos",
      { scroll: false },
    );
  });

  it("'Usar mi ubicación' pide la geolocalización y la lleva a la URL", async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: 43.2631, longitude: -2.9351 } } as GeolocationPosition),
    );
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });

    renderFilters();
    await userEvent.click(screen.getByRole("button", { name: /usar mi ubicación/i }));
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/animales?lat=43.263&lng=-2.935", {
      scroll: false,
    });
    vi.unstubAllGlobals();
  });

  it("'Quitar filtros' limpia la búsqueda", async () => {
    renderFilters({ especie: "dog", tamano: "small", ninos: "si" });
    await userEvent.click(screen.getByRole("button", { name: /quitar filtros/i }));
    expect(replaceMock).toHaveBeenCalledWith("/animales", { scroll: false });
  });
});
