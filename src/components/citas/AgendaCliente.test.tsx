import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import type { FranjaSemanal, OverrideDia } from "@/lib/agenda";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const fromMock = vi.fn();
const upsertMock = vi.fn();
const insertMock = vi.fn();
const deleteEqMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: (tabla: string) => {
      fromMock(tabla);
      return {
        upsert: upsertMock,
        insert: insertMock,
        delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: deleteEqMock })) })),
      };
    },
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
    fromMock.mockReset();
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

  it("guardar sin repetir persiste un override de horario especial", async () => {
    pintar();
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ })); // miércoles con patrón
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    expect(upsertMock.mock.calls[0][0]).toMatchObject({
      shelter_id: "s1",
      date: "2026-08-12",
      closed: false,
      slots: [{ start: "10:00", end: "13:00", minutes: 30 }],
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("'repetir semanalmente' reemplaza el patrón y borra el override", async () => {
    pintar();
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ })); // miércoles (weekday 3)
    fireEvent.click(screen.getByRole("checkbox", { name: /repetir semanalmente/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    await waitFor(() => expect(insertMock).toHaveBeenCalledOnce());
    // Escribe el patrón semanal del weekday del día elegido.
    expect(insertMock.mock.calls[0][0]).toEqual([
      { shelter_id: "s1", weekday: 3, start_time: "10:00", end_time: "13:00", slot_minutes: 30 },
    ]);
    // Toca ambas tablas: availability_slots (delete+insert) y overrides (delete).
    expect(fromMock).toHaveBeenCalledWith("availability_slots");
    expect(fromMock).toHaveBeenCalledWith("availability_overrides");
    expect(deleteEqMock).toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("resetear borra el override del día", async () => {
    const override: OverrideDia = { date: "2026-08-12", closed: true, slots: [], note: null };
    pintar({ overrides: [override] });
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ }));
    fireEvent.click(screen.getByRole("button", { name: /resetear día/i }));
    await waitFor(() => expect(deleteEqMock).toHaveBeenCalled());
    expect(fromMock).toHaveBeenCalledWith("availability_overrides");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("si el guardado falla muestra el feedback de error y no refresca", async () => {
    upsertMock.mockResolvedValue({ error: { message: "boom" } });
    pintar();
    fireEvent.click(screen.getByRole("gridcell", { name: /^15$/ }));
    fireEvent.click(screen.getByRole("switch", { name: /cerrar este día/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(await screen.findByText(messages.agenda.errorGuardar)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("si resetear falla muestra el feedback de error", async () => {
    deleteEqMock.mockResolvedValue({ error: { message: "boom" } });
    const override: OverrideDia = { date: "2026-08-12", closed: true, slots: [], note: null };
    pintar({ overrides: [override] });
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ }));
    fireEvent.click(screen.getByRole("button", { name: /resetear día/i }));
    expect(await screen.findByText(messages.agenda.errorGuardar)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
