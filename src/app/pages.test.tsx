import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../messages/es.json";
import MiCuentaPage, {
  generateMetadata as metaCuenta,
} from "./(adopter)/mi-cuenta/page";
import PublicLayout from "./(public)/layout";
import LoginPage, { generateMetadata as metaLogin } from "./(public)/login/page";
import RegistroPage, {
  generateMetadata as metaRegistro,
} from "./(public)/registro/page";
import PanelPage, { generateMetadata as metaPanel } from "./(shelter)/panel/page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string) => {
    const obj = (messages as Record<string, Record<string, string>>)[ns];
    return obj?.[key] ?? `${ns}.${key}`;
  }),
}));

vi.mock("@/components/forms/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));
vi.mock("@/components/forms/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form" />,
}));

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("páginas de auth y paneles", () => {
  it("la página de login muestra título y formulario", () => {
    conIntl(<LoginPage />);
    expect(
      screen.getByRole("heading", { name: messages.auth.loginTitle }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("la página de registro muestra título y formulario", () => {
    conIntl(<RegistroPage />);
    expect(
      screen.getByRole("heading", { name: messages.auth.registerTitle }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
  });

  it("el panel de protectora muestra su título", () => {
    conIntl(<PanelPage />);
    expect(
      screen.getByRole("heading", { name: messages.panel.title }),
    ).toBeInTheDocument();
  });

  it("mi cuenta muestra su título", () => {
    conIntl(<MiCuentaPage />);
    expect(
      screen.getByRole("heading", { name: messages.account.title }),
    ).toBeInTheDocument();
  });

  it("cada página define su metadata con título traducido", async () => {
    expect((await metaLogin()).title).toBe(messages.auth.loginTitle);
    expect((await metaRegistro()).title).toBe(messages.auth.registerTitle);
    expect((await metaPanel()).title).toBe(messages.panel.title);
    expect((await metaCuenta()).title).toBe(messages.account.title);
  });

  it("el layout público envuelve el contenido con header y footer", () => {
    conIntl(
      <PublicLayout>
        <p>contenido</p>
      </PublicLayout>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
