import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const insertMock = vi.fn();
const updateEqMock = vi.fn();
const deleteEqMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: insertMock,
      update: vi.fn(() => ({ eq: updateEqMock })),
      delete: vi.fn(() => ({ eq: deleteEqMock })),
    })),
  })),
}));

import { DisponibilidadEditor, type Franja } from "./DisponibilidadEditor";

const FRANJA: Franja = {
  id: "f1",
  weekday: 6,
  start_time: "10:00:00",
  end_time: "12:00:00",
  slot_minutes: 30,
  active: true,
};

function renderEditor(franjas: Franja[] = []) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <DisponibilidadEditor shelterId="s1" franjas={franjas} />
    </NextIntlClientProvider>,
  );
}

describe("DisponibilidadEditor", () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    updateEqMock.mockReset().mockResolvedValue({ error: null });
    deleteEqMock.mockReset().mockResolvedValue({ error: null });
    refreshMock.mockReset();
  });

  it("sin franjas muestra el estado vacío y crea la primera", async () => {
    const user = userEvent.setup();
    renderEditor();
    expect(screen.getByText(messages.citas.sinFranjas)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: messages.citas.guardarFranja }));
    await waitFor(() => expect(insertMock).toHaveBeenCalledOnce());
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      shelter_id: "s1",
      weekday: 6,
      slot_minutes: 30,
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("lista la franja con horas y permite pausarla", async () => {
    const user = userEvent.setup();
    renderEditor([FRANJA]);
    expect(screen.getByText("10:00–12:00")).toBeInTheDocument();
    expect(screen.getByText(messages.citas.franjaActiva)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: messages.citas.pausarFranja }));
    await waitFor(() => expect(updateEqMock).toHaveBeenCalledWith("id", "f1"));
  });

  it("borra una franja y avisa de que las citas ya reservadas no se cancelan", async () => {
    const user = userEvent.setup();
    renderEditor([FRANJA]);
    expect(screen.getByText(messages.citas.avisoCitas)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: messages.citas.borrarFranja }));
    await waitFor(() => expect(deleteEqMock).toHaveBeenCalledWith("id", "f1"));
  });

  it("si el insert falla muestra el error de franja", async () => {
    insertMock.mockResolvedValue({ error: { message: "check" } });
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole("button", { name: messages.citas.guardarFranja }));
    expect(await screen.findByText(messages.citas.errFranja)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
