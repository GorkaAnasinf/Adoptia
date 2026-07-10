import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalGallery } from "./AnimalGallery";

const FOTOS = [
  { url: "https://example.com/1.jpg", is_cover: false, sort_order: 1 },
  { url: "https://example.com/0.jpg", is_cover: true, sort_order: 0 },
  { url: "https://example.com/2.jpg", is_cover: false, sort_order: 2 },
];

function renderGallery(media = FOTOS) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalGallery name="Pipa" media={media} />
    </NextIntlClientProvider>,
  );
}

describe("AnimalGallery", () => {
  it("muestra la portada como imagen principal con alt del animal", () => {
    renderGallery();
    const principal = screen.getByRole("img", { name: "Foto 1 de 3" });
    expect(principal).toHaveAttribute("src", expect.stringContaining("0.jpg"));
  });

  it("cambiar de miniatura (botones accesibles) cambia la imagen principal", async () => {
    renderGallery();
    await userEvent.click(screen.getByRole("button", { name: "Ver foto 3" }));
    const principal = screen.getByRole("img", { name: "Foto 3 de 3" });
    expect(principal).toHaveAttribute("src", expect.stringContaining("2.jpg"));
  });

  it("con una sola foto no pinta miniaturas", () => {
    renderGallery([FOTOS[0]]);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("sin fotos muestra placeholder sin romper", () => {
    renderGallery([]);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
