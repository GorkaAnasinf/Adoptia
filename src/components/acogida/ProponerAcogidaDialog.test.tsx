import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

import { ProponerAcogidaDialog } from "./ProponerAcogidaDialog";

const FOSTER_ID = "11111111-1111-4111-8111-111111111111";
const ANIMALES = [
  { id: "a1", name: "Trufa" },
  { id: "a2", name: "Kira" },
];

function renderDialog() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ProponerAcogidaDialog fosterUserId={FOSTER_ID} animales={ANIMALES} />
    </NextIntlClientProvider>,
  );
}

describe("ProponerAcogidaDialog", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { ok: true } }), { status: 200 })),
    );
  });

  it("el formulario está cerrado hasta pulsar «Proponer acogida»", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: messages.acogida.contactar })).toBeInTheDocument();
    expect(screen.queryByLabelText(messages.acogida.proponerDuracion)).not.toBeInTheDocument();
  });

  it("no envía sin duración y mensaje, y lo explica", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: messages.acogida.contactar }));
    await user.click(screen.getByRole("button", { name: messages.acogida.proponerEnviar }));
    expect(screen.getByText(messages.acogida.proponerFaltanCampos)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envía la propuesta con animal, duración y mensaje y confirma", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: messages.acogida.contactar }));

    await user.selectOptions(screen.getByLabelText(messages.acogida.proponerAnimal), "a1");
    await user.type(screen.getByLabelText(messages.acogida.proponerDuracion), "2 semanas");
    await user.type(
      screen.getByLabelText(messages.acogida.proponerMensaje),
      "Camada de cachorros",
    );
    await user.click(screen.getByRole("button", { name: messages.acogida.proponerEnviar }));

    await waitFor(() => {
      expect(screen.getByText(messages.acogida.contactado)).toBeInTheDocument();
    });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init!.body as string)).toEqual({
      foster_user_id: FOSTER_ID,
      animal_id: "a1",
      duracion: "2 semanas",
      mensaje: "Camada de cachorros",
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("con 409 explica que ya hay una propuesta abierta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { code: "proposal_exists" } }), { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: messages.acogida.contactar }));
    await user.type(screen.getByLabelText(messages.acogida.proponerDuracion), "1 mes");
    await user.type(screen.getByLabelText(messages.acogida.proponerMensaje), "hola");
    await user.click(screen.getByRole("button", { name: messages.acogida.proponerEnviar }));

    expect(await screen.findByText(messages.acogida.propuestaExiste)).toBeInTheDocument();
  });
});
