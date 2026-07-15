import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("./MapaAvisos", () => ({
  MapaAvisos: ({ avisos }: { avisos: unknown[] }) => (
    <div data-testid="mapa-avisos" data-count={avisos.length} />
  ),
}));

import { PerdidosView } from "./PerdidosView";
import type { AvisoMapa } from "./tipos";

const hace = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

const SIN_DATOS = {
  breed: null,
  color: null,
  sex: null,
  has_collar: null,
  collar_description: null,
  has_microchip: null,
};

const AVISOS: AvisoMapa[] = [
  {
    ...SIN_DATOS,
    id: "p1",
    type: "lost",
    species: "dog",
    name: "Rocky",
    description: "Perdido en el parque",
    photo_url: null,
    city: "Bilbao",
    status: "open",
    size: "large",
    occurred_on: hace(2),
    lat: 43.264,
    lng: -2.934,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    ...SIN_DATOS,
    id: "p2",
    type: "found",
    species: "cat",
    name: null,
    description: "Gata encontrada",
    photo_url: null,
    city: "Getxo",
    status: "open",
    size: "small",
    occurred_on: hace(20),
    lat: 43.35,
    lng: -3.01,
    created_at: "2026-07-02T00:00:00Z",
  },
];

function renderVista(avisos = AVISOS) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PerdidosView avisos={avisos} />
    </NextIntlClientProvider>,
  );
}

describe("PerdidosView", () => {
  it("muestra todos los avisos con distinción visual perdido/encontrado", () => {
    renderVista();
    expect(screen.getByRole("link", { name: "Rocky" })).toHaveAttribute(
      "href",
      "/perdidos-encontrados/p1",
    );
    expect(screen.getAllByText(messages.perdidos.tipoLost).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(messages.perdidos.tipoFound).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "2");
  });

  it("el filtro 'Perdidos' deja fuera los encontrados (mapa y lista)", async () => {
    const user = userEvent.setup();
    renderVista();
    await user.click(screen.getByRole("button", { name: messages.perdidos.filtroLost }));

    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Getxo")).not.toBeInTheDocument();
  });

  it("sin avisos muestra el estado vacío", () => {
    renderVista([]);
    expect(screen.getByText(messages.perdidos.vacio)).toBeInTheDocument();
  });

  it("muestra el aviso de privacidad de la ubicación", () => {
    renderVista();
    expect(screen.getByText(messages.perdidos.avisoPrivacidad)).toBeInTheDocument();
  });

  // FEATURE-023 — filtros
  it("filtra por especie (mapa y lista a la vez)", async () => {
    const user = userEvent.setup();
    renderVista();
    await user.selectOptions(
      screen.getByLabelText(messages.perdidos.filtroEspecie),
      "cat",
    );
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("Getxo")).toBeInTheDocument();
    expect(screen.queryByText("Rocky")).not.toBeInTheDocument();
  });

  it("filtra por tamaño", async () => {
    const user = userEvent.setup();
    renderVista();
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroTamano), "large");
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Getxo")).not.toBeInTheDocument();
  });

  it("filtra por fecha del suceso, no por la de publicación", async () => {
    const user = userEvent.setup();
    renderVista();
    // p1 ocurrió hace 2 días, p2 hace 20 — pero ambos se publicaron en julio.
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroFecha), "7");
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Getxo")).not.toBeInTheDocument();
  });

  it("combina los filtros con el de perdido/encontrado", async () => {
    const user = userEvent.setup();
    renderVista();
    await user.click(screen.getByRole("button", { name: messages.perdidos.filtroLost }));
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroEspecie), "cat");
    // Perdido + gato: no hay ninguno.
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "0");
    expect(screen.getByText(messages.perdidos.vacioFiltros)).toBeInTheDocument();
  });

  it("distingue 'no hay avisos' de 'ninguno encaja con los filtros'", async () => {
    const user = userEvent.setup();
    const { rerender } = renderVista();
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroTamano), "medium");
    expect(screen.getByText(messages.perdidos.vacioFiltros)).toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="es" messages={messages}>
        <PerdidosView avisos={[]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.perdidos.vacio)).toBeInTheDocument();
  });
});
