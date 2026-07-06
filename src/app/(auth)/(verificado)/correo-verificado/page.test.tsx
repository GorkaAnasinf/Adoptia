import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";
import CorreoVerificadoPage from "./page";

const { getUserMock, roleSingleMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  roleSingleMock: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string) => {
    const obj = (messages as unknown as Record<string, Record<string, string>>)[ns];
    return obj?.[key] ?? `${ns}.${key}`;
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: roleSingleMock })) })),
    })),
  })),
}));

async function renderPage() {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await CorreoVerificadoPage()}
    </NextIntlClientProvider>,
  );
}

describe("CorreoVerificadoPage", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    roleSingleMock.mockReset();
  });

  it("muestra el título de verificación y el botón Continuar", async () => {
    roleSingleMock.mockResolvedValue({ data: { role: "adopter" } });
    await renderPage();
    expect(
      screen.getByRole("heading", { name: messages.auth.verifiedTitle }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.auth.verifiedContinue })).toBeInTheDocument();
  });

  it("la protectora continúa hacia el panel (que gatea al wizard)", async () => {
    roleSingleMock.mockResolvedValue({ data: { role: "shelter" } });
    await renderPage();
    expect(screen.getByRole("link", { name: messages.auth.verifiedContinue })).toHaveAttribute(
      "href",
      "/panel",
    );
  });

  it("el adoptante continúa hacia la home", async () => {
    roleSingleMock.mockResolvedValue({ data: { role: "adopter" } });
    await renderPage();
    expect(screen.getByRole("link", { name: messages.auth.verifiedContinue })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("sin sesión el botón lleva a login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await renderPage();
    expect(screen.getByRole("link", { name: messages.auth.verifiedContinue })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
