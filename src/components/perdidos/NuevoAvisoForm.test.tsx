import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

// Insert de `lost_found_posts`: devuelve el builder con .select().single().
const postInsertMock = vi.fn();
// Insert de `lost_found_media`: devuelve { error }.
const mediaInsertMock = vi.fn();
const uploadMock = vi.fn();
let subidas = 0;
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((tabla: string) => ({
      insert: (payload: unknown) => {
        if (tabla === "lost_found_media") return mediaInsertMock(payload);
        // lost_found_posts
        return {
          select: () => ({ single: () => postInsertMock(payload) }),
        };
      },
    })),
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        // Una URL distinta por subida, para poder comprobar el orden/portada.
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: `https://cdn.test/foto-${subidas++}.jpg` },
        })),
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
    subidas = 0;
    postInsertMock.mockReset().mockResolvedValue({ data: { id: "post-1" }, error: null });
    mediaInsertMock.mockReset().mockResolvedValue({ error: null });
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
    expect(postInsertMock).not.toHaveBeenCalled();
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

    await waitFor(() => expect(postInsertMock).toHaveBeenCalledOnce());
    const fila = postInsertMock.mock.calls[0][0];
    expect(fila.type).toBe("found");
    expect(fila.location).toBe("POINT(-2.94 43.26)");
    // La foto ya no vive en la fila del aviso: va a lost_found_media.
    expect(fila.photo_url).toBeUndefined();
    expect(uploadMock).toHaveBeenCalledOnce();
    const media = mediaInsertMock.mock.calls[0][0];
    expect(media).toHaveLength(1);
    expect(media[0]).toMatchObject({ post_id: "post-1", is_cover: true, sort_order: 0 });
    expect(await screen.findByText(messages.perdidos.okTitle)).toBeInTheDocument();
  });

  it("publica varias fotos: N filas de media, la marcada es portada", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro con tres fotos");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [
      new File(["a"], "frente.jpg", { type: "image/jpeg" }),
      new File(["b"], "perfil.jpg", { type: "image/jpeg" }),
      new File(["c"], "lomo.jpg", { type: "image/jpeg" }),
    ]);
    // Marcar la 2ª como portada.
    await user.click(screen.getAllByRole("button", { name: messages.perdidos.fFotoMarcarPortada })[1]);
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(mediaInsertMock).toHaveBeenCalledOnce());
    const media = mediaInsertMock.mock.calls[0][0] as { is_cover: boolean; sort_order: number }[];
    expect(media).toHaveLength(3);
    // Exactamente una portada, y es la de sort_order 0 (se sube primera).
    expect(media.filter((m) => m.is_cover)).toHaveLength(1);
    expect(media.find((m) => m.is_cover)?.sort_order).toBe(0);
    expect(uploadMock).toHaveBeenCalledTimes(3);
  });

  it("quitar una foto antes de enviar la excluye", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
    ]);
    await user.click(screen.getAllByRole("button", { name: messages.perdidos.fFotoQuitar })[0]);
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(mediaInsertMock).toHaveBeenCalledOnce());
    expect(mediaInsertMock.mock.calls[0][0]).toHaveLength(1);
  });

  it("si una foto no sube, no se publica a medias y avisa", async () => {
    uploadMock.mockResolvedValue({ error: { message: "storage caído" } });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["a"], "a.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    expect(await screen.findByText(messages.perdidos.fFotoError)).toBeInTheDocument();
    expect(postInsertMock).not.toHaveBeenCalled();
  });

  // FEATURE-022
  it("por defecto publica sin teléfono y aceptando mensajes por la plataforma", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(postInsertMock).toHaveBeenCalledOnce());
    const fila = postInsertMock.mock.calls[0][0];
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

    await waitFor(() => expect(postInsertMock).toHaveBeenCalledOnce());
    expect(postInsertMock.mock.calls[0][0].contact_phone).toBe("600111222");
  });

  it("rechaza un teléfono con formato imposible antes de llamar a BD", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.type(screen.getByLabelText(messages.perdidos.fTelefono), "llámame :)");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));
    expect(await screen.findByText(messages.perdidos.fTelefonoInvalido)).toBeInTheDocument();
    expect(postInsertMock).not.toHaveBeenCalled();
  });

  it("el autor puede cerrar los mensajes por la plataforma", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.click(screen.getByLabelText(messages.perdidos.fPermitirContacto));
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(postInsertMock).toHaveBeenCalledOnce());
    expect(postInsertMock.mock.calls[0][0].allow_contact).toBe(false);
  });

  // FEATURE-023 — datos identificativos
  it("publica sin tocar ningún campo identificativo: todos opcionales y en «no lo sé»", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(postInsertMock).toHaveBeenCalledOnce());
    const fila = postInsertMock.mock.calls[0][0];
    expect(fila.breed).toBeNull();
    expect(fila.sex).toBeNull();
    expect(fila.size).toBeNull();
    expect(fila.color).toBeNull();
    expect(fila.has_collar).toBeNull();
    expect(fila.has_microchip).toBeNull();
    // La fecha sí va: por defecto, hoy.
    expect(fila.occurred_on).toBe(new Date().toISOString().slice(0, 10));
  });

  it("guarda los datos identificativos que se rellenan", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Podenca canela");
    await user.type(screen.getByLabelText(messages.perdidos.fRaza), "Podenco");
    await user.type(screen.getByLabelText(messages.perdidos.fColor), "Canela");
    await user.selectOptions(screen.getByLabelText(messages.perdidos.fSexo), "female");
    await user.selectOptions(screen.getByLabelText(messages.perdidos.fTamano), "medium");
    await user.selectOptions(screen.getByLabelText(messages.perdidos.fMicrochip), "si");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(postInsertMock).toHaveBeenCalledOnce());
    const fila = postInsertMock.mock.calls[0][0];
    expect(fila.breed).toBe("Podenco");
    expect(fila.color).toBe("Canela");
    expect(fila.sex).toBe("female");
    expect(fila.size).toBe("medium");
    expect(fila.has_microchip).toBe(true);
  });

  it("la descripción del collar solo aparece —y solo se guarda— si lleva collar", async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.queryByLabelText(messages.perdidos.fCollarDescripcion)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(messages.perdidos.fCollar), "si");
    await user.type(
      await screen.findByLabelText(messages.perdidos.fCollarDescripcion),
      "Rojo con placa",
    );

    // Si se vuelve atrás a "no lo sé", la descripción no debe viajar.
    await user.selectOptions(screen.getByLabelText(messages.perdidos.fCollar), "nose");
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    await waitFor(() => expect(postInsertMock).toHaveBeenCalledOnce());
    const fila = postInsertMock.mock.calls[0][0];
    expect(fila.has_collar).toBeNull();
    expect(fila.collar_description).toBeNull();
  });

  it("no publica con una fecha de suceso futura", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Perro perdido");
    const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(messages.perdidos.fFecha), { target: { value: manana } });
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));

    expect(await screen.findByText(messages.perdidos.fFechaFutura)).toBeInTheDocument();
    expect(postInsertMock).not.toHaveBeenCalled();
  });

  it("no ofrece ningún campo para el número de microchip", async () => {
    renderForm();
    const textos = screen.getAllByRole("textbox").map((i) => i.getAttribute("id") ?? "");
    expect(textos.some((id) => /chip/i.test(id))).toBe(false);
    expect(screen.getByText(messages.perdidos.fMicrochipHelp)).toBeInTheDocument();
  });

  it("si la BD falla muestra el error y permite reintentar", async () => {
    postInsertMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(messages.perdidos.fDescripcion), "Texto suficiente");
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.perdidos.fEnviar }));
    expect(await screen.findByText(messages.perdidos.fError)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.perdidos.fEnviar })).toBeEnabled();
  });
});
