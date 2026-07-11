import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

import { ReservaCita, type Hueco } from "./ReservaCita";

const fetchMock = vi.fn();

// Dos días distintos con dos huecos el primero
const HUECOS: Hueco[] = [
  { starts_at: "2026-08-01T08:00:00+00:00", ends_at: "2026-08-01T08:30:00+00:00" },
  { starts_at: "2026-08-01T08:30:00+00:00", ends_at: "2026-08-01T09:00:00+00:00" },
  { starts_at: "2026-08-02T08:00:00+00:00", ends_at: "2026-08-02T08:30:00+00:00" },
];

function renderReserva(huecos: Hueco[] = HUECOS) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ReservaCita requestId="req1" huecos={huecos} />
    </NextIntlClientProvider>,
  );
}

describe("ReservaCita", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    refreshMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("agrupa los huecos por día y muestra las horas del día activo", () => {
    renderReserva();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    // Día 1 activo: dos pills de hora (10:00 y 10:30 en Europe/Madrid)
    expect(screen.getByRole("button", { name: "10:00" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10:30" })).toBeInTheDocument();
  });

  it("no permite confirmar sin hueco elegido; con hueco llama a la API", async () => {
    fetchMock.mockResolvedValue({ status: 201 });
    const user = userEvent.setup();
    renderReserva();

    const confirmar = screen.getByRole("button", { name: messages.citas.confirmar });
    expect(confirmar).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "10:00" }));
    await user.click(confirmar);

    expect(fetchMock).toHaveBeenCalledWith("/api/citas", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ request_id: "req1", starts_at: "2026-08-01T08:00:00+00:00" });
    expect(await screen.findByText(messages.citas.reservadaTitle)).toBeInTheDocument();
  });

  it("si el hueco se ocupa (409) avisa y refresca los huecos", async () => {
    fetchMock.mockResolvedValue({ status: 409 });
    const user = userEvent.setup();
    renderReserva();

    await user.click(screen.getByRole("button", { name: "10:00" }));
    await user.click(screen.getByRole("button", { name: messages.citas.confirmar }));

    expect(await screen.findByText(messages.citas.huecoOcupado)).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("sin huecos muestra el aviso de agenda vacía", () => {
    renderReserva([]);
    expect(screen.getByText(messages.citas.sinHuecos)).toBeInTheDocument();
  });
});
