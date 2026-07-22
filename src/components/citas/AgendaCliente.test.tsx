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

  // ---------- Utilidades masivas (F2a) ----------

  function entrarSeleccion() {
    fireEvent.click(screen.getByRole("button", { name: /seleccionar días/i }));
  }

  it("cerrar varios días seleccionados hace un único upsert con todas las filas", async () => {
    pintar();
    entrarSeleccion();
    fireEvent.click(screen.getByRole("gridcell", { name: /^11$/ }));
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ }));
    fireEvent.click(screen.getByRole("gridcell", { name: /^13$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^cerrar$/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    const filas = upsertMock.mock.calls[0][0];
    expect(filas).toHaveLength(3);
    expect(filas.every((f: { closed: boolean }) => f.closed)).toBe(true);
    expect(filas.map((f: { date: string }) => f.date).sort()).toEqual([
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
    ]);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("aplicar una franja a la selección escribe overrides especiales en bloque", async () => {
    pintar();
    entrarSeleccion();
    fireEvent.click(screen.getByRole("gridcell", { name: /^11$/ }));
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ }));
    fireEvent.click(screen.getByRole("button", { name: /aplicar franja/i }));
    fireEvent.click(screen.getByRole("button", { name: /^aplicar$/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    const filas = upsertMock.mock.calls[0][0];
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      closed: false,
      slots: [{ start: "10:00", end: "13:00", minutes: 30 }],
    });
  });

  it("deshabilita las acciones si no hay días seleccionados", () => {
    pintar();
    entrarSeleccion();
    expect(screen.getByRole("button", { name: /^cerrar$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /aplicar franja/i })).toBeDisabled();
  });

  it("salir del modo selección limpia los días marcados", () => {
    pintar();
    entrarSeleccion();
    fireEvent.click(screen.getByRole("gridcell", { name: /^11$/ }));
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ }));
    expect(screen.getByText(/2 días seleccionados/i)).toBeInTheDocument();
    // Salir del modo…
    fireEvent.click(screen.getByRole("button", { name: /salir de selección/i }));
    // …y volver a entrar: no queda nada marcado.
    entrarSeleccion();
    expect(screen.getByText(/ningún día/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^cerrar$/i })).toBeDisabled();
  });

  it("cerrar un rango hace un upsert con todos los días del rango", async () => {
    pintar();
    fireEvent.click(screen.getByRole("button", { name: /cerrar rango/i }));
    fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: "2026-08-05" } });
    fireEvent.change(screen.getByLabelText(/nota/i), { target: { value: "Vacaciones" } });
    fireEvent.click(screen.getByRole("button", { name: /^cerrar rango$/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    const filas = upsertMock.mock.calls[0][0];
    expect(filas).toHaveLength(5);
    expect(filas.every((f: { closed: boolean; note: string }) => f.closed && f.note === "Vacaciones")).toBe(
      true,
    );
  });

  it("si el batch falla avisa y no refresca", async () => {
    upsertMock.mockResolvedValue({ error: { message: "boom" } });
    pintar();
    entrarSeleccion();
    fireEvent.click(screen.getByRole("gridcell", { name: /^11$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^cerrar$/i }));
    expect(await screen.findByText(messages.agenda.errorBatch)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  // ---------- Festivos y copiar/pegar (F2b) ----------

  it("cerrar festivos cierra los festivos nacionales del año visible", async () => {
    pintar(); // año 2026
    fireEvent.click(screen.getByRole("button", { name: /cerrar festivos/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    const filas = upsertMock.mock.calls[0][0];
    expect(filas).toHaveLength(10); // 9 fijos + Viernes Santo
    expect(filas.every((f: { closed: boolean; note: string }) => f.closed && f.note === messages.agenda.notaFestivo)).toBe(
      true,
    );
    expect(filas.map((f: { date: string }) => f.date)).toEqual(expect.arrayContaining(["2026-12-25", "2026-04-03"]));
  });

  it("copiar un día cerrado y pegarlo aplica el cierre a la selección", async () => {
    const override: OverrideDia = { date: "2026-08-05", closed: true, slots: [], note: "X" };
    pintar({ overrides: [override] });
    fireEvent.click(screen.getByRole("gridcell", { name: /^5$/ }));
    fireEvent.click(screen.getByRole("button", { name: /copiar día/i }));
    entrarSeleccion();
    fireEvent.click(screen.getByRole("gridcell", { name: /^11$/ }));
    fireEvent.click(screen.getByRole("gridcell", { name: /^12$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^pegar$/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalledOnce());
    const filas = upsertMock.mock.calls[0][0];
    expect(filas).toHaveLength(2);
    expect(filas.every((f: { closed: boolean }) => f.closed)).toBe(true);
    expect(filas.map((f: { date: string }) => f.date).sort()).toEqual(["2026-08-11", "2026-08-12"]);
  });

  it("sin nada copiado, la acción «Pegar» no aparece", () => {
    pintar();
    entrarSeleccion();
    expect(screen.queryByRole("button", { name: /^pegar$/i })).not.toBeInTheDocument();
  });
});
