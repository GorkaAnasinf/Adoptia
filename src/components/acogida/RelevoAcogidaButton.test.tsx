import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { RelevoAcogidaButton } from "./RelevoAcogidaButton";

const PROPOSAL_ID = "33333333-3333-4333-8333-333333333333";

function renderBoton(relevo: { motivo: string; fechaLimite: string } | null = null) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RelevoAcogidaButton proposalId={PROPOSAL_ID} relevo={relevo} />
    </NextIntlClientProvider>,
  );
}

describe("RelevoAcogidaButton", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { ok: true } }), { status: 200 })),
    );
  });

  it("sin relevo: botón que abre el formulario; no envía vacío", async () => {
    const user = userEvent.setup();
    renderBoton();
    await user.click(screen.getByRole("button", { name: messages.acogida.relevoNecesito }));
    await user.click(screen.getByRole("button", { name: messages.acogida.relevoEnviar }));
    expect(screen.getByText(messages.acogida.relevoFaltanCampos)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envía motivo y fecha límite y refresca", async () => {
    const user = userEvent.setup();
    renderBoton();
    await user.click(screen.getByRole("button", { name: messages.acogida.relevoNecesito }));
    await user.type(
      screen.getByLabelText(messages.acogida.relevoMotivo),
      "Obras en casa por inundación",
    );
    await user.type(screen.getByLabelText(messages.acogida.relevoFecha), "2026-08-01");
    await user.click(screen.getByRole("button", { name: messages.acogida.relevoEnviar }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init!.body as string)).toEqual({
      proposal_id: PROPOSAL_ID,
      motivo: "Obras en casa por inundación",
      fecha_limite: "2026-08-01",
    });
  });

  it("con relevo pedido: muestra el aviso y permite cancelar", async () => {
    const user = userEvent.setup();
    renderBoton({ motivo: "Obras", fechaLimite: "2026-08-01" });
    expect(screen.getByText(/2026-08-01/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.acogida.relevoNecesito }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: messages.acogida.relevoCancelar }));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init!.body as string)).toEqual({
      proposal_id: PROPOSAL_ID,
      cancelar: true,
    });
  });
});
