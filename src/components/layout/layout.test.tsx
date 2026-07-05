import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

vi.mock("./UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
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
  it("muestra la marca y el menú de usuario", () => {
    conIntl(<Header />);
    expect(
      screen.getByRole("link", { name: messages.common.appName }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
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
