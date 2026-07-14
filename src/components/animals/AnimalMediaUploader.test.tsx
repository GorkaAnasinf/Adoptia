import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalMediaUploader, type Media } from "./AnimalMediaUploader";

const { insertMock, uploadMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  uploadMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: async (...args: unknown[]) => {
          uploadMock(...args);
          return { error: null };
        },
        getPublicUrl: () => ({ data: { publicUrl: "https://cdn/clip.mp4" } }),
        remove: async () => ({}),
      }),
    },
    from: () => ({
      insert: (row: unknown) => {
        insertMock(row);
        return {
          select: () => ({
            single: async () => ({
              data: { id: "v1", url: "https://cdn/clip.mp4", is_cover: false, sort_order: 0, type: "video" },
              error: null,
            }),
          }),
        };
      },
    }),
  }),
}));

function mp4(sizeBytes: number): File {
  const f = new File([new Uint8Array(1)], "clip.mp4", { type: "video/mp4" });
  Object.defineProperty(f, "size", { value: sizeBytes });
  return f;
}
function mov(): File {
  return new File([new Uint8Array(1)], "clip.mov", { type: "video/quicktime" });
}

function renderUploader(media: Media[] = []) {
  const onChange = vi.fn();
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalMediaUploader shelterId="s1" animalId="a1" media={media} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return { onChange };
}

describe("AnimalMediaUploader — vídeo MP4", () => {
  beforeEach(() => {
    insertMock.mockClear();
    uploadMock.mockClear();
  });

  it("sube un MP4 válido e inserta una fila type='video'", async () => {
    const { onChange } = renderUploader();
    const input = document.querySelector('input[accept="video/mp4"]') as HTMLInputElement;
    await userEvent.upload(input, mp4(1000));
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ type: "video", animal_id: "a1" }));
    expect(onChange).toHaveBeenCalled();
  });

  it("rechaza un fichero que no es MP4 sin subir ni insertar", async () => {
    renderUploader();
    const input = document.querySelector('input[accept="video/mp4"]') as HTMLInputElement;
    await userEvent.upload(input, mov(), { applyAccept: false });
    expect(uploadMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(screen.getByText(messages.animales.errNotVideo)).toBeInTheDocument();
  });

  it("no permite marcar un vídeo como portada", () => {
    renderUploader([
      { id: "v1", url: "https://cdn/clip.mp4", is_cover: false, sort_order: 0, type: "video" },
    ]);
    expect(screen.getByRole("button", { name: messages.animales.makeCover })).toBeDisabled();
  });
});
