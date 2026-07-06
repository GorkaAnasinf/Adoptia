import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { LogoUploader } from "./LogoUploader";

const { uploadMock, getPublicUrlMock, comprimirMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
  comprimirMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock })),
    },
  })),
}));

vi.mock("@/lib/image", async (orig) => {
  const real = await orig<typeof import("@/lib/image")>();
  return { ...real, comprimirLogo: comprimirMock };
});

function archivo(nombre: string, tipo: string): File {
  return new File([new Uint8Array(1024)], nombre, { type: tipo });
}

function renderUploader(onUploaded = vi.fn()) {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <LogoUploader shelterId="shelter-123" onUploaded={onUploaded} />
    </NextIntlClientProvider>,
  );
  return onUploaded;
}

describe("LogoUploader", () => {
  beforeEach(() => {
    uploadMock.mockReset().mockResolvedValue({ error: null });
    getPublicUrlMock.mockReset().mockReturnValue({
      data: { publicUrl: "https://cdn/logos/shelter-123/logo.png" },
    });
    comprimirMock.mockReset().mockImplementation(async (f: File) => f);
  });

  it("rechaza un archivo que no es imagen", async () => {
    const onUploaded = renderUploader();
    const input = screen.getByLabelText(/logo/i) as HTMLInputElement;
    // fireEvent para saltar el filtro `accept` del navegador y probar nuestra guarda
    fireEvent.change(input, { target: { files: [archivo("doc.pdf", "application/pdf")] } });
    expect(await screen.findByText(/debe ser una imagen/i)).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("comprime, sube y devuelve la URL pública", async () => {
    const user = userEvent.setup();
    const onUploaded = renderUploader();
    const input = screen.getByLabelText(/logo/i) as HTMLInputElement;
    await user.upload(input, archivo("logo.png", "image/png"));

    expect(comprimirMock).toHaveBeenCalledOnce();
    expect(uploadMock).toHaveBeenCalledOnce();
    // ruta dentro de la carpeta del shelter
    expect(uploadMock.mock.calls[0][0]).toBe("shelter-123/logo.png");
    expect(onUploaded).toHaveBeenCalledWith("https://cdn/logos/shelter-123/logo.png");
  });
});
