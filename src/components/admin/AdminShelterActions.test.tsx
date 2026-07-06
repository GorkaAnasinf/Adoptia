import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AdminShelterActions } from "./AdminShelterActions";

const { pushRefresh } = vi.hoisted(() => ({ pushRefresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: pushRefresh }) }));

function renderActions() {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AdminShelterActions shelterId="s1" />
    </NextIntlClientProvider>,
  );
}

describe("AdminShelterActions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushRefresh.mockReset();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { status: "verified" } }), { status: 200 }),
    );
  });

  it("verifica llamando al endpoint con acción verify", async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByRole("button", { name: /^verificar$/i }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/admin/protectoras/s1/verificar");
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ accion: "verify" });
  });

  it("rechaza exigiendo motivo antes de enviar", async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByRole("button", { name: /^rechazar$/i }));
    // aparece el campo de motivo; confirmar sin motivo no llama al endpoint
    const confirmar = screen.getByRole("button", { name: /confirmar rechazo/i });
    await user.click(confirmar);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/motivo del rechazo/i), "El CIF no coincide");
    await user.click(confirmar);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
      accion: "reject",
      motivo: "El CIF no coincide",
    });
  });
});
