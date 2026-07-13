import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { LoginForm } from "./LoginForm";

const signInMock = vi.fn();
const pushMock = vi.fn();

// Rol devuelto por profiles para el usuario logueado
let perfilRole: string | null = "adopter";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword: signInMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: perfilRole ? { role: perfilRole } : null })),
        })),
      })),
    })),
  })),
}));

let redirectParam: string | null = "/panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams(redirectParam === null ? "" : `redirect=${redirectParam}`),
}));

// Captcha desactivado en tests unitarios (sin site key)
vi.mock("./Captcha", () => ({
  Captcha: () => null,
  captchaHabilitado: false,
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <LoginForm />
    </NextIntlClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    signInMock.mockReset();
    pushMock.mockReset();
    redirectParam = "/panel";
    perfilRole = "adopter";
  });

  it("inicia sesión y redirige al destino pedido", async () => {
    signInMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderForm();

    await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
    await userEvent.type(screen.getByLabelText(messages.auth.password), "secreta-123");
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "secreta-123",
      });
      expect(pushMock).toHaveBeenCalledWith("/panel");
    });
  });

  it("muestra error genérico si las credenciales fallan (sin revelar si el email existe)", async () => {
    signInMock.mockResolvedValue({ error: { message: "Invalid login" } });
    renderForm();

    await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
    await userEvent.type(screen.getByLabelText(messages.auth.password), "secreta-123");
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.auth.genericError,
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("protectora sin redirect aterriza en su panel", async () => {
    redirectParam = null;
    perfilRole = "shelter";
    signInMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderForm();
    await userEvent.type(screen.getByLabelText(messages.auth.email), "prote@example.com");
    await userEvent.type(
      screen.getByLabelText(messages.auth.password, { exact: true }),
      "secreta-123",
    );
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/panel");
    });
  });

  it("admin sin redirect aterriza en su área", async () => {
    redirectParam = null;
    perfilRole = "admin";
    signInMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderForm();
    await userEvent.type(screen.getByLabelText(messages.auth.email), "admin@example.com");
    await userEvent.type(
      screen.getByLabelText(messages.auth.password, { exact: true }),
      "secreta-123",
    );
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin");
    });
  });

  it("adoptante sin redirect aterriza en la home", async () => {
    redirectParam = null;
    perfilRole = "adopter";
    signInMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderForm();
    await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
    await userEvent.type(
      screen.getByLabelText(messages.auth.password, { exact: true }),
      "secreta-123",
    );
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("ignora redirects externos (open redirect) y va a la home", async () => {
    redirectParam = "https://evil.com/phishing";
    signInMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderForm();
    await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
    await userEvent.type(
      screen.getByLabelText(messages.auth.password, { exact: true }),
      "secreta-123",
    );
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("enlaza a la recuperación de contraseña", () => {
    renderForm();
    expect(
      screen.getByRole("link", { name: messages.auth.forgotPassword }),
    ).toHaveAttribute("href", "/recuperar");
  });

  it("no llama a Supabase con datos inválidos", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(messages.auth.email), "no-es-email");
    await userEvent.type(screen.getByLabelText(messages.auth.password), "corta");
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    await waitFor(() => {
      expect(screen.getByLabelText(messages.auth.email)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
    expect(signInMock).not.toHaveBeenCalled();
  });
});
