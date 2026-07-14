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

describe("AnimalSearchFilters — barra horizontal con aplicar", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("cambiar un filtro NO navega hasta pulsar Aplicar filtros", async () => {
    renderFilters();
    await userEvent.selectOptions(screen.getByLabelText(messages.busqueda.especie), "cat");
    expect(replaceMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: messages.busqueda.aplicar }));
    expect(replaceMock).toHaveBeenCalledWith("/animales?especie=cat", { scroll: false });
  });

  it("Aplicar combina especie, tamaño, edad, sexo y convivencia", async () => {
    renderFilters();
    await userEvent.selectOptions(screen.getByLabelText(messages.busqueda.especie), "dog");
    await userEvent.selectOptions(screen.getByLabelText(messages.busqueda.tamano), "small");
    await userEvent.selectOptions(screen.getByLabelText(messages.busqueda.edad), "cachorro");
    await userEvent.selectOptions(screen.getByLabelText(messages.busqueda.sexo), "female");
    await userEvent.click(screen.getByRole("checkbox", { name: messages.busqueda.compatNinos }));
    await userEvent.click(screen.getByRole("button", { name: messages.busqueda.aplicar }));
    expect(replaceMock).toHaveBeenCalledWith(
      "/animales?especie=dog&tamano=small&sexo=female&edad=cachorro&ninos=si",
      { scroll: false },
    );
  });

  it("los filtros de la URL llegan preseleccionados al borrador", () => {
    renderFilters({ especie: "cat", tamano: "large", ninos: "si" });
    expect(screen.getByLabelText(messages.busqueda.especie)).toHaveValue("cat");
    expect(screen.getByLabelText(messages.busqueda.tamano)).toHaveValue("large");
    expect(screen.getByRole("checkbox", { name: messages.busqueda.compatNinos })).toBeChecked();
  });

  it("el texto de búsqueda se aplica como parámetro q", async () => {
    renderFilters();
    await userEvent.type(screen.getByLabelText(messages.busqueda.texto), "labrador");
    await userEvent.click(screen.getByRole("button", { name: messages.busqueda.aplicar }));
    expect(replaceMock).toHaveBeenCalledWith("/animales?q=labrador", { scroll: false });
  });

  it("el término de la URL llega preseleccionado al campo de texto", () => {
    renderFilters({ q: "gato" });
    expect(screen.getByLabelText(messages.busqueda.texto)).toHaveValue("gato");
  });

  it("Limpiar filtros navega a la ruta sin parámetros", async () => {
    renderFilters({ especie: "dog", tamano: "small", ninos: "si" });
    await userEvent.click(screen.getByRole("button", { name: messages.busqueda.limpiar }));
    expect(replaceMock).toHaveBeenCalledWith("/animales", { scroll: false });
  });

  it("el slider de distancia está deshabilitado sin ubicación", () => {
    renderFilters();
    expect(screen.getByLabelText(messages.busqueda.distancia)).toBeDisabled();
  });

  it("'Usar mi ubicación' navega en el momento con las coordenadas", async () => {
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

  it("con ubicación, aplicar conserva lat/lng y añade la distancia elegida", async () => {
    renderFilters({ lat: "43.263", lng: "-2.935" });
    const slider = screen.getByLabelText(messages.busqueda.distancia);
    expect(slider).toBeEnabled();
    // fireEvent de range: userEvent no soporta sliders; cambio directo
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(slider, { target: { value: "50" } });
    await userEvent.click(screen.getByRole("button", { name: messages.busqueda.aplicar }));
    expect(replaceMock).toHaveBeenCalledWith(
      "/animales?distancia=50&lat=43.263&lng=-2.935",
      { scroll: false },
    );
  });
});
