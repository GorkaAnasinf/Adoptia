import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { RecoverForm } from "./RecoverForm";

const resetMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { resetPasswordForEmail: resetMock },
  })),
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RecoverForm />
    </NextIntlClientProvider>,
  );
}

describe("RecoverForm", () => {
  beforeEach(() => resetMock.mockReset());

  it("envía el enlace de recuperación con redirect a /actualizar-password", async () => {
    resetMock.mockResolvedValue({ error: null });
    renderForm();
    await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
    await userEvent.click(screen.getByRole("button", { name: messages.auth.recoverSubmit }));

    await waitFor(() => {
      expect(resetMock).toHaveBeenCalledWith("ana@example.com", {
        redirectTo: expect.stringContaining("/actualizar-password"),
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      messages.auth.recoverSent,
    );
  });

  it("muestra el MISMO mensaje aunque Supabase devuelva error (no revela si el email existe)", async () => {
    resetMock.mockResolvedValue({ error: { message: "user not found" } });
    renderForm();
    await userEvent.type(screen.getByLabelText(messages.auth.email), "nadie@example.com");
    await userEvent.click(screen.getByRole("button", { name: messages.auth.recoverSubmit }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      messages.auth.recoverSent,
    );
  });
});
