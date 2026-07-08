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

  it("adoptante: 'Mi cuenta' es enlace y las secciones futuras están deshabilitadas", () => {
    renderSidebar({ role: "adopter", onboarding: false, pathname: "/mi-cuenta" });
    // Mi cuenta activa y enlazada
    const cuenta = screen.getByRole("link", { name: messages.shell.navAccount });
    expect(cuenta).toHaveAttribute("href", "/mi-cuenta");
    // Secciones aún sin desarrollar: presentes pero deshabilitadas (sin enlace)
    for (const clave of ["navMyRequests", "navFavorites", "navMyAppointments", "navMyAlerts"] as const) {
      const etiqueta = messages.shell[clave];
      expect(screen.queryByRole("link", { name: etiqueta })).not.toBeInTheDocument();
      expect(screen.getByText(etiqueta).closest('[aria-disabled="true"]')).not.toBeNull();
    }
  });

  it("admin: muestra la navegación de administración", () => {
    renderSidebar({ role: "admin", onboarding: false, pathname: "/admin/protectoras" });
    const protectoras = screen.getByRole("link", { name: messages.shell.navAdminShelters });
    expect(protectoras).toHaveAttribute("href", "/admin/protectoras");
  });

  it("contactar soporte es un enlace mailto (no un botón deshabilitado)", () => {
    renderSidebar({ role: "shelter", onboarding: false, pathname: "/panel" });
    const soporte = screen.getByRole("link", { name: messages.shell.support });
    expect(soporte.getAttribute("href")).toMatch(/^mailto:/);
  });

  it("muestra un badge con el conteo cuando badges[clave] > 0", () => {
    renderSidebar({
      role: "shelter",
      onboarding: false,
      pathname: "/panel",
      badges: { navHome: 4 },
    });
    expect(screen.getByRole("link", { name: /Inicio/ })).toHaveTextContent("4");
  });

  it("no muestra badge cuando el conteo es 0 o falta", () => {
    renderSidebar({
      role: "shelter",
      onboarding: false,
      pathname: "/panel",
      badges: { navHome: 0 },
    });
    expect(screen.getByRole("link", { name: messages.shell.navHome })).not.toHaveTextContent(
      /\d/,
    );
  });
});
