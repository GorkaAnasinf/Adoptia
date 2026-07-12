import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const upsertMock = vi.fn();
const updateEqMock = vi.fn();
const deleteEqMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: upsertMock,
      update: vi.fn(() => ({ eq: updateEqMock })),
      delete: vi.fn(() => ({ eq: deleteEqMock })),
    })),
  })),
}));

import { AcogidaForm, type FosterHome } from "./AcogidaForm";

function renderForm(existente: FosterHome | null = null) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AcogidaForm userId="u1" existente={existente} />
    </NextIntlClientProvider>,
  );
}

const EXISTENTE: FosterHome = {
  user_id: "u1",
  city: "Bilbao",
  radius_km: 25,
  condiciones: { especies: ["dog"], vivienda: "casa", jardin: true },
  active: true,
};

describe("AcogidaForm", () => {
  beforeEach(() => {
    upsertMock.mockReset().mockResolvedValue({ error: null });
    updateEqMock.mockReset().mockResolvedValue({ error: null });
    deleteEqMock.mockReset().mockResolvedValue({ error: null });
    refreshMock.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it("sin consentimiento no guarda y lo explica", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("button", { name: messages.acogida.registrar }));
    expect(screen.getByText(messages.acogida.consentRequerido)).toBeInTheDocument();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("sin pin en el mapa no guarda", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("checkbox", { name: messages.acogida.consent }));
    await user.click(screen.getByRole("button", { name: messages.acogida.registrar }));
    expect(screen.getByText(messages.acogida.faltaPin)).toBeInTheDocument();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("alta completa: guarda condiciones, ubicación y consentimiento", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByText(messages.acogida.especieCat)); // añade gatos
    await user.click(screen.getByRole("checkbox", { name: messages.acogida.fJardin }));
    await user.click(screen.getByTestId("pin"));
    await user.click(screen.getByRole("checkbox", { name: messages.acogida.consent }));
    await user.click(screen.getByRole("button", { name: messages.acogida.registrar }));

    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    const fila = upsertMock.mock.calls[0][0];
    expect(fila.user_id).toBe("u1");
    expect(fila.location).toBe("POINT(-2.94 43.26)");
    expect(fila.condiciones.especies).toEqual(["dog", "cat"]);
    expect(fila.condiciones.jardin).toBe(true);
    expect(fila.consent_at).toBeTruthy();
    expect(await screen.findByText(messages.acogida.okTitle)).toBeInTheDocument();
  });

  it("registrado: puede pausar y reactivar", async () => {
    const user = userEvent.setup();
    renderForm(EXISTENTE);
    expect(screen.getByText(messages.acogida.estadoActivo)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: messages.acogida.pausar }));
    await waitFor(() => expect(updateEqMock).toHaveBeenCalledWith("user_id", "u1"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("la baja pide confirmación y borra el registro", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderForm(EXISTENTE);
    await user.click(screen.getByRole("button", { name: messages.acogida.baja }));
    await waitFor(() => expect(deleteEqMock).toHaveBeenCalledWith("user_id", "u1"));
  });

  it("si se cancela la confirmación, no borra", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderForm(EXISTENTE);
    await user.click(screen.getByRole("button", { name: messages.acogida.baja }));
    expect(deleteEqMock).not.toHaveBeenCalled();
  });
});
