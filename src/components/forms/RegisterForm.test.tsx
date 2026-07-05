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

vi.mock("./Captcha", () => ({
  Captcha: () => null,
  captchaHabilitado: false,
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RegisterForm />
    </NextIntlClientProvider>,
  );
}

async function rellenarCampos() {
  await userEvent.type(screen.getByLabelText(messages.auth.fullName), "Ana García");
  await userEvent.type(screen.getByLabelText(messages.auth.email), "ana@example.com");
  await userEvent.type(screen.getByLabelText(messages.auth.password), "Secreta-123!");
}

async function aceptarTerminos() {
  await userEvent.click(screen.getByRole("checkbox"));
}

async function enviar() {
  await userEvent.click(
    screen.getByRole("button", { name: messages.auth.submitRegister }),
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    signUpMock.mockReset();
    pushMock.mockReset();
  });

  it("registra un adoptante (tipo por defecto) y redirige a la home", async () => {
    signUpMock.mockResolvedValue({ data: { session: {} }, error: null });
    renderForm();
    await rellenarCampos();
    await aceptarTerminos();
    await enviar();

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "Secreta-123!",
        options: { data: { full_name: "Ana García", role: "adopter" } },
      });
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("registra una protectora al seleccionar su tarjeta y redirige al panel", async () => {
    signUpMock.mockResolvedValue({ data: { session: {} }, error: null });
    renderForm();
    await userEvent.click(
      screen.getByRole("radio", { name: new RegExp(messages.auth.typeShelter) }),
    );
    await rellenarCampos();
    await aceptarTerminos();
    await enviar();

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { data: { full_name: "Ana García", role: "shelter" } },
        }),
      );
      expect(pushMock).toHaveBeenCalledWith("/panel");
    });
  });

  it("no registra sin aceptar la política de privacidad y muestra el error", async () => {
    renderForm();
    await rellenarCampos();
    await enviar();

    expect(
      await screen.findByText(messages.auth.acceptTermsError),
    ).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("alterna la visibilidad de la contraseña", async () => {
    renderForm();
    const password = screen.getByLabelText(messages.auth.password);
    expect(password).toHaveAttribute("type", "password");
    await userEvent.click(
      screen.getByRole("button", { name: messages.auth.showPassword }),
    );
    expect(password).toHaveAttribute("type", "text");
  });

  it("el indicador de fuerza reacciona a la contraseña", async () => {
    renderForm();
    const meter = screen.getByTestId("password-strength");
    expect(meter).toHaveAttribute("data-strength", "0");
    await userEvent.type(
      screen.getByLabelText(messages.auth.password),
      "Secreta-123-Larga",
    );
    expect(meter).toHaveAttribute("data-strength", "3");
  });

  it("redirige a la página de confirmar correo si no hay sesión inmediata", async () => {
    signUpMock.mockResolvedValue({
      data: { session: null, user: { identities: [{ id: "i1" }] } },
      error: null,
    });
    renderForm();
    await rellenarCampos();
    await aceptarTerminos();
    await enviar();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/confirma-correo");
    });
  });

  it("con un email ya registrado muestra un mensaje neutro con enlaces a login y recuperar", async () => {
    // Anti-enumeración de Supabase: éxito falso con identities vacío
    signUpMock.mockResolvedValue({
      data: { session: null, user: { identities: [] } },
      error: null,
    });
    renderForm();
    await rellenarCampos();
    await aceptarTerminos();
    await enviar();

    expect(await screen.findByRole("status")).toHaveTextContent(
      messages.auth.maybeRegistered,
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("con datos inválidos muestra mensajes específicos por campo", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(messages.auth.email), "no-es-email");
    await userEvent.type(
      screen.getByLabelText(messages.auth.password, { exact: true }),
      "solo-letras-aqui",
    );
    await enviar();

    expect(await screen.findByText(messages.auth.errorNameRequired)).toBeInTheDocument();
    expect(screen.getByText(messages.auth.errorEmailInvalid)).toBeInTheDocument();
    expect(screen.getByText(messages.auth.errorPasswordWeak)).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("muestra error genérico si el registro falla (sin revelar si el email existe)", async () => {
    signUpMock.mockResolvedValue({
      data: {},
      error: { message: "User already registered" },
    });
    renderForm();
    await rellenarCampos();
    await aceptarTerminos();
    await enviar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.auth.genericError,
    );
  });
});
