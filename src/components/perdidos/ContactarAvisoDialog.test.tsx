import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

import { ContactarAvisoDialog } from "./ContactarAvisoDialog";

function renderDialog() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ContactarAvisoDialog avisoId="p1" />
    </NextIntlClientProvider>,
  );
}

function respuesta(status: number, body: unknown = {}) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

async function abrir(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: messages.perdidos.contactar }));
}

describe("ContactarAvisoDialog", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", respuesta(200, { data: { ok: true } }));
  });

  it("avisa de que se comparte el correo del remitente, no el del autor", async () => {
    const user = userEvent.setup();
    renderDialog();
    await abrir(user);
    expect(screen.getByText(messages.perdidos.contactarCesion)).toBeInTheDocument();
  });

  it("no envía un mensaje demasiado corto", async () => {
    const user = userEvent.setup();
    renderDialog();
    await abrir(user);
    await user.type(screen.getByLabelText(messages.perdidos.contactarMensaje), "hola");
    await user.click(screen.getByRole("button", { name: messages.perdidos.contactarEnviar }));
    expect(await screen.findByText(messages.perdidos.contactarCorto)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envía el mensaje y confirma sin revelar nada del autor", async () => {
    const user = userEvent.setup();
    renderDialog();
    await abrir(user);
    await user.type(
      screen.getByLabelText(messages.perdidos.contactarMensaje),
      "Creo que la vi cerca del río esta mañana",
    );
    await user.click(screen.getByRole("button", { name: messages.perdidos.contactarEnviar }));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/perdidos/p1/contactar");
    expect(JSON.parse((init as RequestInit).body as string).mensaje).toBe(
      "Creo que la vi cerca del río esta mañana",
    );
    expect(await screen.findByText(messages.perdidos.contactarOk)).toBeInTheDocument();
  });

  it("traduce el 429 a un aviso de límite", async () => {
    vi.stubGlobal("fetch", respuesta(429, { error: { code: "rate_limited" } }));
    const user = userEvent.setup();
    renderDialog();
    await abrir(user);
    await user.type(screen.getByLabelText(messages.perdidos.contactarMensaje), "Mensaje suficiente");
    await user.click(screen.getByRole("button", { name: messages.perdidos.contactarEnviar }));
    expect(await screen.findByText(messages.perdidos.contactarLimite)).toBeInTheDocument();
  });

  it("explica que el autor cerró el contacto cuando el servidor responde 409", async () => {
    vi.stubGlobal("fetch", respuesta(409, { error: { code: "contacto_cerrado" } }));
    const user = userEvent.setup();
    renderDialog();
    await abrir(user);
    await user.type(screen.getByLabelText(messages.perdidos.contactarMensaje), "Mensaje suficiente");
    await user.click(screen.getByRole("button", { name: messages.perdidos.contactarEnviar }));
    expect(await screen.findByText(messages.perdidos.contactarCerrado)).toBeInTheDocument();
  });

  it("si la red falla deja reintentar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const user = userEvent.setup();
    renderDialog();
    await abrir(user);
    await user.type(screen.getByLabelText(messages.perdidos.contactarMensaje), "Mensaje suficiente");
    await user.click(screen.getByRole("button", { name: messages.perdidos.contactarEnviar }));
    expect(await screen.findByText(messages.perdidos.contactarError)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.perdidos.contactarEnviar })).toBeEnabled();
  });
});
