import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

const roleMock = vi.fn();

vi.mock("./UserMenu", () => ({
  UserMenu: ({ role }: { role?: string | null }) => (
    <div data-testid="user-menu" data-role={role ?? "none"} />
  ),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/lib/user-role", () => ({ getUserRole: () => roleMock() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) =>
    key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], messages) as string,
}));

import messages from "../../../messages/es.json";
import { Footer } from "./Footer";
import { Header } from "./Header";

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Header", () => {
  it("muestra la marca y el menú de usuario", async () => {
    roleMock.mockResolvedValue(null);
    conIntl(await Header());
    expect(
      screen.getByRole("link", { name: messages.common.appName }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  it("pasa el rol de la sesión al menú de usuario", async () => {
    roleMock.mockResolvedValue("shelter");
    conIntl(await Header());
    expect(screen.getByTestId("user-menu")).toHaveAttribute("data-role", "shelter");
  });
});

describe("Footer", () => {
  it("muestra los enlaces legales", () => {
    conIntl(<Footer />);
    expect(
      screen.getByRole("link", { name: messages.footer.privacy }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.footer.terms }),
    ).toBeInTheDocument();
  });
});
