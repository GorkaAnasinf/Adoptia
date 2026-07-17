import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const updateEqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ from: vi.fn(() => ({ update: updateMock })) })),
}));

import { PropuestaEstadoActions } from "./PropuestaEstadoActions";

function renderActions(status: string) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PropuestaEstadoActions proposalId="p1" status={status} />
    </NextIntlClientProvider>,
  );
}

describe("PropuestaEstadoActions", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    updateEqMock.mockReset().mockResolvedValue({ error: null });
    updateMock.mockClear();
  });

  it("enviada: permite marcar aceptada o rechazada", async () => {
    const user = userEvent.setup();
    renderActions("enviada");
    await user.click(screen.getByRole("button", { name: messages.acogida.marcarAceptada }));
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ status: "aceptada" });
      expect(refreshMock).toHaveBeenCalled();
    });
    expect(screen.getByRole("button", { name: messages.acogida.marcarRechazada })).toBeInTheDocument();
  });

  it("aceptada: permite marcar finalizada", () => {
    renderActions("aceptada");
    expect(
      screen.getByRole("button", { name: messages.acogida.marcarFinalizada }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.acogida.marcarAceptada }),
    ).not.toBeInTheDocument();
  });

  it("rechazada o finalizada: sin acciones", () => {
    renderActions("finalizada");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
