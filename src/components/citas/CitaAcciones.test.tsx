import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { CancelarCitaButton } from "./CancelarCitaButton";
import { CitaAccionesPanel } from "./CitaAccionesPanel";

const fetchMock = vi.fn();

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("CancelarCitaButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    refreshMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("exige motivo antes de cancelar", async () => {
    const user = userEvent.setup();
    conIntl(<CancelarCitaButton citaId="c1" />);
    await user.click(screen.getByRole("button", { name: messages.citas.cancelarCita }));
    await user.click(screen.getByRole("button", { name: messages.citas.confirmarCancelacion }));
    expect(screen.getByText(messages.citas.motivoRequerido)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cancela con motivo vía PATCH y refresca", async () => {
    const user = userEvent.setup();
    conIntl(<CancelarCitaButton citaId="c1" />);
    await user.click(screen.getByRole("button", { name: messages.citas.cancelarCita }));
    await user.type(screen.getByLabelText(messages.citas.motivoCancelacion), "Me surge un viaje");
    await user.click(screen.getByRole("button", { name: messages.citas.confirmarCancelacion }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/citas/c1");
    expect(JSON.parse(opts.body)).toEqual({ accion: "cancel", motivo: "Me surge un viaje" });
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("el botón Volver cierra el formulario sin llamar a la API", async () => {
    const user = userEvent.setup();
    conIntl(<CancelarCitaButton citaId="c1" />);
    await user.click(screen.getByRole("button", { name: messages.citas.cancelarCita }));
    await user.click(screen.getByRole("button", { name: messages.citas.volver }));
    expect(screen.getByRole("button", { name: messages.citas.cancelarCita })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("CitaAccionesPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    refreshMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("marca la visita como realizada", async () => {
    const user = userEvent.setup();
    conIntl(<CitaAccionesPanel citaId="c1" />);
    await user.click(screen.getByRole("button", { name: messages.citas.marcarRealizada }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ accion: "done" });
  });

  it("registra el no-show y muestra error si la API falla", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    conIntl(<CitaAccionesPanel citaId="c1" />);
    await user.click(screen.getByRole("button", { name: messages.citas.marcarNoShow }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ accion: "no_show" });
    expect(await screen.findByText(messages.citas.errorCancelar)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
