import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { RegisterForm } from "./RegisterForm";

const signUpMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signUp: signUpMock },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RegisterForm />
    </NextIntlClientProvider>,
  );
}

async function rellenar() {
  await userEvent.type(screen.getByLabelText(messages.auth.fullName), "Ana García");
  await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
  await userEvent.type(screen.getByLabelText(messages.auth.password), "secreta-123");
  await userEvent.click(
    screen.getByRole("button", { name: messages.auth.submitRegister }),
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    signUpMock.mockReset();
    pushMock.mockReset();
  });

  it("registra con rol adopter y nombre en metadata", async () => {
    signUpMock.mockResolvedValue({ data: { session: {} }, error: null });
    renderForm();
    await rellenar();

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "secreta-123",
        options: { data: { full_name: "Ana García", role: "adopter" } },
      });
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("pide confirmar el email si no hay sesión inmediata", async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    renderForm();
    await rellenar();

    expect(await screen.findByRole("status")).toHaveTextContent(
      messages.auth.checkEmail,
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("muestra error genérico si el registro falla", async () => {
    signUpMock.mockResolvedValue({ data: {}, error: { message: "boom" } });
    renderForm();
    await rellenar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.auth.genericError,
    );
  });
});
