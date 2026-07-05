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
import RecuperarPage from "./(public)/recuperar/page";
import ActualizarPasswordPage from "./(public)/actualizar-password/page";
import PrivacidadPage from "./(public)/privacidad/page";
import TerminosPage from "./(public)/terminos/page";

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
vi.mock("@/components/forms/GoogleButton", () => ({
  GoogleButton: () => <div data-testid="google-button" />,
}));
vi.mock("@/components/forms/RecoverForm", () => ({
  RecoverForm: () => <div data-testid="recover-form" />,
}));
vi.mock("@/components/forms/NewPasswordForm", () => ({
  NewPasswordForm: () => <div data-testid="new-password-form" />,
}));
vi.mock("@/components/layout/UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
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

  it("la página de registro incluye Google y el subtítulo del wireframe", () => {
    conIntl(<RegistroPage />);
    expect(screen.getByText(messages.auth.registerSubtitle)).toBeInTheDocument();
    expect(screen.getByTestId("google-button")).toBeInTheDocument();
  });

  it("la página de recuperación muestra título y formulario", () => {
    conIntl(<RecuperarPage />);
    expect(
      screen.getByRole("heading", { name: messages.auth.recoverTitle }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("recover-form")).toBeInTheDocument();
  });

  it("la página de nueva contraseña muestra título y formulario", () => {
    conIntl(<ActualizarPasswordPage />);
    expect(
      screen.getByRole("heading", { name: messages.auth.newPasswordTitle }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("new-password-form")).toBeInTheDocument();
  });

  it("las páginas legales existen con sus títulos", () => {
    conIntl(<PrivacidadPage />);
    expect(
      screen.getByRole("heading", { name: messages.legal.privacyTitle }),
    ).toBeInTheDocument();
    conIntl(<TerminosPage />);
    expect(
      screen.getByRole("heading", { name: messages.legal.termsTitle }),
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
