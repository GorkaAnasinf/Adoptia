import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: ({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) => (
    <button type="button" data-testid="pin" onClick={() => onChange({ lat: 43.26, lng: -2.94 })} />
  ),
}));

const insertMock = vi.fn();
const updateEqMock = vi.fn();
const updateMock = vi.fn((_fila: Record<string, unknown>) => ({ eq: updateEqMock }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: insertMock,
      update: updateMock,
    })),
  })),
}));

import { DonacionForm, type Donacion } from "./DonacionForm";

function renderForm(existente: Donacion | null = null) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <DonacionForm userId="u1" existente={existente} />
    </NextIntlClientProvider>,
  );
}

const EXISTENTE: Donacion = {
  id: "d1",
  categoria: "comida",
  descripcion: "Dos sacos de pienso",
  city: "Bilbao",
  radius_km: 25,
  status: "abierta",
  renovada_at: "2026-07-18T09:00:00Z",
  created_at: "2026-07-18T09:00:00Z",
};

async function rellenar(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: messages.donaciones.fDescripcion }),
    "Dos sacos de pienso sin abrir",
  );
  await user.type(screen.getByRole("textbox", { name: messages.donaciones.fCiudad }), "Bilbao");
}

describe("DonacionForm", () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    updateEqMock.mockReset().mockResolvedValue({ error: null });
    updateMock.mockClear();
    refreshMock.mockReset();
  });

  it("sin descripción o sin ciudad no guarda y lo explica", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.donaciones.publicar }));
    expect(screen.getByText(messages.donaciones.faltaDescripcion)).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: messages.donaciones.fDescripcion }),
      "Dos sacos de pienso",
    );
    await user.click(screen.getByRole("button", { name: messages.donaciones.publicar }));
    expect(screen.getByText(messages.donaciones.faltaCiudad)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("alta sin pin no guarda", async () => {
    const user = userEvent.setup();
    renderForm();
    await rellenar(user);
    await user.click(screen.getByRole("button", { name: messages.donaciones.publicar }));
    expect(screen.getByText(messages.donaciones.faltaPin)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("alta completa: inserta con ubicación y refresca", async () => {
    const user = userEvent.setup();
    renderForm();
    await rellenar(user);
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.donaciones.publicar }));
    await waitFor(() => expect(insertMock).toHaveBeenCalledOnce());
    const fila = insertMock.mock.calls[0][0];
    expect(fila.user_id).toBe("u1");
    expect(fila.location).toBe("POINT(-2.94 43.26)");
    expect(fila.city).toBe("Bilbao");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("edición sin tocar el pin conserva la zona (no manda location)", async () => {
    const user = userEvent.setup();
    renderForm(EXISTENTE);
    await user.click(screen.getByRole("button", { name: messages.donaciones.guardar }));
    await waitFor(() => expect(updateEqMock).toHaveBeenCalled());
    const fila = updateMock.mock.calls[0][0];
    expect(fila.location).toBeUndefined();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("el tope de 5 abiertas muestra su mensaje propio", async () => {
    insertMock.mockResolvedValue({ error: { message: "donation_offers_limit" } });
    const user = userEvent.setup();
    renderForm();
    await rellenar(user);
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.donaciones.publicar }));
    expect(await screen.findByText(messages.donaciones.errorLimite)).toBeInTheDocument();
  });
});
