import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { MisCitasCliente, type CitaVista } from "./MisCitasCliente";

// El botón de cancelar depende del cliente Supabase; aquí solo importa el layout.
vi.mock("@/components/citas/CancelarCitaButton", () => ({
  CancelarCitaButton: () => <button type="button">cancelar</button>,
}));

const DIA = 24 * 3600 * 1000;

function cita(over: Partial<CitaVista>): CitaVista {
  return {
    id: "c",
    status: "confirmed",
    starts_at: new Date(Date.now() + 5 * DIA).toISOString(),
    cancel_reason: null,
    animalName: "Pipa",
    animalSlug: "pipa",
    portada: null,
    shelterName: "Protectora Bilbao",
    shelterSlug: "pb",
    ...over,
  };
}

const PROXIMA_A = cita({ id: "a", animalName: "Pipa", animalSlug: "pipa" });
const PROXIMA_B = cita({
  id: "b",
  animalName: "Luna",
  animalSlug: "luna",
  starts_at: new Date(Date.now() + 6 * DIA).toISOString(),
});
const PASADA = cita({
  id: "z",
  status: "done",
  animalName: "Rocky",
  animalSlug: "rocky",
  starts_at: new Date(Date.now() - 10 * DIA).toISOString(),
});

function renderCliente(citas: CitaVista[]) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <MisCitasCliente citas={citas} />
    </NextIntlClientProvider>,
  );
}

describe("MisCitasCliente", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // Fecha fija a mediodía para que los desfases de día sean estables.
    vi.setSystemTime(new Date(2026, 6, 20, 12, 0, 0));
  });

  it("con próximas arranca en esa pestaña y oculta las pasadas", () => {
    renderCliente([PROXIMA_A, PASADA]);
    expect(screen.getByRole("link", { name: "Pipa" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Rocky" })).not.toBeInTheDocument();
  });

  it("al cambiar a la pestaña Pasadas muestra las pasadas y oculta las próximas", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCliente([PROXIMA_A, PASADA]);
    await user.click(screen.getByRole("tab", { name: messages.account.citasPasadas }));
    expect(screen.getByRole("link", { name: "Rocky" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pipa" })).not.toBeInTheDocument();
  });

  it("sin próximas arranca directamente en Pasadas", () => {
    renderCliente([PASADA]);
    expect(screen.getByRole("link", { name: "Rocky" })).toBeInTheDocument();
  });

  it("seleccionar un día del calendario filtra la lista y permite quitar el filtro", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCliente([PROXIMA_A, PROXIMA_B]);
    const diaA = new Date(PROXIMA_A.starts_at).getDate(); // 25
    const diaB = new Date(PROXIMA_B.starts_at).getDate(); // 26

    // Ambas visibles antes de filtrar.
    expect(screen.getByRole("link", { name: "Pipa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Luna" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: String(diaA) }));
    // Solo la del día A queda; aparece el chip para quitar el filtro.
    expect(screen.getByRole("link", { name: "Pipa" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Luna" })).not.toBeInTheDocument();
    const quitar = screen.getByRole("button", { name: messages.account.citasQuitarFiltro });
    expect(quitar).toBeInTheDocument();

    await user.click(quitar);
    expect(screen.getByRole("link", { name: "Luna" })).toBeInTheDocument();
    expect(diaB).not.toBe(diaA);
  });

  it("navegar al mes siguiente deshabilita el día que tenía cita", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCliente([PROXIMA_A]);
    const diaA = new Date(PROXIMA_A.starts_at).getDate();
    expect(screen.getByRole("button", { name: String(diaA) })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: messages.account.citasMesSiguiente }));
    expect(screen.getByRole("button", { name: String(diaA) })).toBeDisabled();
  });
});
