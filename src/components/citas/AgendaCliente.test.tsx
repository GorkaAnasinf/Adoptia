import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import type { FranjaSemanal, OverrideDia } from "@/lib/agenda";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const upsertMock = vi.fn();
const insertMock = vi.fn();
const deleteEqMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: upsertMock,
      insert: insertMock,
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ eq: deleteEqMock })),
      })),
    })),
  })),
}));

import { AgendaCliente } from "./AgendaCliente";

const patronMiercoles: FranjaSemanal = {
  weekday: 3,
  start_time: "10:00:00",
  end_time: "13:00:00",
  slot_minutes: 30,
  active: true,
};

function pintar(props: Partial<Parameters<typeof AgendaCliente>[0]> = {}) {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AgendaCliente
        shelterId="s1"
        franjas={[patronMiercoles]}
        overrides={[]}
        citasPorDia={[]}
        hoyISO="2026-08-12"
        anioInicial={2026}
        mesInicial={7}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe("AgendaCliente", () => {
  beforeEach(() => {
    upsertMock.mockReset().mockResolvedValue({ error: null });
    insertMock.mockReset().mockResolvedValue({ error: null });
    deleteEqMock.mockReset().mockResolvedValue({ error: null });
    refreshMock.mockReset();
  });

  it("muestra el calendario del mes y el aviso hasta elegir un día", () => {
    pintar();
    expect(screen.getByText(/agosto de 2026/i)).toBeInTheDocument();
    expect(screen.getByText(messages.agenda.sinSeleccion)).toBeInTheDocument();
  });

  it("al elegir un miércoles precarga el patrón semanal en el editor", () => {
    pintar();
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ })); // miércoles
    expect(screen.getByText(/12 de agosto/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("10:00")).toBeInTheDocument();
  });

  it("cerrar un día persiste un override cerrado", async () => {
    pintar();
    fireEvent.click(screen.getByRole("gridcell", { name: /^15$/ }));
    fireEvent.click(screen.getByRole("switch", { name: /cerrar este día/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    expect(upsertMock.mock.calls[0][0]).toMatchObject({
      shelter_id: "s1",
      date: "2026-08-15",
      closed: true,
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("marca en el calendario los días cerrados por override", () => {
    const override: OverrideDia = { date: "2026-08-10", closed: true, slots: [], note: null };
    pintar({ overrides: [override] });
    expect(screen.getByRole("gridcell", { name: /^10$/ })).toHaveAttribute("data-estado", "cerrado");
  });
});
