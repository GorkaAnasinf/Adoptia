import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { PopupAviso } from "./PopupAviso";
import type { AvisoMapa } from "./tipos";

const AVISO: AvisoMapa = {
  id: "p1",
  type: "lost",
  species: "dog",
  name: "Kira",
  description: "Perdida en el parque",
  cover_url: null,
  city: "Bilbao",
  status: "open",
  breed: null,
  color: null,
  sex: null,
  size: "medium",
  has_collar: null,
  collar_description: null,
  has_microchip: null,
  occurred_on: "2026-07-19",
  lat: 43.264,
  lng: -2.934,
  created_at: "2026-07-19T00:00:00Z",
};

function renderPopup(aviso: AvisoMapa = AVISO) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PopupAviso aviso={aviso} />
    </NextIntlClientProvider>,
  );
}

const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });

describe("PopupAviso", () => {
  it("muestra el nombre en terracota y la línea ciudad · fecha del suceso", () => {
    renderPopup();
    const titulo = screen.getByTestId("popup-titulo");
    expect(titulo).toHaveTextContent("Kira");
    expect(titulo.className).toContain("text-primary");
    expect(
      screen.getByText(`Bilbao · Perdido el ${fmt.format(new Date("2026-07-19"))}`),
    ).toBeInTheDocument();
  });

  it("sin nombre cae al tipo como título", () => {
    renderPopup({ ...AVISO, type: "found", name: null });
    expect(screen.getByTestId("popup-titulo")).toHaveTextContent(messages.perdidos.tipoFound);
  });

  it("sin ciudad, la línea es solo la fecha del suceso", () => {
    renderPopup({ ...AVISO, city: null });
    expect(
      screen.getByText(`Perdido el ${fmt.format(new Date("2026-07-19"))}`),
    ).toBeInTheDocument();
  });

  it("el chip tonal usa granate suave para un aviso de perdido", () => {
    renderPopup();
    const chip = screen.getByTestId("popup-chip");
    expect(chip).toHaveTextContent(messages.perdidos.tipoLost);
    expect(chip.className).toContain("bg-primary/10");
  });

  it("el chip tonal usa teal suave para un aviso de encontrado", () => {
    renderPopup({ ...AVISO, type: "found" });
    const chip = screen.getByTestId("popup-chip");
    expect(chip).toHaveTextContent(messages.perdidos.tipoFound);
    expect(chip.className).toContain("bg-secondary/10");
  });

  it("el CTA «Ver aviso» es un enlace granate a la ficha del aviso", () => {
    renderPopup();
    const cta = screen.getByRole("link", { name: messages.perdidos.verAviso });
    expect(cta).toHaveAttribute("href", "/perdidos-encontrados/p1");
    expect(cta.className).toContain("bg-primary");
  });
});
