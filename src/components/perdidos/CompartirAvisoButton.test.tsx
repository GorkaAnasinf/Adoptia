import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { CompartirAvisoButton } from "./CompartirAvisoButton";

function renderBoton() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <CompartirAvisoButton titulo="Rocky" />
    </NextIntlClientProvider>,
  );
}

describe("CompartirAvisoButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("con Web Share API comparte la URL de la ficha", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    const user = userEvent.setup();
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.perdidos.compartir }));
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Rocky", url: window.location.href }),
    );
  });

  it("sin Web Share API copia el enlace y lo confirma", async () => {
    // jsdom no tiene `navigator.share`; el portapapeles es el stub que instala
    // el propio userEvent.setup(), así que se espía en vez de reemplazarlo.
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.perdidos.compartir }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText(messages.perdidos.compartirCopiado)).toBeInTheDocument();
  });

  it("si el usuario cancela el share nativo no revienta", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancel", "AbortError"));
    vi.stubGlobal("navigator", { ...navigator, share });
    const user = userEvent.setup();
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.perdidos.compartir }));
    expect(share).toHaveBeenCalled();
    expect(screen.queryByText(messages.perdidos.compartirCopiado)).not.toBeInTheDocument();
  });
});
