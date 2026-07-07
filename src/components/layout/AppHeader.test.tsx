import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AppHeader } from "./AppHeader";

vi.mock("./UserMenu", () => ({ UserMenu: () => <div data-testid="user-menu" /> }));

function renderHeader(
  onMenuClick = vi.fn(),
  extra?: { hasNotifications?: boolean },
) {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AppHeader
        shelterName="Huellas de Esperanza"
        status="pending"
        crumbs={[{ label: "Panel", href: "/panel" }, { label: "Ubicación" }]}
        onMenuClick={onMenuClick}
        hasNotifications={extra?.hasNotifications}
      />
    </NextIntlClientProvider>,
  );
  return onMenuClick;
}

describe("AppHeader", () => {
  it("muestra marca, nombre de la protectora, migas, badge y menú de usuario", () => {
    renderHeader();
    expect(screen.getByText(messages.common.appName)).toBeInTheDocument();
    expect(screen.getByText("Huellas de Esperanza")).toBeInTheDocument();
    expect(screen.getByText("Ubicación")).toBeInTheDocument();
    expect(screen.getByText(messages.shell.statusPending)).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  it("el botón de menú móvil dispara onMenuClick", async () => {
    const onMenuClick = renderHeader();
    await userEvent.click(screen.getByRole("button", { name: messages.shell.openMenu }));
    expect(onMenuClick).toHaveBeenCalledOnce();
  });

  it("no muestra el punto de notificación por defecto", () => {
    renderHeader(vi.fn(), { hasNotifications: false });
    expect(screen.queryByLabelText(messages.shell.notificationsNew)).not.toBeInTheDocument();
  });

  it("con hasNotifications muestra el indicador de nuevas notificaciones", () => {
    renderHeader(vi.fn(), { hasNotifications: true });
    expect(screen.getByLabelText(messages.shell.notificationsNew)).toBeInTheDocument();
  });
});
