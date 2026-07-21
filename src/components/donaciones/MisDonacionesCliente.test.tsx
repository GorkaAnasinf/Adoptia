import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import type { Donacion } from "./DonacionForm";
import { MisDonacionesCliente } from "./MisDonacionesCliente";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: () => <div data-testid="pin" />,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

const OFERTA: Donacion = {
  id: "d1",
  categoria: "comida",
  descripcion: "Dos sacos de pienso",
  city: "Bilbao",
  radius_km: 25,
  status: "abierta",
  renovada_at: "2026-07-18T09:00:00Z",
  created_at: "2026-07-18T09:00:00Z",
};

function renderCliente(ofertas: Donacion[] = []) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <MisDonacionesCliente userId="u1" ofertas={ofertas} />
    </NextIntlClientProvider>,
  );
}

describe("MisDonacionesCliente", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin ofertas arranca en 'Publicar' con el formulario de alta", () => {
    renderCliente();
    expect(screen.getByRole("tab", { name: messages.donaciones.tabPublicar })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.donaciones.publicar })).toBeInTheDocument();
  });

  it("con ofertas arranca en 'Mis donaciones' con la lista", () => {
    renderCliente([OFERTA]);
    expect(screen.getByRole("tab", { name: messages.donaciones.tabMisDonaciones })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Dos sacos de pienso")).toBeInTheDocument();
    // El formulario está en la otra pestaña: no se ve el botón de publicar.
    expect(
      screen.queryByRole("button", { name: messages.donaciones.publicar }),
    ).not.toBeInTheDocument();
  });

  it("editar una oferta reutiliza el único formulario (sin duplicarlo)", async () => {
    const user = userEvent.setup();
    renderCliente([OFERTA]);
    await user.click(screen.getByRole("button", { name: messages.donaciones.editar }));

    // Cambia a la pestaña del formulario, en modo edición.
    expect(screen.getByRole("tab", { name: messages.donaciones.tabPublicar })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.donaciones.guardar })).toBeInTheDocument();
    // Un solo formulario en pantalla: una sola descripción, con los datos cargados.
    const descripciones = screen.getAllByRole("textbox", { name: messages.donaciones.fDescripcion });
    expect(descripciones).toHaveLength(1);
    expect(descripciones[0]).toHaveValue("Dos sacos de pienso");
  });

  it("cancelar la edición vuelve al modo alta", async () => {
    const user = userEvent.setup();
    renderCliente([OFERTA]);
    await user.click(screen.getByRole("button", { name: messages.donaciones.editar }));
    await user.click(screen.getByRole("button", { name: messages.donaciones.cancelarEdicion }));
    expect(screen.getByRole("button", { name: messages.donaciones.publicar })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.donaciones.guardar }),
    ).not.toBeInTheDocument();
  });
});
