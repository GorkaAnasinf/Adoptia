import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

import { RetirarSolicitudButton } from "./RetirarSolicitudButton";

const fetchMock = vi.fn();

function renderBoton() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RetirarSolicitudButton solicitudId="req1" />
    </NextIntlClientProvider>,
  );
}

describe("RetirarSolicitudButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("pide confirmación y llama a la API con accion withdraw", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.account.retirar }));

    expect(window.confirm).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/solicitudes/req1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ accion: "withdraw" });
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("si el usuario cancela la confirmación, no llama a la API", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.account.retirar }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si la API falla muestra el error y no refresca", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    renderBoton();

    await user.click(screen.getByRole("button", { name: messages.account.retirar }));
    expect(await screen.findByText(messages.account.retirarError)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
