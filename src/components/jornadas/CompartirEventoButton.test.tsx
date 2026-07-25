import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { CompartirEventoButton } from "./CompartirEventoButton";

function renderBoton() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <CompartirEventoButton titulo="Jornada en la plaza" />
    </NextIntlClientProvider>,
  );
}

describe("CompartirEventoButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("con Web Share API comparte la URL de la ficha", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    const user = userEvent.setup();
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.jornadas.compartir }));
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Jornada en la plaza", url: window.location.href }),
    );
  });

  it("sin Web Share API copia el enlace y lo confirma", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.jornadas.compartir }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText(messages.jornadas.compartirCopiado)).toBeInTheDocument();
  });
});
