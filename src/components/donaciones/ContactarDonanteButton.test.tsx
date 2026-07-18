import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { ContactarDonanteButton } from "./ContactarDonanteButton";

function renderBoton() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ContactarDonanteButton offerId="d1" />
    </NextIntlClientProvider>,
  );
}

describe("ContactarDonanteButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("abre el formulario, avisa de la cesión de datos y envía el mensaje", async () => {
    const user = userEvent.setup();
    renderBoton();
    await user.click(screen.getByRole("button", { name: messages.donaciones.contactar }));
    expect(screen.getByText(messages.donaciones.contactarAviso)).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: messages.donaciones.contactarMensaje }),
      "Nos interesa el pienso, pasamos el sábado",
    );
    await user.click(screen.getByRole("button", { name: messages.donaciones.contactarEnviar }));

    expect(await screen.findByText(messages.donaciones.contactarOk)).toBeInTheDocument();
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/donaciones/contactar");
    expect(JSON.parse(init.body as string)).toEqual({
      offer_id: "d1",
      mensaje: "Nos interesa el pienso, pasamos el sábado",
    });
  });

  it("mensaje corto: aviso y sin llamada a la API", async () => {
    const user = userEvent.setup();
    renderBoton();
    await user.click(screen.getByRole("button", { name: messages.donaciones.contactar }));
    await user.type(
      screen.getByRole("textbox", { name: messages.donaciones.contactarMensaje }),
      "hola",
    );
    await user.click(screen.getByRole("button", { name: messages.donaciones.contactarEnviar }));
    expect(screen.getByText(messages.donaciones.contactarCorto)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("error de la API: mensaje de error y se puede reintentar", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    renderBoton();
    await user.click(screen.getByRole("button", { name: messages.donaciones.contactar }));
    await user.type(
      screen.getByRole("textbox", { name: messages.donaciones.contactarMensaje }),
      "Nos interesa el transportín grande",
    );
    await user.click(screen.getByRole("button", { name: messages.donaciones.contactarEnviar }));
    expect(await screen.findByText(messages.donaciones.contactarError)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.donaciones.contactarEnviar }),
    ).toBeEnabled();
  });
});
