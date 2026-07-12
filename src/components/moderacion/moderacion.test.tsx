import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { ReportarButton } from "./ReportarButton";
import { ReporteAcciones } from "./ReporteAcciones";

const fetchMock = vi.fn();

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("ReportarButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset().mockResolvedValue({ status: 201 });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("envía el reporte con categoría y detalles y agradece", async () => {
    const user = userEvent.setup();
    conIntl(<ReportarButton animalId="a1" />);
    await user.click(screen.getByRole("button", { name: messages.moderacion.reportar }));
    await user.selectOptions(
      screen.getByLabelText(messages.moderacion.razon),
      "posible_fraude",
    );
    await user.type(screen.getByLabelText(messages.moderacion.detalles), "Piden Bizum");
    await user.click(screen.getByRole("button", { name: messages.moderacion.enviarReporte }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      animal_id: "a1",
      reason: "posible_fraude",
      details: "Piden Bizum",
    });
    expect(await screen.findByText(messages.moderacion.reporteOk)).toBeInTheDocument();
  });

  it("sin sesión (401) pide iniciar sesión; con tope (429) avisa del límite", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({ status: 401 });
    conIntl(<ReportarButton animalId="a1" />);
    await user.click(screen.getByRole("button", { name: messages.moderacion.reportar }));
    await user.click(screen.getByRole("button", { name: messages.moderacion.enviarReporte }));
    expect(await screen.findByText(messages.moderacion.reporteLogin)).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce({ status: 429 });
    await user.click(screen.getByRole("button", { name: messages.moderacion.enviarReporte }));
    expect(await screen.findByText(messages.moderacion.reporteLimite)).toBeInTheDocument();
  });
});

describe("ReporteAcciones", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    refreshMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("descartar resuelve el reporte por PATCH", async () => {
    const user = userEvent.setup();
    conIntl(<ReporteAcciones reporteId="r1" animalId="a1" publicada />);
    await user.click(screen.getByRole("button", { name: messages.moderacion.descartar }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/reportes/r1");
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body)).toEqual({ accion: "dismissed" });
  });

  it("despublicar pide motivo y encadena moderar + resolver", async () => {
    const user = userEvent.setup();
    conIntl(<ReporteAcciones reporteId="r1" animalId="a1" publicada />);
    await user.click(screen.getByRole("button", { name: messages.moderacion.despublicar }));
    const confirmar = screen.getByRole("button", { name: messages.moderacion.despublicar });
    expect(confirmar).toBeDisabled(); // sin motivo

    await user.type(
      screen.getByLabelText(messages.moderacion.motivoDespublicar),
      "Fotos inadecuadas",
    );
    await user.click(confirmar);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/animales/a1/moderar");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/admin/reportes/r1");
  });

  it("una ficha ya despublicada no ofrece el botón de despublicar", () => {
    conIntl(<ReporteAcciones reporteId="r1" animalId="a1" publicada={false} />);
    expect(
      screen.queryByRole("button", { name: messages.moderacion.despublicar }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.moderacion.marcarRevisado }),
    ).toBeInTheDocument();
  });
});
