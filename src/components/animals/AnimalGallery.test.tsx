import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalGallery, type AnimalMedia } from "./AnimalGallery";

const FOTOS: AnimalMedia[] = [
  { url: "https://example.com/1.jpg", is_cover: false, sort_order: 1 },
  { url: "https://example.com/0.jpg", is_cover: true, sort_order: 0 },
  { url: "https://example.com/2.jpg", is_cover: false, sort_order: 2 },
];

function renderGallery(media: AnimalMedia[] = FOTOS) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalGallery name="Pipa" media={media} />
    </NextIntlClientProvider>,
  );
}

describe("AnimalGallery", () => {
  it("muestra la portada como imagen principal con alt del animal", () => {
    renderGallery();
    const principal = screen.getByRole("img", { name: "Foto 1 de 3" });
    expect(principal).toHaveAttribute("src", expect.stringContaining("0.jpg"));
  });

  it("cambiar de miniatura (botones accesibles) cambia la imagen principal", async () => {
    renderGallery();
    await userEvent.click(screen.getByRole("button", { name: "Ver foto 3" }));
    const principal = screen.getByRole("img", { name: "Foto 3 de 3" });
    expect(principal).toHaveAttribute("src", expect.stringContaining("2.jpg"));
  });

  it("con una sola foto no pinta miniaturas", () => {
    renderGallery([FOTOS[0]]);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("sin fotos muestra placeholder sin romper", () => {
    renderGallery([]);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("un vídeo de YouTube muestra el póster y carga el embed nocookie al pulsar play", async () => {
    renderGallery([
      { url: "https://example.com/0.jpg", is_cover: true, sort_order: 0, type: "photo" },
      { url: "https://youtu.be/dQw4w9WgXcQ", is_cover: false, sort_order: 1, type: "youtube" },
    ]);
    // La foto de portada nunca se sustituye por la URL de YouTube.
    expect(screen.queryByRole("img", { name: /youtu\.be/ })).not.toBeInTheDocument();
    // Miniatura del vídeo → póster real de YouTube (no iframe todavía).
    await userEvent.click(screen.getByRole("button", { name: "Ver vídeo 2" }));
    expect(document.querySelector("iframe")).toBeNull();
    const poster = screen.getByRole("img", { name: "Vídeo 2 de 2" });
    // next/image codifica la URL de origen; comprobamos host e id del póster.
    expect(decodeURIComponent(poster.getAttribute("src") ?? "")).toContain(
      "i.ytimg.com/vi/dQw4w9WgXcQ",
    );
    // Pulsar el póster carga el reproductor con autoplay.
    await userEvent.click(screen.getByRole("button", { name: "Reproducir vídeo" }));
    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
  });

  it("un vídeo MP4 subido se pinta con controles nativos", async () => {
    renderGallery([
      { url: "https://example.com/0.jpg", is_cover: true, sort_order: 0, type: "photo" },
      { url: "https://example.com/clip.mp4", is_cover: false, sort_order: 1, type: "video" },
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Ver vídeo 2" }));
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("controls");
    expect(video?.querySelector("source")).toHaveAttribute("src", "https://example.com/clip.mp4");
  });

  it("descarta un enlace de YouTube inválido en lugar de romper el carrusel", () => {
    renderGallery([
      { url: "https://example.com/0.jpg", is_cover: true, sort_order: 0, type: "photo" },
      { url: "https://vimeo.com/12345", is_cover: false, sort_order: 1, type: "youtube" },
    ]);
    // Solo la foto queda: sin miniaturas (un único medio válido).
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
