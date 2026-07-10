import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { MapaVacio } from "./MapaVacio";

describe("MapaVacio", () => {
  it("muestra el mensaje de zona sin protectoras y el CTA de unirse", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <MapaVacio />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Aún no hay protectoras en tu zona")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Unir una protectora" });
    expect(cta).toHaveAttribute("href", "/registro");
  });
});
