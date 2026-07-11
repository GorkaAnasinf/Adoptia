import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const uploadMock = vi.fn();
const removeMock = vi.fn();
const insertSingleMock = vi.fn();
const deleteEqMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        remove: removeMock,
        getPublicUrl: vi.fn((ruta: string) => ({
          data: { publicUrl: `https://cdn.test/storage/v1/object/public/shelter-media/${ruta}` },
        })),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: insertSingleMock })),
      })),
      delete: vi.fn(() => ({ eq: deleteEqMock })),
    })),
  })),
}));

vi.mock("@/lib/image", () => ({
  esImagen: vi.fn((f: File) => f.type.startsWith("image/")),
  comprimirFoto: vi.fn(async (f: File) => f),
  rutaMediaShelter: vi.fn((shelterId: string, f: File) => `${shelterId}/${f.name}`),
}));

import { ShelterMediaUploader, type ShelterMedia } from "./ShelterMediaUploader";

function renderUploader(media: ShelterMedia[] = [], onChange = vi.fn()) {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ShelterMediaUploader shelterId="shelter1" media={media} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return onChange;
}

function foto(nombre = "insta.jpg") {
  return new File(["x"], nombre, { type: "image/jpeg" });
}

describe("ShelterMediaUploader", () => {
  beforeEach(() => {
    uploadMock.mockReset().mockResolvedValue({ error: null });
    removeMock.mockReset().mockResolvedValue({ error: null });
    deleteEqMock.mockReset().mockResolvedValue({ error: null });
    insertSingleMock.mockReset().mockResolvedValue({
      data: { id: "m1", url: "https://cdn.test/x.jpg", sort_order: 0 },
      error: null,
    });
  });

  it("sube la foto a Storage, crea la fila y notifica onChange", async () => {
    const onChange = renderUploader();
    const user = userEvent.setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, foto());

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(uploadMock).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0]).toHaveLength(1);
    expect(onChange.mock.calls[0][0][0].id).toBe("m1");
  });

  it("si Storage falla muestra error y no inserta fila", async () => {
    uploadMock.mockResolvedValue({ error: { message: "boom" } });
    const onChange = renderUploader();
    const user = userEvent.setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, foto());

    expect(await screen.findByText(messages.perfil.errUpload)).toBeInTheDocument();
    expect(insertSingleMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("si la fila falla, borra el fichero subido (sin media huérfana)", async () => {
    insertSingleMock.mockResolvedValue({ data: null, error: { message: "rls" } });
    const onChange = renderUploader();
    const user = userEvent.setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, foto());

    expect(await screen.findByText(messages.perfil.errUpload)).toBeInTheDocument();
    expect(removeMock).toHaveBeenCalledWith(["shelter1/insta.jpg"]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("borrar quita el fichero, la fila y actualiza la lista", async () => {
    const existente: ShelterMedia = {
      id: "m9",
      url: "https://cdn.test/storage/v1/object/public/shelter-media/shelter1/vieja.jpg",
      sort_order: 0,
    };
    const onChange = renderUploader([existente]);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: messages.perfil.deletePhoto }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    expect(removeMock).toHaveBeenCalledWith(["shelter1/vieja.jpg"]);
    expect(deleteEqMock).toHaveBeenCalledWith("id", "m9");
  });

  it("ignora ficheros que no son imagen", async () => {
    const onChange = renderUploader();
    const user = userEvent.setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(["x"], "doc.pdf", { type: "application/pdf" }));

    expect(uploadMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
