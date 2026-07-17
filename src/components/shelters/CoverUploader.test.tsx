import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { CoverUploader } from "./CoverUploader";

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
  return { ...real, comprimirFoto: comprimirMock };
});

function archivo(nombre: string, tipo: string): File {
  return new File([new Uint8Array(1024)], nombre, { type: tipo });
}

function renderUploader(onChange = vi.fn(), initialUrl?: string) {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <CoverUploader shelterId="shelter-123" onChange={onChange} initialUrl={initialUrl} />
    </NextIntlClientProvider>,
  );
  return onChange;
}

describe("CoverUploader", () => {
  beforeEach(() => {
    uploadMock.mockReset().mockResolvedValue({ error: null });
    getPublicUrlMock.mockReset().mockReturnValue({
      data: { publicUrl: "https://cdn/shelter-media/shelter-123/cover.png" },
    });
    comprimirMock.mockReset().mockImplementation(async (f: File) => f);
  });

  it("rechaza un archivo que no es imagen", async () => {
    const onChange = renderUploader();
    const input = screen.getByLabelText(/portada/i) as HTMLInputElement;
    // fireEvent para saltar el filtro `accept` del navegador y probar nuestra guarda
    fireEvent.change(input, { target: { files: [archivo("doc.pdf", "application/pdf")] } });
    expect(await screen.findByText(/debe ser una imagen/i)).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("comprime como foto (panorámica), sube a la carpeta del shelter y devuelve la URL", async () => {
    const user = userEvent.setup();
    const onChange = renderUploader();
    const input = screen.getByLabelText(/portada/i) as HTMLInputElement;
    await user.upload(input, archivo("portada.png", "image/png"));

    expect(comprimirMock).toHaveBeenCalledOnce();
    expect(uploadMock).toHaveBeenCalledOnce();
    expect(uploadMock.mock.calls[0][0]).toBe("shelter-123/cover.png");
    expect(onChange).toHaveBeenCalledWith("https://cdn/shelter-media/shelter-123/cover.png");
  });

  it("muestra la portada actual y permite quitarla", async () => {
    const user = userEvent.setup();
    const onChange = renderUploader(vi.fn(), "https://cdn/shelter-media/shelter-123/cover.png");
    expect(screen.getByAltText(/portada/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /quitar/i }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByAltText(/portada/i)).not.toBeInTheDocument();
  });

  it("muestra error si la subida falla", async () => {
    uploadMock.mockResolvedValue({ error: { message: "boom" } });
    const user = userEvent.setup();
    const onChange = renderUploader();
    const input = screen.getByLabelText(/portada/i) as HTMLInputElement;
    await user.upload(input, archivo("portada.png", "image/png"));
    expect(await screen.findByText(/no se pudo subir/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
