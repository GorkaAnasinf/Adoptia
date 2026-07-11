import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnlaceExternoPago } from "./EnlaceExternoPago";

const openMock = vi.fn();
const fetchMock = vi.fn();

function renderBoton(registrarUrl?: string) {
  return render(
    <EnlaceExternoPago
      href="https://buy.stripe.com/abc"
      cta="Apadrinar"
      aviso="El pago es directo con la protectora."
      continuar="Entendido, continuar"
      cancelar="Cancelar"
      registrarUrl={registrarUrl}
    />,
  );
}

describe("EnlaceExternoPago", () => {
  beforeEach(() => {
    vi.stubGlobal("open", openMock);
    vi.stubGlobal("fetch", fetchMock);
    openMock.mockReset();
    fetchMock.mockReset().mockResolvedValue({ ok: true });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("muestra el aviso ANTES de abrir el enlace externo", async () => {
    const user = userEvent.setup();
    renderBoton();

    await user.click(screen.getByRole("button", { name: "Apadrinar" }));
    expect(openMock).not.toHaveBeenCalled();
    expect(screen.getByText(/pago es directo con la protectora/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Entendido, continuar" }));
    expect(openMock).toHaveBeenCalledWith(
      "https://buy.stripe.com/abc",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("cancelar no abre nada", async () => {
    const user = userEvent.setup();
    renderBoton();
    await user.click(screen.getByRole("button", { name: "Apadrinar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(openMock).not.toHaveBeenCalled();
  });

  it("registra la intención (métrica) al continuar", async () => {
    const user = userEvent.setup();
    renderBoton("/api/apadrinar/a1");
    await user.click(screen.getByRole("button", { name: "Apadrinar" }));
    await user.click(screen.getByRole("button", { name: "Entendido, continuar" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/apadrinar/a1", { method: "POST" });
  });
});
