import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AppShell } from "./AppShell";

vi.mock("./UserMenu", () => ({ UserMenu: () => <div data-testid="user-menu" /> }));
vi.mock("next/navigation", () => ({ usePathname: () => "/panel" }));

function renderShell(props?: Partial<Parameters<typeof AppShell>[0]>) {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AppShell
        role="shelter"
        onboarding={false}
        status="verified"
        shelterName="Huellas de Esperanza"
        {...props}
      >
        <p>Contenido de la página</p>
      </AppShell>
    </NextIntlClientProvider>,
  );
}

describe("AppShell", () => {
  it("compone cabecera, navegación y contenido", () => {
    renderShell();
    expect(screen.getAllByText(messages.common.appName).length).toBeGreaterThan(0);
    // navegación (Inicio como enlace, protectora verificada)
    expect(screen.getAllByText(messages.shell.navHome).length).toBeGreaterThan(0);
    expect(screen.getByText("Contenido de la página")).toBeInTheDocument();
    expect(screen.getByText(messages.shell.statusVerified)).toBeInTheDocument();
  });

  it("el botón de menú abre el drawer en móvil", async () => {
    renderShell();
    // Antes de abrir no hay diálogo/drawer visible
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: messages.shell.openMenu }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("al abrir el drawer el foco entra en él", async () => {
    renderShell();
    await userEvent.click(screen.getByRole("button", { name: messages.shell.openMenu }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
