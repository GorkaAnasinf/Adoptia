import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const consultaMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: () => consulta() }),
}));

/** Cadena select/eq/order thenable: al hacer await devuelve el resultado fijado. */
function consulta() {
  const cadena: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order"]) cadena[m] = () => cadena;
  cadena.then = (res: (v: unknown) => unknown) => Promise.resolve(consultaMock()).then(res);
  return cadena;
}

import { FotoCarrusel } from "./FotoCarrusel";

function renderCarrusel() {
  let navego = false;
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {/* simula el <Link> de la tarjeta: si defaultPrevented no llega, habría navegado */}
      <div
        onClick={(e) => {
          navego = !e.defaultPrevented;
        }}
      >
        <FotoCarrusel
          animalId="animal-1"
          coverUrl="https://cdn.test/portada.jpg"
          alt="Pipa"
          sizes="25vw"
        />
      </div>
    </NextIntlClientProvider>,
  );
  return { fueNavegado: () => navego };
}

describe("FotoCarrusel", () => {
  beforeEach(() => {
    consultaMock.mockReset();
  });

  it("muestra la portada y las dos flechas accesibles", () => {
    consultaMock.mockResolvedValue({ data: [], error: null });
    renderCarrusel();
    expect(screen.getByRole("img", { name: "Pipa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.busqueda.fotoAnterior })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.busqueda.fotoSiguiente }),
    ).toBeInTheDocument();
  });

  it("la flecha pasa a la segunda foto sin navegar a la ficha (una sola consulta)", async () => {
    consultaMock.mockResolvedValue({
      data: [
        { url: "https://cdn.test/portada.jpg", is_cover: true, sort_order: 0 },
        { url: "https://cdn.test/dos.jpg", is_cover: false, sort_order: 1 },
      ],
      error: null,
    });
    const { fueNavegado } = renderCarrusel();
    const siguiente = screen.getByRole("button", { name: messages.busqueda.fotoSiguiente });

    fireEvent.click(siguiente);
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Pipa" }).getAttribute("src")).toContain("dos.jpg"),
    );
    expect(fueNavegado()).toBe(false);

    // segunda pulsación: cicla a la primera sin volver a consultar
    fireEvent.click(siguiente);
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Pipa" }).getAttribute("src")).toContain(
        "portada.jpg",
      ),
    );
    expect(consultaMock).toHaveBeenCalledTimes(1);
  });

  it("la flecha de anterior desde la portada va a la última foto", async () => {
    consultaMock.mockResolvedValue({
      data: [
        { url: "https://cdn.test/portada.jpg", is_cover: true, sort_order: 0 },
        { url: "https://cdn.test/ultima.jpg", is_cover: false, sort_order: 1 },
      ],
      error: null,
    });
    renderCarrusel();
    fireEvent.click(screen.getByRole("button", { name: messages.busqueda.fotoAnterior }));
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Pipa" }).getAttribute("src")).toContain(
        "ultima.jpg",
      ),
    );
  });

  it("con una sola foto las flechas desaparecen tras el primer intento", async () => {
    consultaMock.mockResolvedValue({
      data: [{ url: "https://cdn.test/portada.jpg", is_cover: true, sort_order: 0 }],
      error: null,
    });
    renderCarrusel();
    fireEvent.click(screen.getByRole("button", { name: messages.busqueda.fotoSiguiente }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: messages.busqueda.fotoSiguiente }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("img", { name: "Pipa" })).toBeInTheDocument();
  });
});
