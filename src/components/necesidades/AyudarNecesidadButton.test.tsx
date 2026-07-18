import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AyudarNecesidadButton } from "./AyudarNecesidadButton";

const NEED_ID = "44444444-4444-4444-8444-444444444444";

function renderBoton(autenticado: boolean) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AyudarNecesidadButton needId={NEED_ID} autenticado={autenticado} />
    </NextIntlClientProvider>,
  );
}

describe("AyudarNecesidadButton", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { ok: true } }), { status: 200 })),
    );
  });

  it("sin sesión: enlace a login, no formulario", () => {
    renderBoton(false);
    const enlace = screen.getByRole("link", { name: messages.necesidades.ayudar });
    expect(enlace).toHaveAttribute("href", "/login");
  });

  it("mensaje corto: no envía y lo explica", async () => {
    const user = userEvent.setup();
    renderBoton(true);
    await user.click(screen.getByRole("button", { name: messages.necesidades.ayudar }));
    await user.type(screen.getByLabelText(messages.necesidades.ayudarMensaje), "hola");
    await user.click(screen.getByRole("button", { name: messages.necesidades.ayudarEnviar }));
    expect(screen.getByText(messages.necesidades.ayudarCorto)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envía el mensaje con el aviso de Reply-To visible y confirma", async () => {
    const user = userEvent.setup();
    renderBoton(true);
    await user.click(screen.getByRole("button", { name: messages.necesidades.ayudar }));
    expect(screen.getByText(messages.necesidades.ayudarAviso)).toBeInTheDocument();
    await user.type(
      screen.getByLabelText(messages.necesidades.ayudarMensaje),
      "Tengo dos sacos de pienso sin abrir",
    );
    await user.click(screen.getByRole("button", { name: messages.necesidades.ayudarEnviar }));

    await waitFor(() => {
      expect(screen.getByText(messages.necesidades.ayudarOk)).toBeInTheDocument();
    });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init!.body as string)).toEqual({
      need_id: NEED_ID,
      mensaje: "Tengo dos sacos de pienso sin abrir",
    });
  });
});
