import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { LoginForm } from "./LoginForm";

const signInMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword: signInMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { role: "adopter" } })),
        })),
      })),
    })),
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Captcha ACTIVO: el mock dispara un token en cuanto se monta
vi.mock("./Captcha", () => ({
  captchaHabilitado: true,
  Captcha: ({ onVerify }: { onVerify: (t: string) => void }) => {
    onVerify("captcha-token-de-test");
    return <div data-testid="captcha" />;
  },
}));

describe("integración del captcha en el login", () => {
  beforeEach(() => signInMock.mockReset());

  it("envía el captchaToken a Supabase cuando el captcha está activo", async () => {
    signInMock.mockResolvedValue({ error: null });
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <LoginForm />
      </NextIntlClientProvider>,
    );

    await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
    await userEvent.type(
      screen.getByLabelText(messages.auth.password, { exact: true }),
      "Secreta-123!",
    );
    await userEvent.click(screen.getByRole("button", { name: messages.auth.submitLogin }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "Secreta-123!",
        options: { captchaToken: "captcha-token-de-test" },
      });
    });
  });
});
