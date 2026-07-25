import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const { insertMock, deleteMock, refreshMock } = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const eqFinal = vi.fn().mockResolvedValue({ error: null });
  const deleteMock = vi.fn(() => ({ eq: () => ({ eq: eqFinal }) }));
  return { insertMock, deleteMock, refreshMock: vi.fn() };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: () => ({ insert: insertMock, delete: deleteMock }) }),
}));

import { RsvpButton } from "./RsvpButton";

function renderRsvp(props: { userId: string | null; asisteInicial?: boolean }) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RsvpButton eventId="e1" userId={props.userId} asisteInicial={props.asisteInicial ?? false} />
    </NextIntlClientProvider>,
  );
}

describe("RsvpButton", () => {
  beforeEach(() => {
    insertMock.mockClear();
    deleteMock.mockClear();
    refreshMock.mockClear();
  });

  it("anónimo ve un enlace para iniciar sesión", () => {
    renderRsvp({ userId: null });
    const enlace = screen.getByRole("link", { name: messages.jornadas.confirmarLogin });
    expect(enlace).toHaveAttribute("href", expect.stringContaining("/login"));
  });

  it("al confirmar asistencia inserta la fila y pasa a «ya no voy»", async () => {
    const user = userEvent.setup();
    renderRsvp({ userId: "u1", asisteInicial: false });
    await user.click(screen.getByRole("button", { name: messages.jornadas.voyAIr }));
    expect(insertMock).toHaveBeenCalledWith({ event_id: "e1", user_id: "u1" });
    expect(await screen.findByRole("button", { name: messages.jornadas.yaNoVoy })).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("al retirar asistencia borra la fila", async () => {
    const user = userEvent.setup();
    renderRsvp({ userId: "u1", asisteInicial: true });
    await user.click(screen.getByRole("button", { name: messages.jornadas.yaNoVoy }));
    expect(deleteMock).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: messages.jornadas.voyAIr })).toBeInTheDocument();
  });
});
