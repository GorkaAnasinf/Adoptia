import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { AppSidebar } from "./AppSidebar";

function renderSidebar(props: Parameters<typeof AppSidebar>[0]) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AppSidebar {...props} />
    </NextIntlClientProvider>,
  );
}

describe("AppSidebar", () => {
  it("protectora verificada: 'Inicio' es un enlace activo al panel", () => {
    renderSidebar({ role: "shelter", onboarding: false, pathname: "/panel" });
    const inicio = screen.getByRole("link", { name: messages.shell.navHome });
    expect(inicio).toHaveAttribute("href", "/panel");
    expect(inicio).toHaveAttribute("aria-current", "page");
  });

  it("protectora en onboarding: los ítems del panel están deshabilitados (sin enlaces)", () => {
    renderSidebar({ role: "shelter", onboarding: true, pathname: "/panel/alta" });
    expect(screen.queryByRole("link", { name: messages.shell.navHome })).not.toBeInTheDocument();
    expect(
      screen.getByText(messages.shell.navHome).closest('[aria-disabled="true"]'),
    ).not.toBeNull();
  });

  it("admin: muestra la navegación de administración", () => {
    renderSidebar({ role: "admin", onboarding: false, pathname: "/admin/protectoras" });
    const protectoras = screen.getByRole("link", { name: messages.shell.navAdminShelters });
    expect(protectoras).toHaveAttribute("href", "/admin/protectoras");
  });

  it("muestra el botón de contactar soporte", () => {
    renderSidebar({ role: "shelter", onboarding: false, pathname: "/panel" });
    expect(screen.getByText(messages.shell.support)).toBeInTheDocument();
  });
});
