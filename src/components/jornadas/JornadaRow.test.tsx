import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const { updateMock, eqMock, refreshMock } = vi.hoisted(() => {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn(() => ({ eq: eqMock }));
  return { updateMock, eqMock, refreshMock: vi.fn() };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock, push: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from: () => ({ update: updateMock }) }) }));

import { JornadaRow, type JornadaResumen } from "./JornadaRow";

const base: JornadaResumen = {
  id: "ev1",
  title: "Jornada en el Retiro",
  starts_at: new Date(Date.now() - 51 * 3600_000).toISOString(),
  ends_at: new Date(Date.now() - 48 * 3600_000).toISOString(),
  status: "published",
  city: "Madrid",
  animal_count: 3,
  attendee_count: 12,
};

function renderRow(j: Partial<JornadaResumen> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <JornadaRow jornada={{ ...base, ...j }} />
    </NextIntlClientProvider>,
  );
}

describe("JornadaRow — finalizar", () => {
  beforeEach(() => {
    updateMock.mockClear();
    eqMock.mockClear();
    refreshMock.mockClear();
  });

  it("muestra Finalizar en una jornada publicada ya pasada", () => {
    renderRow();
    expect(screen.getByRole("button", { name: messages.jornadas.finalizarJornada })).toBeInTheDocument();
  });

  it("no muestra Finalizar si la jornada aún no ha terminado", () => {
    renderRow({
      starts_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
      ends_at: new Date(Date.now() + 27 * 3600_000).toISOString(),
    });
    expect(screen.queryByRole("button", { name: messages.jornadas.finalizarJornada })).not.toBeInTheDocument();
  });

  it("guarda el resultado: status finished + contadores", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: messages.jornadas.finalizarJornada }));
    await user.type(screen.getByLabelText(messages.jornadas.fAdopciones), "4");
    await user.click(screen.getByRole("button", { name: messages.jornadas.finalizarConfirmar }));
    expect(updateMock).toHaveBeenCalledWith({ status: "finished", adoptions_count: 4, attended_count: 12 });
    expect(refreshMock).toHaveBeenCalled();
  });
});
