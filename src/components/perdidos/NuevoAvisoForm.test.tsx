import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: ({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) => (
    <button type="button" data-testid="pin" onClick={() => onChange({ lat: 43.26, lng: -2.94 })} />
  ),
}));

vi.mock("@/lib/image", () => ({
  esImagen: vi.fn(() => true),
  comprimirFoto: vi.fn(async (f: File) => f),
}));

const insertMock = vi.fn();
const uploadMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ insert: insertMock })),
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://cdn.test/foto.jpg" } })),
      })),
    },
  })),
}));

import { NuevoAvisoForm } from "./NuevoAvisoForm";

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <NuevoAvisoForm userId="u1" />
    </NextIntlClientProvider>,
  );
}

describe("NuevoAvisoForm", () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    uploadMock.mockReset().mockResolvedValue({ error: null });
  });

  it("exige descripción y pin antes de publicar", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));
    expect(screen.getByText(messages.perdidos.fFaltaDescripcion)).toBeInTheDocument();

    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido en el parque");
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));
    expect(screen.getByText(messages.perdidos.fFaltaPin)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("publica un aviso de encontrado con foto y ubicación", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByLabelText(messages.perdidos.fTipoFound));
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Gata encontrada con collar rojo");
    await user.type(screen.getByLabelText(messages.perdidos.fCiudad), "Getxo");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["x"], "gata.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledOnce());
    const fila = insertMock.mock.calls[0][0];
    expect(fila.type).toBe("found");
    expect(fila.location).toBe("POINT(-2.94 43.26)");
    expect(fila.photo_url).toBe("https://cdn.test/foto.jpg");
    expect(uploadMock).toHaveBeenCalledOnce();
    expect(await screen.findByText(messages.perdidos.okTitle)).toBeInTheDocument();
  });

  // FEATURE-022
  it("por defecto publica sin teléfono y aceptando mensajes por la plataforma", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledOnce());
    const fila = insertMock.mock.calls[0][0];
    expect(fila.contact_phone).toBeNull();
    expect(fila.allow_contact).toBe(true);
  });

  it("guarda el teléfono si el autor lo publica, y avisa de las estafas", async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.getByText(messages.perdidos.fTelefonoAviso)).toBeInTheDocument();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.type(screen.getByLabelText(messages.perdidos.fTelefono), "600111222");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledOnce());
    expect(insertMock.mock.calls[0][0].contact_phone).toBe("600111222");
  });

  it("rechaza un teléfono con formato imposible antes de llamar a BD", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.type(screen.getByLabelText(messages.perdidos.fTelefono), "llámame :)");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));
    expect(await screen.findByText(messages.perdidos.fTelefonoInvalido)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("el autor puede cerrar los mensajes por la plataforma", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.click(screen.getByLabelText(messages.perdidos.fPermitirContacto));
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledOnce());
    expect(insertMock.mock.calls[0][0].allow_contact).toBe(false);
  });

  it("si la BD falla muestra el error y permite reintentar", async () => {
    insertMock.mockResolvedValue({ error: { message: "boom" } });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Texto suficiente");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));
    expect(await screen.findByText(messages.perdidos.fError)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.perdidos.fEnviar })).toBeEnabled();
  });
});
