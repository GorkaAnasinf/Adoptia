import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { parseSheltersSearch } from "@/lib/shelters-search";
import type { ShelterMapResult } from "./ListaProtectoras";
import { MapaShell } from "./MapaShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/mapa",
}));

const mapaSelectMock = vi.fn();
vi.mock("./MapaProtectoras", () => ({
  MapaProtectoras: (props: { selectedId: string | null; onSelect: (id: string) => void }) => {
    mapaSelectMock(props.selectedId);
    return (
      <button type="button" onClick={() => props.onSelect("2")} data-testid="mapa-stub">
        mapa
      </button>
    );
  },
}));

const shelters: ShelterMapResult[] = [
  { id: "1", name: "Protectora Bilbao", slug: "bilbao", city: "Bilbao", distance_m: 1000, animal_count: 2, lat: 43.26, lng: -2.94 },
  { id: "2", name: "Protectora Madrid", slug: "madrid", city: "Madrid", distance_m: 5000, animal_count: 1, lat: 40.42, lng: -3.7 },
];

function renderShell(lista = shelters) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <MapaShell shelters={lista} search={parseSheltersSearch({})} />
    </NextIntlClientProvider>,
  );
}

describe("MapaShell", () => {
  it("muestra los filtros y el listado de protectoras", () => {
    renderShell();
    expect(screen.getAllByText("Filtros").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Protectora Bilbao").length).toBeGreaterThan(0);
  });

  it("clic en una protectora de la lista sincroniza la selección con el mapa", async () => {
    renderShell();
    await userEvent.click(screen.getAllByText("Protectora Madrid")[0]);
    expect(mapaSelectMock).toHaveBeenLastCalledWith("2");
  });

  it("sin protectoras muestra el estado vacío en vez del listado", () => {
    renderShell([]);
    expect(screen.getAllByText("Aún no hay protectoras en tu zona").length).toBeGreaterThan(0);
  });

  it("el bottom sheet móvil empieza abierto", () => {
    renderShell();
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-state", "open");
  });

  it("tocar el tirador colapsa el bottom sheet, y volver a tocarlo lo reabre", async () => {
    renderShell();
    const tirador = screen.getByRole("button", { name: "Mostrar u ocultar filtros y protectoras" });
    expect(tirador).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(tirador);
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-state", "collapsed");
    expect(tirador).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(tirador);
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-state", "open");
  });

  it("arrastrar el tirador hacia abajo colapsa el bottom sheet", () => {
    renderShell();
    const tirador = screen.getByRole("button", { name: "Mostrar u ocultar filtros y protectoras" });
    fireEvent.pointerDown(tirador, { clientY: 100 });
    fireEvent.pointerUp(tirador, { clientY: 200 });
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-state", "collapsed");
  });

  it("con el sheet colapsado, arrastrar hacia arriba lo reabre", async () => {
    renderShell();
    const tirador = screen.getByRole("button", { name: "Mostrar u ocultar filtros y protectoras" });
    await userEvent.click(tirador);
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-state", "collapsed");

    fireEvent.pointerDown(tirador, { clientY: 200 });
    fireEvent.pointerUp(tirador, { clientY: 100 });
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-state", "open");
  });

  it("un arrastre pequeño (dead zone) no cambia el estado", () => {
    renderShell();
    const tirador = screen.getByRole("button", { name: "Mostrar u ocultar filtros y protectoras" });
    fireEvent.pointerDown(tirador, { clientY: 100 });
    fireEvent.pointerUp(tirador, { clientY: 120 });
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-state", "open");
  });
});
