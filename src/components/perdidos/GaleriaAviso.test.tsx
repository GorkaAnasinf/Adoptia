import { render as renderRTL, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { GaleriaAviso } from "./GaleriaAviso";
import type { FotoAviso } from "./tipos";

function foto(over: Partial<FotoAviso>): FotoAviso {
  return { id: "x", url: "https://cdn.test/x.jpg", is_cover: false, sort_order: 0, ...over };
}

function render(ui: React.ReactElement) {
  return renderRTL(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("GaleriaAviso", () => {
  it("sin fotos no pinta nada (ni hueco)", () => {
    const { container } = render(<GaleriaAviso fotos={[]} alt="Kira" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("con una sola foto muestra la imagen sin tira de miniaturas", () => {
    render(<GaleriaAviso fotos={[foto({ id: "1", url: "https://cdn.test/a.jpg", is_cover: true })]} alt="Kira" />);
    expect(screen.getByRole("img", { name: "Kira" })).toHaveAttribute(
      "src",
      expect.stringContaining("a.jpg"),
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("la portada es la principal al abrir", () => {
    render(
      <GaleriaAviso
        alt="Kira"
        fotos={[
          foto({ id: "1", url: "https://cdn.test/perfil.jpg", sort_order: 1 }),
          foto({ id: "2", url: "https://cdn.test/frente.jpg", is_cover: true, sort_order: 0 }),
        ]}
      />,
    );
    expect(screen.getByTestId("galeria-principal")).toHaveAttribute(
      "src",
      expect.stringContaining("frente.jpg"),
    );
  });

  it("pulsar una miniatura cambia la foto principal", async () => {
    const user = userEvent.setup();
    render(
      <GaleriaAviso
        alt="Kira"
        fotos={[
          foto({ id: "1", url: "https://cdn.test/frente.jpg", is_cover: true }),
          foto({ id: "2", url: "https://cdn.test/lomo.jpg", sort_order: 1 }),
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /2/ }));
    expect(screen.getByTestId("galeria-principal")).toHaveAttribute(
      "src",
      expect.stringContaining("lomo.jpg"),
    );
  });
});
