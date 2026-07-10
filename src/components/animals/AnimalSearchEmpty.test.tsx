import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalSearchEmpty } from "./AnimalSearchEmpty";

describe("AnimalSearchEmpty", () => {
  it("muestra mensaje amable y CTA de alerta deshabilitado (hasta FEATURE-010)", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <AnimalSearchEmpty />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("No hay animales con esos filtros")).toBeInTheDocument();
    expect(
      screen.getByText("Prueba a ampliar la distancia o a quitar algún filtro."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear alerta/i })).toBeDisabled();
  });
});
