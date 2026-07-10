import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { ListaProtectoras, type ShelterMapResult } from "./ListaProtectoras";

const shelters: ShelterMapResult[] = [
  { id: "1", name: "Protectora Bilbao", slug: "bilbao", city: "Bilbao", distance_m: 1200, animal_count: 3, lat: 43.26, lng: -2.94 },
  { id: "2", name: "Protectora Madrid", slug: "madrid", city: "Madrid", distance_m: null, animal_count: 0, lat: 40.42, lng: -3.7 },
];

function renderLista(selectedId: string | null = null, onSelect = vi.fn()) {
  return {
    onSelect,
    ...render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <ListaProtectoras shelters={shelters} selectedId={selectedId} onSelect={onSelect} />
      </NextIntlClientProvider>,
    ),
  };
}

describe("ListaProtectoras", () => {
  it("muestra nombre, ciudad, distancia y nº de animales", () => {
    renderLista();
    expect(screen.getByText("Protectora Bilbao")).toBeInTheDocument();
    expect(screen.getByText(/Bilbao · 1.2 km/)).toBeInTheDocument();
    expect(screen.getByText("3 animales")).toBeInTheDocument();
  });

  it("protectora sin animales publicados lo indica", () => {
    renderLista();
    expect(screen.getByText("Sin animales publicados")).toBeInTheDocument();
  });

  it("clic en la tarjeta llama a onSelect con el id", async () => {
    const { onSelect } = renderLista();
    await userEvent.click(screen.getByText("Protectora Madrid"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("la protectora seleccionada se marca como activa (aria-pressed)", () => {
    renderLista("1");
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Protectora Bilbao");
  });

  it("el enlace 'Ver protectora' apunta a la ficha pública", () => {
    renderLista();
    const enlace = screen.getAllByRole("link", { name: "Ver protectora" })[0];
    expect(enlace).toHaveAttribute("href", "/protectoras/bilbao");
  });
});
