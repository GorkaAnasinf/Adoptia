import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { NewPasswordForm } from "./NewPasswordForm";

const updateMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { updateUser: updateMock },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <NewPasswordForm />
    </NextIntlClientProvider>,
  );
}

describe("NewPasswordForm", () => {
  beforeEach(() => {
    updateMock.mockReset();
    pushMock.mockReset();
  });

  it("actualiza la contraseña y redirige a login", async () => {
    updateMock.mockResolvedValue({ error: null });
    renderForm();
    await userEvent.type(
      screen.getByLabelText(messages.auth.password),
      "nueva-secreta-123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: messages.auth.newPasswordSubmit }),
    );

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ password: "nueva-secreta-123" });
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("muestra error genérico si falla (p. ej. enlace caducado)", async () => {
    updateMock.mockResolvedValue({ error: { message: "expired" } });
    renderForm();
    await userEvent.type(
      screen.getByLabelText(messages.auth.password),
      "nueva-secreta-123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: messages.auth.newPasswordSubmit }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.auth.genericError,
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
