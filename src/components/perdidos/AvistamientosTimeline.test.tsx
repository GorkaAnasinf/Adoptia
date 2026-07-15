import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import type { Avistamiento } from "./tipos";

const { refreshMock, deleteMock, eqMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  deleteMock: vi.fn(),
  eqMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ from: vi.fn(() => ({ delete: deleteMock })) })),
}));

import { AvistamientosTimeline } from "./AvistamientosTimeline";

const VISTO: Avistamiento = {
  id: "s1",
  seen_at: "2026-07-12T18:30:00Z",
  note: "Bebiendo en la fuente",
  photo_url: null,
  lat: 43.264,
  lng: -2.934,
  created_at: "2026-07-12T18:40:00Z",
};

function renderTimeline(props: Partial<Parameters<typeof AvistamientosTimeline>[0]> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AvistamientosTimeline avistamientos={[VISTO]} {...props} />
    </NextIntlClientProvider>,
  );
}

describe("AvistamientosTimeline", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    eqMock.mockReset().mockResolvedValue({ error: null });
    deleteMock.mockReset().mockReturnValue({ eq: eqMock });
  });

  it("sin avistamientos anima a reportar en vez de mostrar una lista vacía", () => {
    renderTimeline({ avistamientos: [] });
    expect(screen.getByText(messages.perdidos.avistamientosVacio)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("muestra la nota y la fecha del avistamiento", () => {
    renderTimeline();
    expect(screen.getByText("Bebiendo en la fuente")).toBeInTheDocument();
    expect(screen.getByText(/12 de julio/)).toBeInTheDocument();
  });

  it("quien no es el autor del aviso no ve el botón de borrar", () => {
    renderTimeline();
    expect(
      screen.queryByRole("button", { name: messages.perdidos.avistamientoBorrar }),
    ).not.toBeInTheDocument();
  });

  it("el autor borra un avistamiento y la ficha se refresca", async () => {
    const user = userEvent.setup();
    renderTimeline({ puedeBorrar: true });
    await user.click(screen.getByRole("button", { name: messages.perdidos.avistamientoBorrar }));
    await waitFor(() => expect(eqMock).toHaveBeenCalledWith("id", "s1"));
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("si RLS impide el borrado lo dice y no refresca", async () => {
    eqMock.mockResolvedValue({ error: { message: "denegado" } });
    const user = userEvent.setup();
    renderTimeline({ puedeBorrar: true });
    await user.click(screen.getByRole("button", { name: messages.perdidos.avistamientoBorrar }));
    expect(
      await screen.findByText(messages.perdidos.avistamientoBorrarError),
    ).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
